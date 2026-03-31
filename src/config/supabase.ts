import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    // Override the browser Navigator Locks API with a simple no-op implementation.
    // This prevents the "lock stolen" error from hanging the auth state indefinitely
    // in development (Vite HMR, multiple tabs, etc.) and on some older browsers.
    lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
      return fn();
    },
  },
});
