import { Job } from 'bullmq';
import { analyzeFrame, AIAnalysisResult } from '../lib/aiProctoring';
import { proctoringService } from '../modules/proctoring/proctoring.service';
import { logger } from '../lib/logger';
import { db } from '../config/postgres';
import { exams } from '../db/pg/schema/exam';
import { eq } from 'drizzle-orm';

interface AIFrameJobPayload {
  attemptId: string;
  examId: string;
  studentId: string;
  frameBase64: string;
  capturedAt: string;
}

/**
 * Maps AI analysis results to proctoring event type and severity.
 */
function mapAIResultToEvent(ai: AIAnalysisResult): {
  type: 'gaze_away' | 'no_face' | 'multiple_faces' | 'eyes_closed';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata: Record<string, unknown>;
} {
  // CRITICAL: no face detected at all
  if (!ai.facePresent) {
    return {
      type: 'no_face',
      severity: 'CRITICAL',
      metadata: { confidence: ai.confidence, headPose: ai.headPose },
    };
  }

  // HIGH: multiple faces (if not allowed)
  if (ai.facePresent && ai.headPose?.includes('multiple')) {
    return {
      type: 'multiple_faces',
      severity: 'HIGH',
      metadata: { confidence: ai.confidence, headPose: ai.headPose },
    };
  }

  // MEDIUM: eyes closed
  if (!ai.eyesOpen) {
    return {
      type: 'eyes_closed',
      severity: 'MEDIUM',
      metadata: { confidence: ai.confidence, headPose: ai.headPose },
    };
  }

  // LOW/MEDIUM/HIGH based on gaze direction
  if (ai.gaze !== 'center') {
    const severity: 'LOW' | 'MEDIUM' | 'HIGH' =
      ai.gaze === 'down' ? 'LOW' : ai.gaze === 'up' ? 'MEDIUM' : 'HIGH';
    return {
      type: 'gaze_away',
      severity,
      metadata: { gaze: ai.gaze, confidence: ai.confidence, headPose: ai.headPose },
    };
  }

  // Center gaze, face present, eyes open → no violation
  return {
    type: 'gaze_away',
    severity: 'LOW',
    metadata: { gaze: ai.gaze, confidence: ai.confidence, headPose: ai.headPose },
  };
}

/**
 * BullMQ worker handler for AI frame analysis.
 * Called asynchronously when a frame is queued for analysis.
 */
export const handleAiFrameAnalysis = async (job: Job) => {
  const { attemptId, examId, studentId, frameBase64, capturedAt } = job.data as AIFrameJobPayload;

  logger.info(`Processing AI frame analysis job ${job.id}`, { attemptId, examId, studentId });

  try {
    // 1. Call the AI Vision API
    const aiResult = await analyzeFrame(frameBase64, attemptId);

    if (!aiResult) {
      logger.warn('AI analysis returned null (fail-open), skipping event ingestion', { attemptId });
      return { status: 'skipped', reason: 'ai_api_unavailable' };
    }

    // 2. Map AI result to proctoring event
    const event = mapAIResultToEvent(aiResult);

    // 3. Load exam proctoring config for threshold-aware scoring
    const examRows = await db
      .select({
        autoTerminateScore: exams.autoTerminateScore,
        gazeThreshold: exams.gazeThreshold,
        allowMultipleFaces: exams.allowMultipleFaces,
      })
      .from(exams)
      .where(eq(exams.id, examId))
      .limit(1);

    const examConfig = examRows[0];

    // 4. Ingest the event (triggers risk scoring, auto-terminate if needed)
    const savedEvent = await proctoringService.ingestEvent({
      attemptId,
      examId,
      studentId,
      type: event.type,
      severity: event.severity,
      aiConfidence: aiResult.confidence,
      gazeDirection: aiResult.gaze,
      metadata: {
        ...event.metadata,
        capturedAt,
        frameJobId: job.id,
        autoTerminateScore: examConfig?.autoTerminateScore ?? 80,
      },
    });

    logger.info(`AI frame analysis complete for job ${job.id}`, {
      attemptId,
      type: event.type,
      severity: event.severity,
      riskScore: savedEvent.riskScoreAtEvent,
    });

    return {
      status: 'complete',
      type: event.type,
      severity: event.severity,
      riskScore: savedEvent.riskScoreAtEvent,
      aiConfidence: aiResult.confidence,
    };
  } catch (error) {
    logger.error(`AI frame analysis job ${job.id} failed`, { attemptId, error });
    throw error; // Let BullMQ retry
  }
};
