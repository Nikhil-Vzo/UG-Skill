import { Job } from 'bullmq';
import { logger } from '../lib/logger';
import { APP_EVENTS } from '../lib/events';
import { courseCatalogRepo } from '../modules/course/course-catalog.repository';
import { roadmapCatalogRepo } from '../modules/roadmap/roadmap-catalog.repository';
import { progressRepository } from '../modules/progress/progress.repository';
import { UserSnapshotModel } from '../db/mongo/models/core';
import * as placementRepo from '../modules/placement/placement.repository';
import { db } from '../config/postgres';
import { placementSessions } from '../db/pg/schema/placement';
import { eq, and, sql, avg, count as drizzleCount } from 'drizzle-orm';

export const handleCdcSync = async (job: Job) => {
  const { eventType, payload } = job.data;
  logger.info(`CDC Sync executing for event: ${eventType}`);

  try {
    switch (eventType) {
      // ─── 7.3: Course → course_catalog (Mongo → PG) ────────────
      case APP_EVENTS.COURSE_CREATED:
      case APP_EVENTS.COURSE_UPDATED:
        if (payload.courseId) {
          if (payload.incrementLectures || payload.incrementDuration) {
            // It's a derived stat update
            const currentCatalog = await courseCatalogRepo.getCatalogById(payload.courseId);
            if (currentCatalog) {
              await courseCatalogRepo.upsertCatalog(payload.courseId, {
                lectureCount: (currentCatalog.lectureCount || 0) + (payload.incrementLectures || 0),
                totalDurationSecs: (currentCatalog.totalDurationSecs || 0) + (payload.incrementDuration || 0),
              });
            }
          } else {
            // Full upsert
            const { courseId, ...updateData } = payload;
            await courseCatalogRepo.upsertCatalog(courseId, updateData);
          }
          logger.info(`Synced Course ${payload.courseId} to PG Catalog`);
        }
        break;

      // ─── 7.4: Roadmap → roadmap_catalog (Mongo → PG) ──────────
      case APP_EVENTS.ROADMAP_CREATED:
      case APP_EVENTS.ROADMAP_UPDATED:
        if (payload.roadmapId) {
          if (payload.incrementStage || payload.incrementCourse) {
            // Derived stat update
            const currentCatalog = await roadmapCatalogRepo.getCatalogById(payload.roadmapId);
            if (currentCatalog) {
              await roadmapCatalogRepo.upsertCatalog(payload.roadmapId, {
                stageCount: (currentCatalog.stageCount || 0) + (payload.incrementStage || 0),
                courseCount: (currentCatalog.courseCount || 0) + (payload.incrementCourse || 0),
              });
            }
          } else {
            // Full upsert
            const { roadmapId, ...updateData } = payload;
            await roadmapCatalogRepo.upsertCatalog(roadmapId, updateData);
          }
          logger.info(`Synced Roadmap ${payload.roadmapId} to PG Catalog`);
        }
        break;

      // ─── 7.5: activity_events → progress_summary (Mongo → PG) ─
      case APP_EVENTS.ACTIVITY_COMPLETED:
        await handleActivityToProgress(payload);
        break;

      // ─── 7.6: users → user_snapshots (PG → Mongo) ─────────────
      case APP_EVENTS.USER_REGISTERED:
      case APP_EVENTS.USER_UPDATED:
        await handleUserToSnapshot(payload);
        break;

      // ─── 7.7: scores → readiness_scores (Mongo → PG) ──────────
      case APP_EVENTS.MOCK_SCORED:
      case APP_EVENTS.GD_SCORED:
        await handleScoreToReadiness(payload, eventType);
        break;

      case APP_EVENTS.JOB_POSTED:
        logger.info('Syncing Placement Job data', payload);
        break;
        
      case APP_EVENTS.EXAM_SUBMITTED:
        logger.info('Logging exam attempt or updating scoring materialized views', payload);
        break;

      default:
        logger.warn(`Unknown CDC event type: ${eventType}`);
    }
  } catch (error) {
    logger.error(`CDC Sync Failed for ${eventType}`, error);
    throw error; // Let BullMQ retry
  }
};

