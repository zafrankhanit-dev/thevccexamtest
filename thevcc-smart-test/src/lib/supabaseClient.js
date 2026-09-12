import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly in dev rather than silently breaking auth later.
  // eslint-disable-next-line no-console
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in your project values.'
  );
}

// IMPORTANT: this is the public "anon" key only. Row Level Security (RLS)
// policies in Supabase are what actually enforce who can read/write what —
// see supabase/schema.sql. The service_role key must NEVER be used here.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Supabase SDK manages this itself in a scoped storage key; we never
    // manually read/write auth tokens to localStorage ourselves.
    storageKey: 'thevcc-smart-test-auth',
  },
});
