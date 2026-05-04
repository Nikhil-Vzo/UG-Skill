import { Queue, Worker, QueueOptions, WorkerOptions } from 'bullmq';
import { env } from './env';
import { logger } from '../lib/logger';

// Default connection uses local redis assuming standard 6379, or parsing REDIS_URL
const connection = env.REDIS_URL ? new URL(env.REDIS_URL) : { host: '127.0.0.1', port: 6379 };

const defaultOptions: QueueOptions = {
  connection: {
    host: connection instanceof URL ? connection.hostname : connection.host,
    port: connection instanceof URL ? parseInt(connection.port || '6379', 10) : connection.port,
    password: connection instanceof URL ? connection.password : undefined,
  },
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
