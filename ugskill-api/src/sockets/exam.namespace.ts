import { Namespace, Server as SocketServer } from 'socket.io';
import { AuthenticatedSocket } from './socket.server';
import { logger } from '../lib/logger';
import redis from '../lib/cache';
import { examAttemptRepository } from '../modules/exam/exam-attempt.repository';
import { examResponseRepository } from '../modules/exam/exam-response.repository';

// Redis key helpers
const timerKey = (attemptId: string) => `timer:${attemptId}`;

/** Seconds remaining stored in Redis. Returns null when no timer set. */
async function getRemaining(attemptId: string): Promise<number | null> {
  const val = await redis.get(timerKey(attemptId));
  return val !== null ? parseInt(val, 10) : null;
}

/** Persist remaining seconds back to Redis with a 1-hour safety TTL */
async function setRemaining(attemptId: string, secs: number): Promise<void> {
  await redis.set(timerKey(attemptId), secs.toString(), 'EX', 3600);
}

/** Remove the timer key once the attempt ends */
async function clearTimer(attemptId: string): Promise<void> {
  await redis.del(timerKey(attemptId));
}

// In-memory map of active intervals (keyed by attemptId)
const activeIntervals = new Map<string, ReturnType<typeof setInterval>>();

/**
 * Registers the /exam namespace.
 *
 * Client events expected:
 *   - join:exam   { attemptId }   → client joins room exam:{attemptId}
 *
 * Server emits:
 *   - timer:init  { remainingSecs }
 *   - timer:tick  { remainingSecs }
 *   - timer:expired
 *   - error       { message }
 */
export function registerExamNamespace(io: SocketServer): Namespace {
  const examNS = io.of('/exam');

  examNS.on('connection', (socket: AuthenticatedSocket) => {
    const { userId } = socket.data;
    logger.info(`[/exam] Connected userId=${userId} socketId=${socket.id}`);

    // ── Client asks to join a specific attempt room ──────────────────────
    socket.on('join:exam', async ({ attemptId }: { attemptId: string }) => {
      if (!attemptId) {
        socket.emit('error', { message: 'attemptId required' });
        return;
      }

      try {
        // Verify ownership — only the attempt owner can join
        const attempt = await examAttemptRepository.findAttemptById(attemptId);
        if (attempt.studentId !== userId) {
          socket.emit('error', { message: 'Forbidden: not your attempt' });
          return;
        }

        // Only in-progress attempts get a live timer
        if (attempt.status !== 'in_progress') {
          socket.emit('error', { message: 'Attempt is not in progress' });
          return;
        }

        const room = `exam:${attemptId}`;
        await socket.join(room);
        logger.info(`[/exam] userId=${userId} joined room ${room}`);

        // ── Determine remaining seconds ──────────────────────────────────
        let remaining = await getRemaining(attemptId);

        if (remaining === null) {
          // First connection for this attempt — seed from exam duration
          const exam = await examAttemptRepository.findAttemptById(attemptId);
          // durationMins stored on the attempt as exam's total duration
          // Fallback: 60 minutes if not stored
          const durationSecs = ((exam as any).durationMins ?? 60) * 60;
          remaining = durationSecs;
          await setRemaining(attemptId, remaining);
        }

        socket.emit('timer:init', { remainingSecs: remaining });

        // ── Start tick interval (only once per attempt, not per socket) ──
        if (!activeIntervals.has(attemptId)) {
          const interval = setInterval(async () => {
            try {
              let secs = await getRemaining(attemptId);
              if (secs === null) {
                clearInterval(interval);
                activeIntervals.delete(attemptId);
                return;
              }

              secs -= 1;

              if (secs <= 0) {
                clearInterval(interval);
                activeIntervals.delete(attemptId);
                await clearTimer(attemptId);

                // ── Auto-submit ──────────────────────────────────────────
                try {
                  await examAttemptRepository.updateAttempt(attemptId, {
                    status: 'submitted',
                    submittedAt: new Date(),
                  });
                  // Finalize Mongo response doc (no new answers at this point)
                  await examResponseRepository.finalize(attemptId);
                  logger.info(`[/exam] Auto-submitted attemptId=${attemptId}`);
                } catch (submitErr) {
                  logger.error(`[/exam] Auto-submit failed for ${attemptId}`, submitErr);
                }

                examNS.to(room).emit('timer:expired');
                return;
              }

              await setRemaining(attemptId, secs);
              examNS.to(room).emit('timer:tick', { remainingSecs: secs });
            } catch (err) {
              logger.error(`[/exam] Tick error for ${attemptId}`, err);
            }
          }, 1000);

          activeIntervals.set(attemptId, interval);
        }
      } catch (err: any) {
        logger.error(`[/exam] join:exam error for userId=${userId}`, err);
        socket.emit('error', { message: err.message || 'Internal error' });
      }
    });

    // ── Clean up on disconnect ────────────────────────────────────────────
    socket.on('disconnect', () => {
      logger.debug(`[/exam] Disconnected socketId=${socket.id} userId=${userId}`);
      // Intervals keep running while any client may still be connected to the room.
      // They are only killed when the timer naturally expires.
    });
  });

  return examNS;
}
