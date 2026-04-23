import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import { env } from '../config/env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UGSkill API',
      version: '1.0.0',
      description:
        'Backend API for the UGSkill platform — LMS, Placement, and Exam management system.',
      contact: {
        name: 'UGSkill Engineering',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: 'Local Development',
      },
      {
        url: 'https://api.ugskill.in/api/v1',
        description: 'Production',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Access token (15m expiry). Obtain from POST /auth/login.',
        },
      },
      schemas: {
        // ── Shared Schemas ───────────────────────────────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'VALIDATION_ERROR' },
                message: { type: 'string', example: 'Invalid request body' },
              },
            },
          },
        },
        PaginatedMeta: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        // ── Auth ─────────────────────────────────────────────────────────
        RegisterBody: {
          type: 'object',
          required: ['email', 'password', 'fullName'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            fullName: { type: 'string' },
            role: { type: 'string', enum: ['student', 'instructor', 'admin'] },
          },
        },
        LoginBody: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
        // ── User ─────────────────────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string' },
            fullName: { type: 'string' },
            roles: {
              type: 'array',
              items: { type: 'string' },
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Exam ─────────────────────────────────────────────────────────
        ExamAttempt: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            examId: { type: 'string', format: 'uuid' },
            studentId: { type: 'string', format: 'uuid' },
            status: {
              type: 'string',
              enum: ['not_started', 'in_progress', 'submitted', 'scored'],
            },
            startedAt: { type: 'string', format: 'date-time' },
            submittedAt: { type: 'string', format: 'date-time', nullable: true },
            violationCount: { type: 'integer' },
          },
        },
        // ── Socket Events (informational) ─────────────────────────────────
        SocketInfo: {
          type: 'object',
          description: 'Socket.io connection info. Not a REST endpoint.',
          properties: {
            namespace: { type: 'string' },
            transport: { type: 'string' },
            auth: { type: 'object', properties: { token: { type: 'string' } } },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
    tags: [
      { name: 'Health', description: 'Service health checks' },
      { name: 'Auth', description: 'Authentication & session management' },
      { name: 'Users', description: 'User profiles' },
      { name: 'Batches', description: 'Batch / cohort management' },
      { name: 'Courses', description: 'LMS — Course CRUD' },
      { name: 'Roadmaps', description: 'LMS — Roadmap CRUD' },
      { name: 'Enrollments', description: 'LMS — Student enrollment' },
      { name: 'Progress', description: 'LMS — Student progress & streaks' },
      { name: 'Quizzes', description: 'LMS — Quiz definitions & attempts' },
      { name: 'Assignments', description: 'LMS — Assignments & grading' },
      { name: 'Reviews', description: 'LMS — Course reviews' },
      { name: 'Certificates', description: 'LMS — Certificate generation' },
      { name: 'Placement', description: 'Placement — Companies, drives, sessions' },
      { name: 'Exams', description: 'Exam — Definitions, attempts, scoring' },
      { name: 'Activity', description: 'Activity event ingestion' },
      { name: 'AI', description: 'AI chat sessions & generated content' },
      { name: 'Sockets', description: 'WebSocket namespace reference (not REST)' },
    ],
  },
  // Pick up all JSDoc @swagger annotations from route files
  apis: ['./src/routes/**/*.ts', './src/modules/**/*.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

/**
 * Mount the Swagger UI at /api/v1/docs
 */
export function setupSwagger(app: Express): void {
  app.use(
    '/api/v1/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'UGSkill API Docs',
      customCss: `.swagger-ui .topbar { display: none }`,
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
      },
    })
  );

  // Also expose the raw JSON spec for tooling
  app.get('/api/v1/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
