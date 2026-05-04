import { Worker, Job } from 'bullmq';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { cdcSyncQueue, notificationQueue, aiFrameQueue } from '../config/queue';

// Job handlers
import { handleCdcSync } from './cdcSync.job';
import { handleNotification } from './notification.job';
import { handleAiFrameAnalysis } from './aiFrameAnalysis.job';

const connection = env.REDIS_URL ? new URL(env.REDIS_URL) : { host: '127.0.0.1', port: 6379 };
const redisConnection = {
  host: connection instanceof URL ? connection.hostname : connection.host,
  port: connection instanceof URL ? parseInt(connection.port || '6379', 10) : connection.port,
  password: connection instanceof URL ? connection.password : undefined,
};

export const startWorkers = () => {
  logger.info('Starting BullMQ Workers...');

  // CDC Worker
  const cdcWorker = new Worker(cdcSyncQueue.name, async (job: Job) => {
    logger.info(`Processing CDC Job ${job.id}`, { name: job.name });
    await handleCdcSync(job);
  }, { connection: redisConnection });

  cdcWorker.on('completed', (job) => {
    logger.info(`CDC Job ${job.id} completed successfully`);
  });
  
  cdcWorker.on('failed', (job, err) => {
    logger.error(`CDC Job ${job?.id} failed`, err);
  });

  // Notifications Worker
  const notificationWorker = new Worker(notificationQueue.name, async (job: Job) => {
    await handleNotification(job);
  }, { connection: redisConnection });
  
  notificationWorker.on('failed', (job, err) => {
    logger.error(`Notification Job ${job?.id} failed`, err);
  });

  // AI Frame Analysis Worker
  const aiFrameWorker = new Worker(aiFrameQueue.name, async (job: Job) => {
    logger.info(`Processing AI Frame Job ${job.id}`, { attemptId: job.data.attemptId });
    await handleAiFrameAnalysis(job);
  }, { connection: redisConnection });

  aiFrameWorker.on('completed', (job) => {
    logger.info(`AI Frame Job ${job.id} completed successfully`);
  });

  aiFrameWorker.on('failed', (job, err) => {
    logger.error(`AI Frame Job ${job?.id} failed`, err);
  });
};

