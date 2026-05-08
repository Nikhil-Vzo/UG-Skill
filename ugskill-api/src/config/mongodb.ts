import mongoose from 'mongoose';
import { env } from './env';

export const connectMongo = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      autoIndex: process.env.NODE_ENV !== 'production',
      serverSelectionTimeoutMS: 5000,  // fail fast if Mongo is unreachable
      socketTimeoutMS: 10000,          // surface hung writes quickly
      connectTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};
