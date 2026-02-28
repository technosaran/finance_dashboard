import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';
import { env } from './env';

/**
 * Supabase client instance with validated environment configuration
 * Throws an error at startup if required environment variables are missing
 */
export const supabase = createClient<Database>(env.supabase.url, env.supabase.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
