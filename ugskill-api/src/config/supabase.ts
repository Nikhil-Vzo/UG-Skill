import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Initialize the Supabase client with the Service Role Key for backend administrative operations
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
