import { Request, Response } from 'express';
import { db } from '../../config/postgres';
import { examAttempts, exams } from '../../db/pg/schema/exam';
import { eq, desc, and, gte, inArray } from 'drizzle-orm';
import { proctoringService } from '../proctoring/proctoring.service';

export const adminController = {
  getStats: async (req: Request, res: Response) => {
    try {
      // Reasonable mock stats — replace with real queries when analytics module is built
      const stats = {
        totalStudents: 12450,
        activeCourses: 32,
        ongoingPlacements: 14,
        upcomingExams: 3,
        revenueData: [
          { month: 'Jan', revenue: 45000 },
          { month: 'Feb', revenue: 52000 },
          { month: 'Mar', revenue: 48000 },
          { month: 'Apr', revenue: 61000 },
        ],
        recentActivity: [
          { id: 1, action: 'New User Registered', time: '5 mins ago' },
          { id: 2, action: 'Course "React Mastery" updated', time: '2 hours ago' },
          { id: 3, action: 'TCS Placement Drive created', time: '1 day ago' },
        ],
      };
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      console.error('Admin stats error:', error);
      res.status(500).json({ success: false, message: 'Server error retrieving stats' });
    }
  },

  /** GET /api/v1/admin/exams/live — active exam attempts in the last 4 hours */
  getLiveExams: async (req: Request, res: Response) => {
    try {
      const since = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4h window

      const liveAttempts = await db
        .select({
          id: examAttempts.id,
          examId: examAttempts.examId,
          examName: exams.title,
          studentId: examAttempts.studentId,
          status: examAttempts.status,
          startedAt: examAttempts.startedAt,
          violationCount: examAttempts.violationCount,
          proctoringVerdict: examAttempts.proctoringVerdict,
        })
        .from(examAttempts)
        .leftJoin(exams, eq(examAttempts.examId, exams.id))
        .where(
          and(
            eq(examAttempts.status, 'in_progress'),
            gte(examAttempts.startedAt, since)
          )
        )
        .orderBy(desc(examAttempts.startedAt))
        .limit(100);

      const byExam = new Map<string, any>();
      for (const attempt of liveAttempts) {
        const current = byExam.get(attempt.examId) ?? {
          id: attempt.examId,
          examId: attempt.examId,
          name: attempt.examName || `Exam ${attempt.examId.slice(0, 8)}`,
          activeUsers: 0,
          totalWarnings: 0,
          status: 'live',
          attempts: [],
        };
        current.activeUsers += 1;
        current.totalWarnings += Number(attempt.violationCount ?? 0);
        current.attempts.push(attempt);
        byExam.set(attempt.examId, current);
      }

      res.json({ success: true, data: Array.from(byExam.values()) });
    } catch (error) {
      console.error('Admin live exams error:', error);
      res.status(500).json({ success: false, message: 'Error fetching live exams' });
    }
  },

  /** GET /api/v1/admin/exams/incidents/recent — attempts with 1+ violations in last 24h */
  getRecentIncidents: async (req: Request, res: Response) => {
    try {
      const events = await proctoringService.getRecentIncidents(50);
      const examIds = Array.from(new Set(events.map((event: any) => event.examId).filter(Boolean)));
      const examRows = examIds.length
        ? await db.select({ id: exams.id, title: exams.title }).from(exams).where(inArray(exams.id, examIds))
        : [];
      const examNames = new Map(examRows.map((exam) => [exam.id, exam.title]));

      const incidents = events.map((event: any) => ({
        id: String(event._id),
        attemptId: event.attemptId,
        userId: event.studentId,
        userLabel: event.studentId ? `Student ${String(event.studentId).slice(0, 8)}` : 'Unknown student',
        examId: event.examId,
        examName: examNames.get(event.examId) || `Exam ${String(event.examId || '').slice(0, 8)}`,
        type: event.type,
        occurredAt: event.frameTimestamp || event.createdAt,
        severity: String(event.severity || 'LOW').toLowerCase(),
        riskScore: event.riskScoreAtEvent,
        aiConfidence: event.aiConfidence,
        hasEvidence: Boolean(event.snapshotBase64 || event.evidenceUrl),
      }));

      res.json({ success: true, data: incidents });
    } catch (error) {
      console.error('Admin incidents error:', error);
      res.status(500).json({ success: false, message: 'Error fetching incidents' });
    }
  },

  /** GET /api/v1/admin/exams/:examId/proctoring-report */
  getProctoringReport: async (req: Request, res: Response) => {
    try {
      const { examId } = req.params;
      const report = await proctoringService.getProctoringReport(examId as string);
      res.json({ success: true, data: report });
    } catch (error) {
      console.error('Admin proctoring report error:', error);
      res.status(500).json({ success: false, message: 'Error fetching proctoring report' });
    }
  },
};
