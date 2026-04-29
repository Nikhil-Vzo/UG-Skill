import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  
  // PostgreSQL (Supabase)
  PG_DATABASE_URL: z.string().url(),
  
  // MongoDB
  MONGO_URI: z.string().url(),
  
  // Redis
  REDIS_URL: z.string().url().optional(), // Make optional for local dev if not strictly required yet, but in reality we expect it
  
  // Auth & Security
  JWT_SECRET: z.string().min(32).default('super-secret-key-change-in-production-1234567890'),
  JWT_REFRESH_SECRET: z.string().min(32).default('super-refresh-secret-change-in-production-0987654321'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  
  // Resend Email
  RESEND_API_KEY: z.string().default(''),
  
  // AWS S3 Storage (Removed yuck card details mangta hai loduuu sala)
  
  // Supabase Platform
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().default('ugskill-storage'),
  
  // External AI team endpoint
  AI_EXTERNAL_URL: z.string().url().optional(),

  // Sentry
  SENTRY_DSN: z.string().url().optional(),
});

const parseEnv = () => {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.format());
    process.exit(1);
  }
  
  return parsed.data;
};

export const env = parseEnv();
