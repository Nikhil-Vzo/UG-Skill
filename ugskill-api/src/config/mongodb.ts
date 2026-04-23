import mongoose from 'mongoose';
import { env } from './env';

export const connectMongo = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      autoIndex: process.env.NODE_ENV !== 'production', // Don't auto-build indexes in prod
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};
