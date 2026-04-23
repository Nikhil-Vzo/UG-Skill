import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../lib/logger';

const MAX_RETRIES = 5;

let redisClient: Redis | null = null;
let redisReady = false;

if (env.REDIS_URL) {
  redisClient = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > MAX_RETRIES) {
        logger.warn(`Redis: max retries (${MAX_RETRIES}) reached — giving up. App will run without cache.`);
        return null;           // stop reconnecting
      }
      const delay = Math.min(times * 500, 5000); // 500ms, 1s, 1.5s … max 5s
      logger.info(`Redis: retry #${times} in ${delay}ms`);
      return delay;
    },
  });

  redisClient.on('ready', () => {
    redisReady = true;
    logger.info('✅ Redis connected and ready');
  });

  redisClient.on('end', () => {
    redisReady = false;
    logger.warn('⚠️ Redis connection closed');
  });

  redisClient.on('error', (err) => {
    redisReady = false;
    // Log once, not the full stack trace every retry
    logger.error(`❌ Redis error: ${err.message}`);
  });

  // Attempt connection — non-blocking, won't crash the app
  redisClient.connect().catch(() => {
    logger.warn('⚠️ Redis unavailable at startup — app running without cache');
  });
} else {
  logger.warn('⚠️ REDIS_URL not provided — app running without cache');
}

export const redis = redisClient;
export const isRedisReady = () => redisReady;
