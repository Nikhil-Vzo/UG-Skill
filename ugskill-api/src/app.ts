import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { logger } from './lib/logger';
import { errorHandler } from './middleware/errorHandler';
import { requireAuth } from './middleware/auth';
import { requestIdMiddleware } from './middleware/requestId';
import healthRoutes from './routes/health';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import batchRoutes from './modules/batch/batch.routes';
import courseRoutes from './modules/course/course.routes';
import roadmapRoutes from './modules/roadmap/roadmap.routes';
import enrollmentRoutes from './modules/enrollment/enrollment.routes';
import { progressRoutes } from './modules/progress/progress.routes';
import { progressController } from './modules/progress/progress.controller';
import { quizRoutes } from './modules/quiz/quiz.routes';
import { assignmentRoutes } from './modules/assignment/assignment.routes';
import { reviewRoutes } from './modules/review/review.routes';
import { certificateRoutes } from './modules/certificate/certificate.routes';
import placementRoutes from './modules/placement/placement.routes';
import examRoutes from './modules/exam/exam.routes';
import inviteRoutes from './modules/invite/invite.routes';
import adminRoutes from './modules/admin/admin.routes';
import uploadRoutes from './modules/upload/upload.routes';
import { activityRouter } from './modules/activity/activity.routes';
import { aiRouter } from './modules/ai/ai.routes';
import { notificationRoutes } from './modules/notifications/notification.routes';
import { leaderboardRoutes } from './modules/leaderboard/leaderboard.routes';
import { communityRoutes } from './modules/community/community.routes';
import { notesRoutes } from './modules/notes/notes.routes';
import { proctoringRoutes } from './modules/proctoring/proctoring.routes';
import { globalLimiter, authLimiter, uploadLimiter, aiLimiter } from './middleware/rateLimiter';
import { setupSwagger } from './config/swagger';
import { initSentry, attachSentryErrorHandler } from './config/sentry';

// Initialize Sentry FIRST (instruments all subsequent middleware & routes)
initSentry();

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGINS?.split(',') ?? ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Global Rate Limiter
app.use(globalLimiter);

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request ID
app.use(requestIdMiddleware);

// Logging HTTP Requests using Morgan and Winston
app.use(
  morgan(
    ':method :url :status :res[content-length] - :response-time ms - reqId::req[x-request-id]',
    {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    }
  )
);

// Routes
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/batches', batchRoutes);

// LMS Core
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/roadmaps', roadmapRoutes);
app.use('/api/v1/enrollments', enrollmentRoutes);

// LMS Student Experience
app.use('/api/v1/progress', progressRoutes);
app.use('/api/v1/exams', examRoutes);
app.use('/api/v1/placements', placementRoutes);
app.use('/api/v1/admin/invites', inviteRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/quizzes', quizRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/reviews', reviewRoutes);

// Placement & Jobs — /api/v1/placements is the canonical route; /api/v1/jobs is intentionally removed to avoid duplicate router registration

// Activity, AI, and Storage Modules
app.use('/api/v1/activity', activityRouter);
app.use('/api/v1/ai', aiLimiter, aiRouter);
app.use('/api/v1/upload', uploadRoutes);

// Streaks — specific route registered before /lms/streaks wildcard
app.get('/api/v1/lms/streaks/me', requireAuth, progressController.getStreak.bind(progressController));

// Invite Module — canonical route is /api/v1/admin/invites (registered above); root-level duplicate removed (BUG-009)

// ─── Real Module Implementations (replacing stubs) ────────────────────────────
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/leaderboards', leaderboardRoutes);
app.use('/api/v1/community', communityRoutes);
app.use('/api/v1/lms/notes', notesRoutes);
app.use('/api/v1/proctoring', proctoringRoutes);

// ─── Frontend /lms/* and /admin/* aliases ─────────────────────────────────────
// The frontend uses /lms/* prefix for LMS routes and /placements/* for jobs.
app.use('/api/v1/lms/courses', courseRoutes);
app.use('/api/v1/lms/enrollments', enrollmentRoutes);
app.use('/api/v1/lms/quizzes', quizRoutes);
app.use('/api/v1/lms/assignments', assignmentRoutes);
app.use('/api/v1/lms/certificates', certificateRoutes);
// /api/v1/placements already registered above (line 84); duplicate removed (BUG-008)
app.use('/api/v1/admin/users', userRoutes);          // frontend uses /admin/users → /users
app.use('/api/v1/admin/batches', batchRoutes);       // frontend uses /admin/batches → /batches
app.use('/api/v1/admin/exams', examRoutes);          // frontend uses /admin/exams → /exams

// API Docs (Swagger UI)
if (process.env.NODE_ENV !== 'production') {
  setupSwagger(app);
}

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
});

// Sentry Error Handler (must come before the global errorHandler)
attachSentryErrorHandler(app);

// Global Error Handler
app.use(errorHandler);

export default app;
