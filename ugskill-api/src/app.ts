import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { logger } from './lib/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId';
import healthRoutes from './routes/health';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import batchRoutes from './modules/batch/batch.routes';
import courseRoutes from './modules/course/course.routes';
import roadmapRoutes from './modules/roadmap/roadmap.routes';
import enrollmentRoutes from './modules/enrollment/enrollment.routes';
import { progressRoutes } from './modules/progress/progress.routes';
import { quizRoutes } from './modules/quiz/quiz.routes';
import { assignmentRoutes } from './modules/assignment/assignment.routes';
import { reviewRoutes } from './modules/review/review.routes';
import { certificateRoutes } from './modules/certificate/certificate.routes';
import placementRoutes from './modules/placement/placement.routes';
import examRoutes from './modules/exam/exam.routes';
import inviteRoutes from './modules/invite/invite.routes';
import adminRoutes from './modules/admin/admin.routes';
import { activityRouter } from './modules/activity/activity.routes';
import { aiRouter } from './modules/ai/ai.routes';
import { globalLimiter, authLimiter, uploadLimiter, aiLimiter } from './middleware/rateLimiter';
import { setupSwagger } from './config/swagger';
import { initSentry, attachSentryErrorHandler } from './config/sentry';

// Initialize Sentry FIRST (instruments all subsequent middleware & routes)
initSentry();

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors()); // Configure origin properly in production

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

// Placement & Jobs
app.use('/api/v1/jobs', placementRoutes);

// Activity and AI Modules
app.use('/api/v1/activity', activityRouter);
app.use('/api/v1/ai', aiLimiter, aiRouter);

// Invite Module
app.use('/api/v1', authLimiter, inviteRoutes);

// ─── Stub Router for Incomplete Modules ──────────────────────────────────────
// Gracefully handles frontend queries for modules that aren't fully implemented
// yet, returning empty arrays or default objects so the UI renders smoothly.
const stubRouter = express.Router();
stubRouter.use((req, res) => {
  // If it's a list/paginated request, return an empty array, else empty object
  const isList = req.query.limit || req.path.includes('courses') || req.path.includes('all');
  res.json({ success: true, data: isList ? [] : {} });
});

// Route to stubs to prevent 404 UI explosions in frontend. 
// MUST BE REGISTERED BEFORE MAIN ALIASES so they don't get swallowed by `/:id` routes.
app.use('/api/v1/leaderboards', stubRouter);
app.use('/api/v1/community', stubRouter);
app.use('/api/v1/notifications', stubRouter);
app.use('/api/v1/lms/streaks', stubRouter);
app.use('/api/v1/lms/notes', stubRouter);
app.use('/api/v1/admin/exams/live', stubRouter);
app.use('/api/v1/admin/exams/incidents/recent', stubRouter);

// The frontend uses /lms/* prefix for LMS routes and /placements/* for jobs.
app.use('/api/v1/lms/courses', courseRoutes);
app.use('/api/v1/lms/enrollments', enrollmentRoutes);
app.use('/api/v1/lms/quizzes', quizRoutes);
app.use('/api/v1/lms/assignments', assignmentRoutes);
app.use('/api/v1/lms/certificates', certificateRoutes);
app.use('/api/v1/placements', placementRoutes);     // frontend uses /placements/*, API registered as /jobs
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
