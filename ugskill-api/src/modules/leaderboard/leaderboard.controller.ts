import { Request, Response, NextFunction } from 'express';
import { db } from '../../config/postgres';
import { examScores, examRankings, exams } from '../../db/pg/schema/exam';
import { progressSummary } from '../../db/pg/schema/lms';
import { users } from '../../db/pg/schema/core';
import { eq, desc } from 'drizzle-orm';
import { successResponse } from '../../lib/response';

export const leaderboardsController = {
  /** GET /api/v1/leaderboards?scope=global&limit=50&examId= */
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = Math.min(100, Number(req.query.limit) || 50);
      const examId = req.query.examId as string | undefined;

      if (examId) {
        // Exam-specific leaderboard from exam_rankings
        const rankings = await db
          .select({
            id: examRankings.id,
            examId: examRankings.examId,
            studentId: examRankings.studentId,
            name: users.fullName,
            rank: examRankings.rank,
            score: examRankings.score,
            change: examRankings.change,
            computedAt: examRankings.computedAt,
          })
          .from(examRankings)
          .innerJoin(users, eq(examRankings.studentId, users.id))
          .where(eq(examRankings.examId, examId))
          .orderBy(examRankings.rank)
          .limit(limit);
        return res.json(successResponse(rankings, { scope: 'exam', examId }));
      }

      // Global leaderboard: top students by avg exam score
      const scores = await db
        .select({
          studentId: examScores.studentId,
          name: users.fullName,
          score: examScores.totalScore,
          percentage: examScores.percentage,
          examId: examScores.examId,
          computedAt: examScores.computedAt,
        })
        .from(examScores)
        .innerJoin(users, eq(examScores.studentId, users.id))
        .orderBy(desc(examScores.percentage))
        .limit(limit);

      res.json(successResponse(scores, { scope: 'global' }));
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/leaderboards/me */
  myRank: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.user!.userId;

      const myScores = await db
        .select()
        .from(examScores)
        .where(eq(examScores.studentId, studentId))
        .orderBy(desc(examScores.computedAt))
        .limit(10);

      const myRankings = await db
        .select()
        .from(examRankings)
        .where(eq(examRankings.studentId, studentId))
        .orderBy(desc(examRankings.computedAt))
        .limit(10);

      res.json(
        successResponse({
          studentId,
          recentScores: myScores,
          rankings: myRankings,
        })
      );
    } catch (err) {
      next(err);
    }
  },
};
