import { Request, Response, NextFunction } from 'express';
import { db } from '../../config/postgres';
import { notificationLogs } from '../../db/pg/schema/exam';
import { eq, desc, and } from 'drizzle-orm';
import { successResponse } from '../../lib/response';

export const notificationsController = {
  /** GET /api/v1/notifications?page=1&limit=20 */
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(50, Number(req.query.limit) || 20);
      const offset = (page - 1) * limit;

      const items = await db
        .select()
        .from(notificationLogs)
        .where(eq(notificationLogs.userId, userId))
        .orderBy(desc(notificationLogs.sentAt))
        .limit(limit)
        .offset(offset);

      // Mark as "read" by returning them — add a read field for frontend
      const enriched = items.map((n) => ({
        ...n,
        read: n.status === 'read',
      }));

      res.json(successResponse(enriched, { page, limit }));
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /api/v1/notifications/:id/read */
  markOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      await db
        .update(notificationLogs)
        .set({ status: 'read' })
        .where(and(eq(notificationLogs.id, id as string), eq(notificationLogs.userId, userId)));

      res.json(successResponse({ id, status: 'read' }));
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /api/v1/notifications/read-all */
  markAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      await db
        .update(notificationLogs)
        .set({ status: 'read' })
        .where(eq(notificationLogs.userId, userId));

      res.json(successResponse({ message: 'All notifications marked as read' }));
    } catch (err) {
      next(err);
    }
  },
};