// ═══════════════════════════════════════════════════════════════
// 7.5 — activity_events → progress_summary (Mongo → PG)
// ═══════════════════════════════════════════════════════════════
// Payload expected:
//   { studentId, courseId, lectureId, totalLectures, eventType }
// Triggered when a lecture_completion or similar activity event
// is ingested, and we need to materialize progress_summary.
// ═══════════════════════════════════════════════════════════════
async function handleActivityToProgress(payload: {
  studentId: string;
  courseId: string;
  lectureId: string;
  totalLectures?: number;
  watchTimeSecs?: number;
}) {
  const { studentId, courseId, lectureId, totalLectures, watchTimeSecs } = payload;

  if (!studentId || !courseId || !lectureId) {
    logger.warn('activity→progress CDC: missing required fields', payload);
    return;
  }

  // 1. Mark lecture complete (idempotent — skips if already completed)
  const { alreadyCompleted } = await progressRepository.markLectureComplete(
    studentId,
    courseId,
    lectureId
  );

  if (alreadyCompleted) {
    logger.debug(`Lecture ${lectureId} already completed for student ${studentId}, skipping progress update`);
    return;
  }

  // 2. Upsert progress_summary
  const lectureCount = totalLectures ?? 0;
  await progressRepository.upsertProgressSummary(
    studentId,
    courseId,
    lectureCount,
    lectureId
  );

  logger.info(`CDC: progress_summary updated for student=${studentId}, course=${courseId}`);
}

// ═══════════════════════════════════════════════════════════════
// 7.6 — users → user_snapshots (PG → Mongo)
// ═══════════════════════════════════════════════════════════════
// Payload expected:
//   { userId, fullName, institution, branch, cgpa,
//     graduationYear, roles, email }
// Triggered on user.registered and user.updated.
// Upserts user_snapshots in Mongo using pg_user_id as key.
// ═══════════════════════════════════════════════════════════════
async function handleUserToSnapshot(payload: {
  userId: string;
  fullName?: string;
  institution?: string;
  branch?: string;
  cgpa?: number;
  graduationYear?: number;
  roles?: string[];
  email?: string;
}) {
  const { userId, fullName, institution, branch, cgpa, graduationYear, roles } = payload;

  if (!userId) {
    logger.warn('user→snapshot CDC: missing userId', payload);
    return;
  }

  // Upsert the user snapshot in Mongo (findOneAndUpdate with upsert)
  const snapshotData: Record<string, any> = {
    synced_at: new Date(),
  };

  if (fullName !== undefined) snapshotData.full_name = fullName;
  if (institution !== undefined) snapshotData.institution = institution;
  if (branch !== undefined) snapshotData.branch = branch;
  if (cgpa !== undefined) snapshotData.cgpa = cgpa;
  if (graduationYear !== undefined) snapshotData.graduation_year = graduationYear;
  if (roles !== undefined) snapshotData.roles = roles;

  await UserSnapshotModel.findOneAndUpdate(
    { pg_user_id: userId },
    { $set: snapshotData },
    { upsert: true, new: true }
  );

  logger.info(`CDC: user_snapshot synced for userId=${userId}`);
}

// ═══════════════════════════════════════════════════════════════
// 7.7 — scores → readiness_scores (Mongo → PG)
// ═══════════════════════════════════════════════════════════════
// Payload expected:
//   { studentId, companyId, score, maxScore, sessionType,
//     components? }
// Triggered on mock.scored and gd.scored events.
// Aggregates placement session scores for the student+company
// and upserts the readiness_scores table in PG.
// ═══════════════════════════════════════════════════════════════
async function handleScoreToReadiness(
  payload: {
    studentId: string;
    companyId: string;
    score?: number;
    maxScore?: number;
    sessionType?: string;
    components?: Record<string, number>;
  },
  eventType: string
) {
  const { studentId, companyId } = payload;

  if (!studentId || !companyId) {
    logger.warn('score→readiness CDC: missing studentId or companyId', payload);
    return;
  }

  // 1. Aggregate all placement session scores for this student + company
  const sessionAggregation = await db
    .select({
      avgScore: sql<number>`COALESCE(AVG(${placementSessions.score}::numeric), 0)`,
      sessionCount: sql<number>`COUNT(*)::int`,
    })
    .from(placementSessions)
    .where(
      and(
        eq(placementSessions.studentId, studentId),
        eq(placementSessions.companyId, companyId)
      )
    );

  const { avgScore, sessionCount } = sessionAggregation[0] || { avgScore: 0, sessionCount: 0 };

  // 2. Build components breakdown
  // If the event provides explicit component scores, merge them.
  // Otherwise, construct from aggregated data.
  const components = payload.components || {
    [eventType === APP_EVENTS.MOCK_SCORED ? 'mock_interview' : 'group_discussion']: payload.score ?? 0,
    aggregated_avg: Number(avgScore),
  };

  // 3. Compute overall score: weighted average or simple avg
  const overallScore = payload.score
    ? Math.round((Number(payload.score) + Number(avgScore)) / 2)
    : Number(avgScore);

  // 4. Upsert into readiness_scores
  await placementRepo.upsertReadinessScorePg(studentId, companyId, {
    overallScore: String(Math.min(100, Math.max(0, overallScore))),
    components,
    sessionsCount: sessionCount,
  });

  logger.info(
    `CDC: readiness_score updated for student=${studentId}, company=${companyId} (trigger: ${eventType}, overall: ${overallScore})`
  );
}
