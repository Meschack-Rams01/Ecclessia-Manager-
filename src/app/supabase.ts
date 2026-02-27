import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { K } from "./constants";
import type { Rapport } from "./state";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = importmetaEnvSafe("VITE_SUPABASE_ANON_KEY");

function importmetaEnvSafe(name: string): string | undefined {
  // Small helper so this file stays tree-shake friendly if env vars are missing
  return (import.meta as any).env?.[name] as string | undefined;
}

export const supabase: SupabaseClient | null =
  typeof url === "string" && url && typeof key === "string" && key
    ? createClient(url, key)
    : null;

/**
 * Synchronise les données partagées depuis Supabase vers localStorage.
 * Supabase est la source de vérité; localStorage sert de cache côté client.
 */
export async function syncFromSupabase(showError?: (msg: string) => void): Promise<void> {
  if (!supabase) return;
  try {
    const { data: extRows, error: extErr } = await supabase.from("extensions").select("data");
    if (!extErr && extRows) {
      const exts = extRows.map((r: any) => r.data).filter(Boolean);
      if (exts.length) localStorage.setItem(K.EXT, JSON.stringify(exts));
    }

    const { data: rapRows, error: rapErr } = await supabase.from("rapports").select("data");
    if (!rapErr && rapRows) {
      const raps = rapRows.map((r: any) => r.data as Rapport).filter(Boolean);
      if (raps.length) localStorage.setItem(K.RAP, JSON.stringify(raps));
    }
  } catch (e) {
    console.error("Supabase sync error", e);
    if (showError) showError("Erreur de synchronisation Supabase, données locales utilisées");
  }
}

