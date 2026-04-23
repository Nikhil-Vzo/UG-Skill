import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';

const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL)
  : new Redis({ host: '127.0.0.1', port: 6379 });

redis.on('error', (err) => {
  logger.error('Redis Cache Error', err);
});

redis.on('connect', () => {
  logger.info('Connected to Redis Cache');
});

/**
 * Basic Cache Helpers
 */
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      logger.error(`Cache GET failed for key: ${key}`, error);
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      const stringValue = JSON.stringify(value);
      await redis.set(key, stringValue, 'EX', ttlSeconds);
    } catch (error) {
      logger.error(`Cache SET failed for key: ${key}`, error);
    }
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      logger.error(`Cache DEL failed for key: ${key}`, error);
    }
  },

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      logger.error(`Cache DEL Pattern failed for pattern: ${pattern}`, error);
    }
  }
};

/**
 * Cache-aside wrapper
 */
export async function fetchWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  const cachedData = await cache.get<T>(key);
  if (cachedData !== null) {
    logger.debug(`Cache hit for key: ${key}`);
    return cachedData;
  }

  logger.debug(`Cache miss for key: ${key}. Fetching fresh data.`);
  const freshData = await fetchFn();
  await cache.set(key, freshData, ttlSeconds);
  return freshData;
}

export default redis;
