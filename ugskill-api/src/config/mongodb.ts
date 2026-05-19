import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../lib/logger';

/** True once Mongoose has successfully connected. Postgres-backed routes remain available even if Mongo is down. */
export let isMongoConnected = false;

export const connectMongo = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      autoIndex: process.env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 5000,  // fail fast if Mongo is unreachable
      socketTimeoutMS: 10000,          // surface hung writes quickly
      connectTimeoutMS: 5000,
    });
    isMongoConnected = true;
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    isMongoConnected = false;
    logger.error('⚠️  MongoDB connection failed — server continuing without MongoDB (Postgres-backed routes remain available)', { error });
    // Do NOT call process.exit(1) here — Postgres-backed routes should remain available (BUG-003)
    return null;
  }
};
