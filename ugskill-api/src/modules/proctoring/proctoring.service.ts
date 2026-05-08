import { Server as SocketServer, Namespace } from 'socket.io';
import { ProctoringEventModel } from './proctoring.model';
import { db } from '../../config/postgres';
import { exams, examAttempts } from '../../db/pg/schema/exam';
import { eq, sql } from 'drizzle-orm';
import { logger } from '../../lib/logger';
import { analyzeFrame as callAIAnalyzeFrame } from '../../lib/aiProctoring';

export class ProctoringService {
  private io: SocketServer | null = null;
  private trackingNS: Namespace | null = null;

  /** Register the Socket.io server so we can emit real-time events */
  registerSocketServer(io: SocketServer) {
    this.io = io;
    this.trackingNS = io.of('/tracking');
    logger.info('ProctoringService registered with Socket.io');
  }

  private emitToRoom(room: string, event: string, payload: unknown) {
    if (this.trackingNS) {
      this.trackingNS.to(room).emit(event, payload);
      this.trackingNS.to('admin:monitoring').emit(event, payload);
    }
  }

  /**
   * Loads proctoring configuration from the exams table.
   */
  async getProctoringConfig(examId: string) {
    const rows = await db
      .select({
        gazeThreshold: exams.gazeThreshold,
        faceTimeoutSeconds: exams.faceTimeoutSeconds,
        allowMultipleFaces: exams.allowMultipleFaces,
        autoTerminateScore: exams.autoTerminateScore,
        frameCaptureIntervalSec: exams.frameCaptureIntervalSec,
        isProctored: exams.isProctored,
      })
      .from(exams)
      .where(eq(exams.id, examId))
      .limit(1);
    return rows[0] ?? null;
  }

  /**
   * Ingests a proctoring event, updates cumulative risk score,
   * increments violation count, and checks auto-termination.
   */
  async ingestEvent(data: {
    attemptId: string;
    examId: string;
    studentId: string;
    type: any;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    aiConfidence?: number;
    gazeDirection?: string;
    metadata?: any;
    evidenceUrl?: string;
  }) {
    try {
      // 1. Load exam config for threshold-aware scoring
      const config = await this.getProctoringConfig(data.examId);
      const autoTerminateScore = config?.autoTerminateScore ?? 80;

      // 2. Get current cumulative risk score
      const lastEvent = await ProctoringEventModel.findOne({ attemptId: data.attemptId })
        .sort({ frameTimestamp: -1 })
        .select('riskScoreAtEvent');
      const currentRiskScore = lastEvent ? lastEvent.riskScoreAtEvent : 0;

      // 3. Calculate event risk increment
      const severityScores = {
        'LOW': 5,
        'MEDIUM': 15,
        'HIGH': 40,
        'CRITICAL': 80
      };
      const increment = severityScores[data.severity] || 0;
      const newRiskScore = Math.min(100, currentRiskScore + increment);

      // 4. Save to Mongo
      const event = new ProctoringEventModel({
        ...data,
        riskScoreAtEvent: newRiskScore,
        frameTimestamp: new Date()
      });
      await event.save();

      // 5. Update Postgres violation count
      if (['MEDIUM', 'HIGH', 'CRITICAL'].includes(data.severity)) {
        await db.update(examAttempts)
          .set({ violationCount: sql`${examAttempts.violationCount} + 1` })
          .where(eq(examAttempts.id, data.attemptId));
      }

      // 6. Emit real-time warning to student if MEDIUM+
      if (['MEDIUM', 'HIGH', 'CRITICAL'].includes(data.severity)) {
        const room = `tracking:${data.attemptId}`;
        
        // Fetch updated violation count from DB
        const [updatedAttempt] = await db.select({ violationCount: examAttempts.violationCount })
          .from(examAttempts)
          .where(eq(examAttempts.id, data.attemptId))
          .limit(1);

        this.emitToRoom(room, 'proctoring:warning', {
          attemptId: data.attemptId,
          severity: data.severity,
          type: data.type,
          riskScore: newRiskScore,
          count: updatedAttempt?.violationCount || 0,
          max: config?.gazeThreshold || 5,
          message: `Proctoring alert: ${data.type} (${data.severity})`,
          timestamp: new Date().toISOString(),
        });
      }

      // 7. Check auto-termination against configurable threshold
      if (newRiskScore >= autoTerminateScore || data.severity === 'CRITICAL') {
        logger.warn(`Auto-terminating exam attempt ${data.attemptId}`, {
          studentId: data.studentId,
          riskScore: newRiskScore,
          threshold: autoTerminateScore,
          lastEventType: data.type
        });

        await db.update(examAttempts)
          .set({
            status: 'terminated',
            proctoringVerdict: 'flagged_critical',
            submittedAt: new Date()
          })
          .where(eq(examAttempts.id, data.attemptId));

        // Emit termination to student and admins
        const room = `tracking:${data.attemptId}`;
        this.emitToRoom(room, 'proctoring:terminated', {
          attemptId: data.attemptId,
          studentId: data.studentId,
          reason: 'Auto-terminated due to critical proctoring violation',
          finalRiskScore: newRiskScore,
          timestamp: new Date().toISOString(),
        });
      }

      // 8. Emit AI alert to admins for HIGH/CRITICAL
      if (data.severity === 'HIGH' || data.severity === 'CRITICAL') {
        const room = `tracking:${data.attemptId}`;
        this.emitToRoom(room, 'proctoring:ai-alert', {
          attemptId: data.attemptId,
          studentId: data.studentId,
          severity: data.severity,
          type: data.type,
          riskScore: newRiskScore,
          aiConfidence: data.aiConfidence,
          timestamp: new Date().toISOString(),
        });
      }

      return event;
    } catch (error) {
      logger.error('Failed to ingest proctoring event', { error, attemptId: data.attemptId });
      throw error;
    }
  }

