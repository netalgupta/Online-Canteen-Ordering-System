/* ==========================================================================
   QueueLess — Supabase client (single shared instance)
   ========================================================================== */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // Surfaced early so a missing .env doesn't fail with a cryptic error later.
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Check your .env file.');
}

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
