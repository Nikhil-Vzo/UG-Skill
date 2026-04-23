import { Namespace, Server as SocketServer } from 'socket.io';
import { AuthenticatedSocket } from './socket.server';
import { logger } from '../lib/logger';

/**
 * Registers the /leaderboard namespace — live score push to viewers.
 *
 * After an exam is scored, admins/workers can call `pushScore` to broadcast
 * a ranking update without clients needing to poll.
 *
 * Client events:
 *   - join:leaderboard  { examId }   → subscribe to live ranking updates for this exam
 *
 * Server emits:
 *   - leaderboard:update  { examId, entries: [{ rank, userId, email, score, timeTaken }] }
 *   - leaderboard:new-entry { examId, entry }  — fired when a single new score comes in
 *   - error               { message }
 *
 * Server-side helper (called programmatically):
 *   pushScoreUpdate(io, examId, entries) — broadcast from REST handler / BullMQ worker
 */
export function registerLeaderboardNamespace(io: SocketServer): Namespace {
  const lbNS = io.of('/leaderboard');

  lbNS.on('connection', (socket: AuthenticatedSocket) => {
    const { userId } = socket.data;
    logger.info(`[/leaderboard] Connected userId=${userId} socketId=${socket.id}`);

    // ── Subscribe to an exam's leaderboard ───────────────────────────────
    socket.on('join:leaderboard', async ({ examId }: { examId: string }) => {
      if (!examId) {
        socket.emit('error', { message: 'examId required' });
        return;
      }

      const room = `leaderboard:${examId}`;
      await socket.join(room);
      logger.info(`[/leaderboard] userId=${userId} subscribed to ${room}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`[/leaderboard] Disconnected socketId=${socket.id} userId=${userId}`);
    });
  });

  return lbNS;
}

/**
 * Programmatic helper to push a full leaderboard update.
 * Call this from a BullMQ scoring worker or REST endpoint after new scores land.
 *
 * @param io      The root SocketServer instance
 * @param examId  The exam being updated
 * @param entries Array of ranked entries
 */
export function pushLeaderboardUpdate(
  io: SocketServer,
  examId: string,
  entries: Array<{
    rank: number;
    userId: string;
    email: string;
    score: number;
    timeTakenSecs: number;
  }>
) {
  const room = `leaderboard:${examId}`;
  io.of('/leaderboard').to(room).emit('leaderboard:update', {
    examId,
    entries,
    updatedAt: new Date().toISOString(),
  });
  logger.info(`[/leaderboard] Pushed leaderboard update examId=${examId} entries=${entries.length}`);
}

/**
 * Programmatic helper to push a single new entry (e.g. immediately after one student submits).
 */
export function pushLeaderboardEntry(
  io: SocketServer,
  examId: string,
  entry: {
    rank: number;
    userId: string;
    email: string;
    score: number;
    timeTakenSecs: number;
  }
) {
  const room = `leaderboard:${examId}`;
  io.of('/leaderboard').to(room).emit('leaderboard:new-entry', {
    examId,
    entry,
    timestamp: new Date().toISOString(),
  });
  logger.info(`[/leaderboard] New entry rank=${entry.rank} userId=${entry.userId} examId=${examId}`);
}