  async getEventsByAttempt(attemptId: string) {
    return ProctoringEventModel.find({ attemptId }).sort({ frameTimestamp: 1 }).lean();
  }

  async getRecentIncidents(limit = 20) {
    return ProctoringEventModel.find({ severity: { $in: ['HIGH', 'CRITICAL'] } })
      .sort({ frameTimestamp: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Synchronous frame analysis (called directly from controller or pre-flight).
   * Queues the frame for async processing if BullMQ is enabled, otherwise runs inline.
   */
  async analyzeFrame(attemptId: string, frameBase64: string, examId?: string, studentId?: string) {
    // Call the real AI client
    const aiResult = await callAIAnalyzeFrame(frameBase64, attemptId);

    if (!aiResult) {
      return { success: true, data: null, message: 'AI API unavailable — exam continues (fail-open)' };
    }

    return {
      success: true,
      data: {
        gaze: aiResult.gaze,
        facePresent: aiResult.facePresent,
        eyesOpen: aiResult.eyesOpen,
        headPose: aiResult.headPose,
        confidence: aiResult.confidence,
      }
    };
  }

  /**
   * Override a proctoring event (admin clears false positive).
   */
  async overrideEvent(attemptId: string, eventId: string, adminId: string, reason: string) {
    const event = await ProctoringEventModel.findByIdAndUpdate(
      eventId,
      { $set: { overriddenBy: adminId, overrideReason: reason } },
      { new: true }
    );
    if (!event) throw new Error('Event not found');
    logger.info(`Proctoring event ${eventId} overridden by admin ${adminId}`, { reason });
    return event;
  }

  /**
   * Get summary for an attempt: total violations, current risk score, event timeline.
   */
  async getAttemptSummary(attemptId: string) {
    const events = await ProctoringEventModel.find({ attemptId })
      .sort({ frameTimestamp: 1 })
      .lean();

    const totalViolations = events.filter(e =>
      ['MEDIUM', 'HIGH', 'CRITICAL'].includes(e.severity) && !e.overriddenBy
    ).length;

    const currentRiskScore = events.length > 0
      ? events[events.length - 1].riskScoreAtEvent
      : 0;

    const avgAiConfidence = events.length > 0
      ? events.reduce((sum, e) => sum + (e.aiConfidence || 0), 0) / events.length
      : 0;

    return {
      attemptId,
      totalViolations,
      currentRiskScore,
      avgAiConfidence: Number(avgAiConfidence.toFixed(2)),
      eventCount: events.length,
      timeline: events.map(e => ({
        id: e._id,
        type: e.type,
        severity: e.severity,
        timestamp: e.frameTimestamp,
        riskScore: e.riskScoreAtEvent,
        aiConfidence: e.aiConfidence,
        overridden: !!e.overriddenBy,
        overrideReason: e.overrideReason,
      })),
    };
  }

  /**
   * Admin report: per-student proctoring data for a given exam.
   */
  async getProctoringReport(examId: string) {
    const events = await ProctoringEventModel.find({ examId }).sort({ frameTimestamp: 1 }).lean();

    // Group by student
    const byStudent = new Map<string, typeof events>();
    for (const e of events) {
      const list = byStudent.get(e.studentId) || [];
      list.push(e);
      byStudent.set(e.studentId, list);
    }

    const report = Array.from(byStudent.entries()).map(([studentId, studentEvents]) => {
      const nonOverridden = studentEvents.filter(e => !e.overriddenBy);
      const violationCount = nonOverridden.filter(e =>
        ['MEDIUM', 'HIGH', 'CRITICAL'].includes(e.severity)
      ).length;
      const riskScore = studentEvents.length > 0
        ? studentEvents[studentEvents.length - 1].riskScoreAtEvent
        : 0;
      const avgConfidence = studentEvents.length > 0
        ? studentEvents.reduce((s, e) => s + (e.aiConfidence || 0), 0) / studentEvents.length
        : 0;

      return {
        studentId,
        violationCount,
        riskScore,
        avgAiConfidence: Number(avgConfidence.toFixed(2)),
        flaggedEvents: nonOverridden.filter(e => e.severity === 'HIGH' || e.severity === 'CRITICAL').map(e => ({
          type: e.type,
          severity: e.severity,
          timestamp: e.frameTimestamp,
          aiConfidence: e.aiConfidence,
        })),
      };
    });

    // Sort by risk score descending
    report.sort((a, b) => b.riskScore - a.riskScore);

    return report;
  }
}

export const proctoringService = new ProctoringService();
