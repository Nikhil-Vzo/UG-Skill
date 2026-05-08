import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectMongo } from './config/mongodb';
import { logger } from './lib/logger';
import { seedAdmin } from './db/seed-admin';
import { createSocketServer, socketAuthMiddleware } from './sockets/socket.server';
import { registerExamNamespace } from './sockets/exam.namespace';
import { registerChatNamespace } from './sockets/chat.namespace';
import { registerTrackingNamespace } from './sockets/tracking.namespace';
import { registerInterviewNamespace } from './sockets/interview.namespace';
import { registerGdNamespace } from './sockets/gd.namespace';
import { registerLeaderboardNamespace } from './sockets/leaderboard.namespace';
import { proctoringService } from './modules/proctoring/proctoring.service';

const startServer = async () => {
  try {
    // 1. Connect dependencies
    await connectMongo();
    
    // Auto-seed admin user
    await seedAdmin().catch(err => logger.error('Auto-seed Admin failed:', err));

    // 2. Wrap Express in a raw HTTP server so Socket.io can share the port
    const httpServer = http.createServer(app);

    // 3. Boot Socket.io (JWT auth applied globally on root namespace)
    const io = createSocketServer(httpServer);

    // Apply the socket auth middleware to each custom namespace BEFORE registering listeners
    io.of('/exam').use(socketAuthMiddleware);
    io.of('/chat').use(socketAuthMiddleware);
    io.of('/tracking').use(socketAuthMiddleware);
    io.of('/interview').use(socketAuthMiddleware);
    io.of('/gd').use(socketAuthMiddleware);
    io.of('/leaderboard').use(socketAuthMiddleware);

    // 4. Register namespaces
    registerExamNamespace(io);       // /exam        — timer ticks, auto-submit
    registerChatNamespace(io);       // /chat        — room messaging + Mongo persistence
    registerTrackingNamespace(io);   // /tracking    — proctoring flags
    registerInterviewNamespace(io);  // /interview   — 1:1 live interview sessions
    registerGdNamespace(io);         // /gd          — group discussion sessions
    registerLeaderboardNamespace(io); // /leaderboard — live score push to viewers

    // 4b. Register proctoring service with Socket.io for real-time AI alerts
    proctoringService.registerSocketServer(io);

    // 5. Start listening
    httpServer.listen(env.PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
      logger.info('⚡ Socket.io ready on /exam, /chat, /tracking, /interview, /gd, /leaderboard');
    });

    // 6. Graceful Shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);

      io.close(() => {
        logger.info('Socket.io server closed.');
      });

      httpServer.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });

      // Force exit if it takes too long
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
