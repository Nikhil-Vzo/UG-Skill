import { Namespace, Server as SocketServer } from 'socket.io';
import { AuthenticatedSocket } from './socket.server';
import { logger } from '../lib/logger';

/**
 * Registers the /interview namespace — for live 1:1 or panel interviews.
 *
 * Client events:
 *   - join:session   { sessionId }         → join room interview:{sessionId}
 *   - notes:update   { sessionId, notes }  → sync private interviewer notes (broadcast to room)
 *   - session:start  { sessionId }         → notify all that interview has begun
 *   - session:end    { sessionId }         → notify all that interview has ended
 *
 * Server emits:
 *   - session:started  { sessionId, startedAt }
 *   - session:ended    { sessionId, endedAt }
 *   - notes:synced     { sessionId, notes, updatedBy }
 *   - participant:joined { userId, email }
 *   - participant:left   { userId }
 *   - error            { message }
 */
export function registerInterviewNamespace(io: SocketServer): Namespace {
  const interviewNS = io.of('/interview');

  // Track participants per session room
  const roomParticipants = new Map<string, Set<string>>();

  interviewNS.on('connection', (socket: AuthenticatedSocket) => {
    const { userId, email, roles } = socket.data;
    logger.info(`[/interview] Connected userId=${userId} socketId=${socket.id}`);

    // ── Join a session room ───────────────────────────────────────────────
    socket.on('join:session', async ({ sessionId }: { sessionId: string }) => {
      if (!sessionId) {
        socket.emit('error', { message: 'sessionId required' });
        return;
      }

      const room = `interview:${sessionId}`;
      await socket.join(room);

      if (!roomParticipants.has(room)) {
        roomParticipants.set(room, new Set());
      }
      roomParticipants.get(room)!.add(userId);

      // Notify others that someone joined
      socket.to(room).emit('participant:joined', { userId, email });
      logger.info(`[/interview] userId=${userId} joined room ${room}. Total: ${roomParticipants.get(room)!.size}`);
    });

    // ── Interviewer updates notes (synced to all in room) ─────────────────
    socket.on('notes:update', ({ sessionId, notes }: { sessionId: string; notes: string }) => {
      if (!sessionId || notes === undefined) {
        socket.emit('error', { message: 'sessionId and notes are required' });
        return;
      }

      const isInstructor = roles.includes('instructor') || roles.includes('admin');
      if (!isInstructor) {
        socket.emit('error', { message: 'Only instructors can sync notes' });
        return;
      }

      const room = `interview:${sessionId}`;
      interviewNS.to(room).emit('notes:synced', {
        sessionId,
        notes,
        updatedBy: userId,
        updatedAt: new Date().toISOString(),
      });
      logger.debug(`[/interview] notes:update by userId=${userId} sessionId=${sessionId}`);
    });

    // ── Start session signal ──────────────────────────────────────────────
    socket.on('session:start', ({ sessionId }: { sessionId: string }) => {
      if (!sessionId) {
        socket.emit('error', { message: 'sessionId required' });
        return;
      }

      const room = `interview:${sessionId}`;
      const startedAt = new Date().toISOString();
      interviewNS.to(room).emit('session:started', { sessionId, startedAt });
      logger.info(`[/interview] session:start emitted for sessionId=${sessionId}`);
    });

    // ── End session signal ────────────────────────────────────────────────
    socket.on('session:end', ({ sessionId }: { sessionId: string }) => {
      if (!sessionId) {
        socket.emit('error', { message: 'sessionId required' });
        return;
      }

      const room = `interview:${sessionId}`;
      const endedAt = new Date().toISOString();
      interviewNS.to(room).emit('session:ended', { sessionId, endedAt });
      logger.info(`[/interview] session:end emitted for sessionId=${sessionId}`);
    });

    // ── WebRTC Signaling ──────────────────────────────────────────────────
    socket.on('webrtc:signal', ({ sessionId, signal }: { sessionId: string; signal: any }) => {
      if (!sessionId || !signal) return;
      const room = `interview:${sessionId}`;
      socket.to(room).emit('webrtc:signal', { signal, senderId: userId });
    });

    // ── Cleanup on disconnect ─────────────────────────────────────────────
    socket.on('disconnect', async () => {
      logger.debug(`[/interview] Disconnected socketId=${socket.id} userId=${userId}`);

      // Notify all rooms this socket was part of
      for (const [room, participants] of roomParticipants.entries()) {
        if (participants.has(userId)) {
          participants.delete(userId);
          socket.to(room).emit('participant:left', { userId });

          // Clean up empty rooms
          if (participants.size === 0) {
            roomParticipants.delete(room);
          }
        }
      }
    });
  });

  return interviewNS;
}
