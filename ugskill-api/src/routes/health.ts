import { Router, Request, Response } from 'express';
import { getPgClient } from '../config/postgres';
import mongoose from 'mongoose';
import { redis } from '../config/redis';
import { successResponse, errorResponse } from '../lib/response';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const health = {
    pg: 'down',
    mongo: 'down',
    redis: 'up', // Assume up unless we have a client that fails
  };

  try {
    // Check PG
    await getPgClient()`SELECT 1`;
    health.pg = 'up';

    // Check Mongo
    if (mongoose.connection.readyState === 1) {
      health.mongo = 'up';
    }

    // Check Redis
    if (redis && redis.status !== 'ready') {
      health.redis = 'down';
    }
    
    if (redis === null) {
        health.redis = 'disabled';
    }

    const isHealthy = health.pg === 'up' && health.mongo === 'up' && (health.redis === 'up' || health.redis === 'disabled');

    res.status(isHealthy ? 200 : 503).json(
      successResponse(health)
    );
  } catch (error: any) {
    res.status(503).json(
      errorResponse('SERVICE_UNAVAILABLE', 'Database connections failing', { error: error.message, health })
    );
  }
});

export default router;
