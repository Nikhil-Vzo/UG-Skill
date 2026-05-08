import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verifyAccessToken } from '../lib/jwt';
import { logger } from '../lib/logger';

export interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    email: string;
    roles: string[];
  };
}

export const socketAuthMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token =
      (socket.handshake.auth?.token as string) ||
      (socket.handshake.headers.authorization?.split(' ')[1] as string);

    if (!token) {
      logger.warn(`[Socket] Unauthenticated connection attempt from ${socket.handshake.address}`);
      return next(new Error('UNAUTHORIZED: token required'));
    }

    const payload = verifyAccessToken(token);
    (socket as AuthenticatedSocket).data = {
      userId: payload.userId,
      email: payload.email,
      roles: payload.roles,
    };

    logger.debug(`[Socket] Authenticated: userId=${payload.userId} socketId=${socket.id}`);
    next();
  } catch (err) {
    logger.warn(`[Socket] Invalid token from ${socket.handshake.address}`);
    next(new Error('UNAUTHORIZED: invalid token'));
  }
};

/**
 * Creates and configures the Socket.io server.
 * Attaches JWT auth middleware — any socket without a valid Bearer token
 * is disconnected immediately before it reaches a namespace handler.
 */
export function createSocketServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: '*', // tighten in production via env var
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // ── Global JWT Auth Middleware ──────────────────────────────────────────
  io.use(socketAuthMiddleware);

  logger.info('[Socket] Socket.io server initialized');
  return io;
}
