import { Queue, QueueOptions } from 'bullmq';
import { env } from './env';
import { logger } from '../lib/logger';
import Redis from 'ioredis';

// Default connection uses real Redis in production, falls back to ioredis-mock for local dev
export const queueConnection = env.REDIS_URL
  ? new Redis(env.REDIS_URL, { maxRetriesPerRequest: null })
  : new (require('ioredis-mock').default)();

if (!env.REDIS_URL) {
  logger.warn('⚠️ REDIS_URL not provided — using ioredis-mock for BullMQ queues');
}

const defaultOptions: QueueOptions = {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
  },
};

// Queue Definitions
export const cdcSyncQueue = new Queue('cdc-sync', defaultOptions);
export const notificationQueue = new Queue('notifications', defaultOptions);
export const scoringQueue = new Queue('scoring', defaultOptions);
export const aiFrameQueue = new Queue('ai-frame-analysis', defaultOptions);

// Helper to gracefully shutdown queues
export const closeQueues = async () => {
  logger.info('Closing BullMQ queues...');
  await Promise.all([
    cdcSyncQueue.close(),
    notificationQueue.close(),
    scoringQueue.close(),
    aiFrameQueue.close(),
  ]);
};
