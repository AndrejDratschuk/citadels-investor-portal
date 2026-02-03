import { createClient } from '@supabase/supabase-js';
import { env } from '../../config/env';

// Debug: Log which keys are being used (first 20 chars only for security)
console.log('[Supabase Client Init]');
console.log('  URL:', env.SUPABASE_URL);
console.log('  Anon key starts with:', env.SUPABASE_ANON_KEY?.substring(0, 20));
console.log('  Service role key starts with:', env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20));
console.log('  Keys are different:', env.SUPABASE_ANON_KEY !== env.SUPABASE_SERVICE_ROLE_KEY);

// Service role client for admin operations
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Create a client with a user's access token
export function createSupabaseClient(accessToken: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

