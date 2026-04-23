import { Namespace, Server as SocketServer } from 'socket.io';
import { AuthenticatedSocket } from './socket.server';
import { logger } from '../lib/logger';
import { ChatMessageModel } from '../db/mongo/models/chat';

/**
 * Registers the /chat namespace.
 *
 * Client events:
 *   - join:room   { room }              → joins a named room (e.g. "gd:sessionId")
 *   - message:send { room, content }   → broadcast + persist to Mongo
 *
 * Server emits:
 *   - message:received  { _id, room, senderId, senderEmail, content, sentAt }
 *   - error             { message }
 */
export function registerChatNamespace(io: SocketServer): Namespace {
  const chatNS = io.of('/chat');

  chatNS.on('connection', (socket: AuthenticatedSocket) => {
    const { userId, email } = socket.data;
    logger.info(`[/chat] Connected userId=${userId} socketId=${socket.id}`);

    // ── Join a chat room ─────────────────────────────────────────────────
    socket.on('join:room', async ({ room }: { room: string }) => {
      if (!room || typeof room !== 'string') {
        socket.emit('error', { message: 'room is required' });
        return;
      }

      await socket.join(room);
      logger.info(`[/chat] userId=${userId} joined room ${room}`);

      // Replay last 50 messages for the joining client
      try {
        const history = await ChatMessageModel
          .find({ room })
          .sort({ sentAt: -1 })
          .limit(50)
          .lean();
        socket.emit('message:history', history.reverse());
      } catch (err) {
        logger.error(`[/chat] History load failed for room=${room}`, err);
      }
    });

    // ── Send a message ───────────────────────────────────────────────────
    socket.on('message:send', async ({ room, content }: { room: string; content: string }) => {
      if (!room || !content?.trim()) {
        socket.emit('error', { message: 'room and content are required' });
        return;
      }

      if (content.length > 4000) {
        socket.emit('error', { message: 'Message exceeds 4000 characters' });
        return;
      }

      try {
        const msg = await ChatMessageModel.create({
          room,
          senderId: userId,
          senderEmail: email,
          content: content.trim(),
          sentAt: new Date(),
        });

        const payload = {
          _id: msg._id,
          room: msg.room,
          senderId: msg.senderId,
          senderEmail: msg.senderEmail,
          content: msg.content,
          sentAt: msg.sentAt,
        };

        // Broadcast to everyone in the room (including sender)
        chatNS.to(room).emit('message:received', payload);
        logger.debug(`[/chat] Message saved _id=${msg._id} room=${room}`);
      } catch (err) {
        logger.error(`[/chat] Failed to save message for userId=${userId}`, err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      logger.debug(`[/chat] Disconnected socketId=${socket.id} userId=${userId}`);
    });
  });

  return chatNS;
}
