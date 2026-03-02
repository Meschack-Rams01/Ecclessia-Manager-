import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns a Supabase client only if env is configured; otherwise null.
 *
 * Use this to keep the app runnable in local/offline mode without hard failing.
 */
export function tryCreateSupabaseClient(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) return null;
  return createClient(url, key);
}

