import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_URL : undefined);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (typeof process !== 'undefined' ? process.env.VITE_SUPABASE_ANON_KEY : undefined);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn('Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
}

let supabaseInstance = null;
try {
  if (isSupabaseConfigured) {
    supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    });
  }
} catch (err) {
  console.error('Supabase initialization failed:', err);
}

const mockSupabase = {
  from: () => ({ 
    select: () => ({ 
      order: () => ({ data: [], error: null }),
      eq: () => ({ 
        single: () => ({ data: null, error: null }),
        maybeSingle: () => ({ data: null, error: null }),
        select: () => ({ order: () => ({ data: [], error: null }) })
      }),
      limit: () => ({ single: () => ({ data: null, error: null }) })
    }) 
  }),
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: null, error: { message: 'Supabase no configurado' } }),
    signUp: async () => ({ data: null, error: { message: 'Supabase no configurado' } }),
    signOut: async () => ({ error: null }),
  }
};

export const supabase = supabaseInstance || (mockSupabase as any);
