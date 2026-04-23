import { Namespace, Server as SocketServer } from 'socket.io';
import { AuthenticatedSocket } from './socket.server';
import { logger } from '../lib/logger';

/**
 * Registers the /gd namespace — Group Discussion live sessions.
 *
 * Client events:
 *   - join:gd        { gdSessionId }                → join room gd:{gdSessionId}
 *   - gd:speak       { gdSessionId, durationSecs }  → participant talking update
 *   - gd:score       { gdSessionId, participantId, score, feedback }  → moderator scores a participant
 *   - gd:end         { gdSessionId }                → moderator ends session
 *
 * Server emits:
 *   - gd:participant-joined   { userId, email }
 *   - gd:participant-left     { userId }
 *   - gd:speaking             { userId, durationSecs }
 *   - gd:scored               { participantId, score, feedback, scoredBy }
 *   - gd:ended                { gdSessionId, endedAt }
 *   - error                   { message }
 */
export function registerGdNamespace(io: SocketServer): Namespace {
  const gdNS = io.of('/gd');

  // Track per-session participants { room → Set<userId> }
  const roomParticipants = new Map<string, Set<string>>();

  gdNS.on('connection', (socket: AuthenticatedSocket) => {
    const { userId, email, roles } = socket.data;
    logger.info(`[/gd] Connected userId=${userId} socketId=${socket.id}`);

    // ── Join a GD session room ────────────────────────────────────────────
    socket.on('join:gd', async ({ gdSessionId }: { gdSessionId: string }) => {
      if (!gdSessionId) {
        socket.emit('error', { message: 'gdSessionId required' });
        return;
      }

      const room = `gd:${gdSessionId}`;
      await socket.join(room);

      if (!roomParticipants.has(room)) {
        roomParticipants.set(room, new Set());
      }
      roomParticipants.get(room)!.add(userId);

      socket.to(room).emit('gd:participant-joined', { userId, email });
      logger.info(`[/gd] userId=${userId} joined room ${room}. Total: ${roomParticipants.get(room)!.size}`);
    });

    // ── Participant speaking update ────────────────────────────────────────
    socket.on('gd:speak', ({ gdSessionId, durationSecs }: { gdSessionId: string; durationSecs: number }) => {
      if (!gdSessionId || durationSecs === undefined) {
        socket.emit('error', { message: 'gdSessionId and durationSecs required' });
        return;
      }

      const room = `gd:${gdSessionId}`;
      gdNS.to(room).emit('gd:speaking', {
        userId,
        durationSecs,
        timestamp: new Date().toISOString(),
      });
    });

    // ── Moderator scores a participant ────────────────────────────────────
    socket.on(
      'gd:score',
      ({
        gdSessionId,
        participantId,
        score,
        feedback,
      }: {
        gdSessionId: string;
        participantId: string;
        score: number;
        feedback?: string;
      }) => {
        const isModerator = roles.includes('admin') || roles.includes('instructor');
        if (!isModerator) {
          socket.emit('error', { message: 'Only moderators can submit scores' });
          return;
        }

        if (!gdSessionId || !participantId || score === undefined) {
          socket.emit('error', { message: 'gdSessionId, participantId, and score are required' });
          return;
        }

        const room = `gd:${gdSessionId}`;
        gdNS.to(room).emit('gd:scored', {
          participantId,
          score,
          feedback: feedback ?? '',
          scoredBy: userId,
          scoredAt: new Date().toISOString(),
        });
        logger.info(`[/gd] Scored participantId=${participantId} score=${score} in sessionId=${gdSessionId}`);
      }
    );

    // ── Moderator ends the GD session ─────────────────────────────────────
    socket.on('gd:end', ({ gdSessionId }: { gdSessionId: string }) => {
      const isModerator = roles.includes('admin') || roles.includes('instructor');
      if (!isModerator) {
        socket.emit('error', { message: 'Only moderators can end the session' });
        return;
      }

      if (!gdSessionId) {
        socket.emit('error', { message: 'gdSessionId required' });
        return;
      }

      const room = `gd:${gdSessionId}`;
      gdNS.to(room).emit('gd:ended', {
        gdSessionId,
        endedAt: new Date().toISOString(),
      });
      roomParticipants.delete(room);
      logger.info(`[/gd] Session ended gdSessionId=${gdSessionId} by userId=${userId}`);
    });

    // ── Cleanup on disconnect ─────────────────────────────────────────────
    socket.on('disconnect', async () => {
      logger.debug(`[/gd] Disconnected socketId=${socket.id} userId=${userId}`);

      for (const [room, participants] of roomParticipants.entries()) {
        if (participants.has(userId)) {
          participants.delete(userId);
          socket.to(room).emit('gd:participant-left', { userId });

          if (participants.size === 0) {
            roomParticipants.delete(room);
          }
        }
      }
    });
  });

  return gdNS;
}
