import * as Sentry from '@sentry/react';

export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const envName = import.meta.env.MODE;

  if (!dsn) {
    console.warn('[Sentry] VITE_SENTRY_DSN not set — error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: envName,
    tracesSampleRate: envName === 'production' ? 0.2 : 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Session Replay options
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });

  console.log(`[Sentry] Initialized in ${envName} environment`);
}
