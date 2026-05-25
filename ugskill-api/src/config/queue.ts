import { Queue, QueueOptions } from 'bullmq';
import { env } from './env';
import { logger } from '../lib/logger';
import Redis from 'ioredis';

// Connect to Redis when REDIS_URL is provided; otherwise queues are disabled
export const queueConnection = env.REDIS_URL
  ? new Redis(env.REDIS_URL, { maxRetriesPerRequest: null })
  : null;

if (!env.REDIS_URL) {
  logger.warn('⚠️ REDIS_URL not provided — BullMQ queues are disabled');
}

const defaultOptions: QueueOptions | null = queueConnection
  ? {
      connection: queueConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
      },
    }
  : null;

// Queue Definitions — null when Redis is unavailable
export const cdcSyncQueue = defaultOptions ? new Queue('cdc-sync', defaultOptions) : null;
export const notificationQueue = defaultOptions ? new Queue('notifications', defaultOptions) : null;
export const scoringQueue = defaultOptions ? new Queue('scoring', defaultOptions) : null;
export const aiFrameQueue = defaultOptions ? new Queue('ai-frame-analysis', defaultOptions) : null;

// Helper to gracefully shutdown queues
export const closeQueues = async () => {
  logger.info('Closing BullMQ queues...');
  const queues = [cdcSyncQueue, notificationQueue, scoringQueue, aiFrameQueue].filter(Boolean);
  await Promise.all(queues.map((q) => q!.close()));
};
