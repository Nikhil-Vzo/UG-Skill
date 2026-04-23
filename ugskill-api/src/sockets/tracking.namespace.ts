import { Namespace, Server as SocketServer } from 'socket.io';
import { AuthenticatedSocket } from './socket.server';
import { logger } from '../lib/logger';
import { examAttemptRepository } from '../modules/exam/exam-attempt.repository';

/**
 * Registers the /tracking namespace.
 *
 * Used by the student browser to stream proctoring signals in real-time.
 * The proctor (admin/moderator) subscribes to the same attempt room to
 * receive live alerts.
 *
 * Client events:
 *   - join:tracking   { attemptId }
 *   - flag:event      { attemptId, eventType, severity, metadata? }
 *     eventType examples: 'tab-switch', 'face-not-detected', 'multiple-faces',
 *                         'phone-detected', 'noise-detected'
 *     severity: 'low' | 'medium' | 'high' | 'critical'
 *
 * Server emits:
 *   - flag:alert      { attemptId, eventType, severity, userId, timestamp }
 *   - error           { message }
 */
export function registerTrackingNamespace(io: SocketServer): Namespace {
  const trackingNS = io.of('/tracking');

  trackingNS.on('connection', (socket: AuthenticatedSocket) => {
    const { userId, roles } = socket.data;
    logger.info(`[/tracking] Connected userId=${userId} socketId=${socket.id}`);

    // ── Join global admin monitoring room ───────────────────────────────
    socket.on('join:admin-monitor', async () => {
      const isMonitor = roles.includes('admin') || roles.includes('instructor') || roles.includes('proctor');
      if (!isMonitor) {
        socket.emit('error', { message: 'Forbidden: insufficient role' });
        return;
      }
      await socket.join('admin:monitoring');
      logger.info(`[/tracking] userId=${userId} joined admin:monitoring`);
    });

    // ── Join an attempt's tracking room ──────────────────────────────────
    socket.on('join:tracking', async ({ attemptId }: { attemptId: string }) => {
      if (!attemptId) {
        socket.emit('error', { message: 'attemptId required' });
        return;
      }

      try {
        const attempt = await examAttemptRepository.findAttemptById(attemptId);

        // Students can only join their own attempt room
        const isStudent = roles.includes('student');
        const isMonitor = roles.includes('admin') || roles.includes('instructor') || roles.includes('proctor');

        if (isStudent && attempt.studentId !== userId) {
          socket.emit('error', { message: 'Forbidden: not your attempt' });
          return;
        }

        if (!isStudent && !isMonitor) {
          socket.emit('error', { message: 'Forbidden: insufficient role' });
          return;
        }

        const room = `tracking:${attemptId}`;
        await socket.join(room);
        logger.info(`[/tracking] userId=${userId} role=${isStudent ? 'student' : 'monitor'} joined room ${room}`);
      } catch (err: any) {
        socket.emit('error', { message: err.message || 'Internal error' });
      }
    });

    // ── Student emits a proctoring flag ───────────────────────────────────
    socket.on(
      'flag:event',
      async ({
        attemptId,
        eventType,
        severity,
        metadata,
      }: {
        attemptId: string;
        eventType: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        metadata?: Record<string, unknown>;
      }) => {
        if (!attemptId || !eventType || !severity) {
          socket.emit('error', { message: 'attemptId, eventType, and severity are required' });
          return;
        }

        const validSeverities = ['low', 'medium', 'high', 'critical'];
        if (!validSeverities.includes(severity)) {
          socket.emit('error', { message: 'Invalid severity level' });
          return;
        }

        const room = `tracking:${attemptId}`;
        const alert = {
          attemptId,
          eventType,
          severity,
          userId,
          metadata: metadata ?? {},
          timestamp: new Date().toISOString(),
        };

        // Broadcast to all monitors in the room and global admin room
        trackingNS.to(room).emit('flag:alert', alert);
        trackingNS.to('admin:monitoring').emit('flag:alert', alert);
        logger.info(`[/tracking] flag:event type=${eventType} severity=${severity} attemptId=${attemptId} userId=${userId}`);

        // For high/critical, also increment the violation count in PG
        if (severity === 'high' || severity === 'critical') {
          try {
            await examAttemptRepository.incrementViolation(attemptId);
            logger.info(`[/tracking] Violation incremented for attemptId=${attemptId}`);
          } catch (err) {
            logger.error(`[/tracking] Failed to increment violation for ${attemptId}`, err);
          }
        }
      }
    );

    socket.on('disconnect', () => {
      logger.debug(`[/tracking] Disconnected socketId=${socket.id} userId=${userId}`);
    });
  });

  return trackingNS;
}
