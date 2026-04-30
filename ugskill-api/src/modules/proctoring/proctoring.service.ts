import { ProctoringEventModel } from './proctoring.model';
import { db } from '../../config/postgres';
import { examAttempts } from '../../db/pg/schema/exam';
import { eq, sql } from 'drizzle-orm';
import { logger } from '../../lib/logger';

export class ProctoringService {
  /**
   * Ingests a proctoring event, updates the cumulative risk score, 
   * and increments violation count in Postgres if severity is high enough.
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
      // 1. Get current cumulative risk score for this attempt
      const lastEvent = await ProctoringEventModel.findOne({ attemptId: data.attemptId })
        .sort({ frameTimestamp: -1 })
        .select('riskScoreAtEvent');

      const currentRiskScore = lastEvent ? lastEvent.riskScoreAtEvent : 0;
      
      // 2. Calculate event risk increment based on severity
      const severityScores = {
        'LOW': 5,
        'MEDIUM': 15,
        'HIGH': 40,
        'CRITICAL': 80
      };
      
      const increment = severityScores[data.severity] || 0;
      const newRiskScore = Math.min(100, currentRiskScore + increment);

      // 3. Save to Mongo
      const event = new ProctoringEventModel({
        ...data,
        riskScoreAtEvent: newRiskScore,
        frameTimestamp: new Date()
      });
      await event.save();

      // 4. Update Postgres violation count if severity is MEDIUM or higher
      if (['MEDIUM', 'HIGH', 'CRITICAL'].includes(data.severity)) {
        await db.update(examAttempts)
          .set({ 
            violationCount: sql`${examAttempts.violationCount} + 1`
          })
          .where(eq(examAttempts.id, data.attemptId));
      }

      // 5. Check if auto-termination is needed (if risk score >= 100 or CRITICAL)
      if (newRiskScore >= 100 || data.severity === 'CRITICAL') {
        logger.warn(`Auto-terminating exam attempt ${data.attemptId} due to high proctoring risk score`, {
          studentId: data.studentId,
          riskScore: newRiskScore,
          lastEventType: data.type
        });
        
        await db.update(examAttempts)
          .set({ 
            status: 'terminated',
            proctoringVerdict: 'flagged_critical',
            submittedAt: new Date()
          })
          .where(eq(examAttempts.id, data.attemptId));
          
        // Note: In a real system, we'd emit a socket event 'exam:terminated' here
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
   * Placeholder for AI API call to analyze a frame.
   * In a real implementation, this would call an external vision API.
   */
  async analyzeFrame(attemptId: string, frameBase64: string) {
    // This is where we'd hit the AI API
    // For now, we simulate a response
    return {
      success: true,
      data: {
        gaze_away: Math.random() > 0.9,
        eyes_closed: Math.random() > 0.95,
        multiple_faces: Math.random() > 0.98,
        confidence: 0.92
      }
    };
  }
}

export const proctoringService = new ProctoringService();
