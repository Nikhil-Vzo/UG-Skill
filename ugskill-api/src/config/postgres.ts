import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { env } from './env';
import * as schema from '../db/pg/schema';

// For migrations and schema execution
const queryClient = postgres(env.PG_DATABASE_URL, { max: 10 });
export const db = drizzle(queryClient, { schema });

// Optional: exported for health checks or raw queries
export const getPgClient = () => queryClient;

