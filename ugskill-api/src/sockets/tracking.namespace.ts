import { Namespace, Server as SocketServer } from 'socket.io';
import { AuthenticatedSocket } from './socket.server';
import { logger } from '../lib/logger';
import { examAttemptRepository } from '../modules/exam/exam-attempt.repository';
import { proctoringService } from '../modules/proctoring/proctoring.service';

const normalizeEventType = (eventType: string) => {
  const normalized = eventType.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const aliases: Record<string, string> = {
    tab_switch_detected: 'tab_switch',
    tab_switch: 'tab_switch',
    right_click_blocked: 'copy_paste',
    face_not_detected: 'no_face',
    multiple_faces: 'multiple_faces',
    multiple_people: 'multiple_faces',
    phone_detected: 'phone_detected',
    gaze_away: 'gaze_away',
    talking: 'talking',
  };
  return aliases[normalized] || normalized;
};

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

        try {
          const attempt = await examAttemptRepository.findAttemptById(attemptId);
          await proctoringService.ingestEvent({
            attemptId,
            examId: attempt.examId,
            studentId: attempt.studentId,
            type: normalizeEventType(eventType),
            severity: severity.toUpperCase() as any,
            metadata: {
              ...metadata,
              source: 'tracking-socket',
              originalEventType: eventType,
              emittedBy: userId,
            },
          });
        } catch (err) {
          logger.error(`[/tracking] Failed to persist flag:event for ${attemptId}`, err);
        }

        // Broadcast to all monitors in the room and global admin room
        trackingNS.to(room).emit('flag:alert', alert);
        trackingNS.to('admin:monitoring').emit('flag:alert', alert);
        logger.info(`[/tracking] flag:event type=${eventType} severity=${severity} attemptId=${attemptId} userId=${userId}`);
      }
    );

    // ── Student emits proctoring heartbeat ───────────────────────────────
    socket.on('proctoring:heartbeat', async ({ attemptId }: { attemptId: string }) => {
      if (!attemptId) return;
      try {
        const { default: redis } = await import('../lib/cache');
        if (redis) {
          // Grant a 45 second heartbeat buffer
          await redis.set(`heartbeat:${attemptId}`, 'active', 'EX', 45);
        }
      } catch (err) {
        logger.error(`[/tracking] Failed to process heartbeat for ${attemptId}`, err);
      }
    });

    // ── Admin manually terminates an attempt ─────────────────────────────
    socket.on(
      'admin:terminate',
      async ({ attemptId, reason }: { attemptId: string; reason?: string }) => {
        const isMonitor = roles.includes('admin') || roles.includes('instructor') || roles.includes('proctor');
        if (!isMonitor) {
          socket.emit('error', { message: 'Forbidden: admin only' });
          return;
        }

        try {
          const attempt = await examAttemptRepository.findAttemptById(attemptId);
          if (!attempt) {
            socket.emit('error', { message: 'Attempt not found' });
            return;
          }

          await examAttemptRepository.updateAttempt(attemptId, {
            status: 'terminated',
            proctoringVerdict: 'admin_terminated',
          });

          await proctoringService.ingestEvent({
            attemptId,
            examId: attempt.examId,
            studentId: attempt.studentId,
            type: 'admin_terminate',
            severity: 'CRITICAL',
            metadata: {
              source: 'tracking-socket',
              terminatedBy: userId,
              reason: reason || 'Terminated by admin',
            },
          });

          const room = `tracking:${attemptId}`;
          trackingNS.to(room).emit('proctoring:terminated', {
            attemptId,
            studentId: attempt.studentId,
            reason: reason || 'Terminated by admin',
            terminatedBy: userId,
            timestamp: new Date().toISOString(),
          });
          trackingNS.to('admin:monitoring').emit('proctoring:terminated', {
            attemptId,
            studentId: attempt.studentId,
            reason: reason || 'Terminated by admin',
            terminatedBy: userId,
            timestamp: new Date().toISOString(),
          });

          logger.info(`[/tracking] Admin ${userId} terminated attempt ${attemptId}`, { reason });
        } catch (err: any) {
          socket.emit('error', { message: err.message || 'Failed to terminate' });
        }
      }
    );

    socket.on('disconnect', () => {
      logger.debug(`[/tracking] Disconnected socketId=${socket.id} userId=${userId}`);
    });
  });

  return trackingNS;
}
