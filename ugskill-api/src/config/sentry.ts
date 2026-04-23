import * as Sentry from '@sentry/node';
import { Express, Request, Response, NextFunction } from 'express';
import { env } from './env';
import { logger } from '../lib/logger';

/**
 * Initialize Sentry. Call this BEFORE any other middleware in app.ts
 * so it can instrument all routes automatically.
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    logger.warn('[Sentry] SENTRY_DSN not set — error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.2 : 1.0,
    // Capture 100% of errors, 20% of traces in production
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
  });

  logger.info(`[Sentry] Initialized in ${env.NODE_ENV} environment`);
}

/**
 * Attach Sentry error handler. Call this AFTER all routes and BEFORE your
 * global error handler so Sentry captures all unhandled errors.
 */
export function attachSentryErrorHandler(app: Express): void {
  // Cast to `any` because Express 5's `use` overloads don't accept the 4-arg
  // error signature directly, but at runtime it works correctly.
  app.use(Sentry.expressErrorHandler() as any);
}
