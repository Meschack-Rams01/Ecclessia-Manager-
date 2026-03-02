import type { SupabaseClient } from "@supabase/supabase-js";
import { K, type Extension } from "./constants";
import type { Rapport } from "./state";
import { getSupabaseClient, isSupabaseConfigured as checkSupabaseConfigured } from "../infrastructure/supabase/client";

/**
 * Get the Supabase client (from infrastructure)
 * This ensures only one instance is created
 */
export function getClient(): SupabaseClient {
  return getSupabaseClient();
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return checkSupabaseConfigured();
}

// Legacy export for backward compatibility
// Prefer using getClient() instead
export const supabase: SupabaseClient | null = (() => {
  try {
    return getSupabaseClient();
  } catch {
    return null;
  }
})();

/**
 * Save extension to Supabase (for admin use)
 */
export async function saveExtToSupabase(ext: Extension): Promise<boolean> {
  const client = getClient();
  try {
    const { error } = await client
      .from("extensions")
      .upsert({ id: ext.id, data: ext }, { onConflict: "id" });
    if (error) {
      console.error("Error saving extension to Supabase:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Exception saving extension to Supabase:", e);
    return false;
  }
}

/**
 * Delete extension from Supabase (for admin use)
 */
export async function deleteExtFromSupabase(extId: string): Promise<boolean> {
  const client = getClient();
  try {
    const { error } = await client
      .from("extensions")
      .delete()
      .eq("id", extId);
    if (error) {
      console.error("Error deleting extension from Supabase:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Exception deleting extension from Supabase:", e);
    return false;
  }
}

/**
 * Save rapport to Supabase
 */
export async function saveRapToSupabase(rap: Rapport): Promise<boolean> {
  const client = getClient();
  try {
    const { error } = await client
      .from("rapports")
      .upsert({ id: rap.id, data: rap }, { onConflict: "id" });
    if (error) {
      console.error("Error saving rapport to Supabase:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Exception saving rapport to Supabase:", e);
    return false;
  }
}

/**
 * Delete rapport from Supabase
 */
export async function deleteRapFromSupabase(rapId: string): Promise<boolean> {
  const client = getClient();
  try {
    const { error } = await client
      .from("rapports")
      .delete()
      .eq("id", rapId);
    if (error) {
      console.error("Error deleting rapport from Supabase:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Exception deleting rapport from Supabase:", e);
    return false;
  }
}

/**
 * Subscribe to real-time extension changes
 */
export function subscribeToExtensions(
  onExtChange: (ext: Extension | null, action: "INSERT" | "UPDATE" | "DELETE") => void
): (() => void) | null {
  const client = getClient();

  const channel = client
    .channel("extensions-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "extensions",
      },
      (payload) => {
        if (payload.eventType === "DELETE") {
          onExtChange(null, "DELETE");
        } else if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          const newExt = (payload.new as { id: string; data: Extension })?.data;
          if (newExt) {
            onExtChange(newExt, payload.eventType as "INSERT" | "UPDATE");
          }
        }
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

/**
 * Subscribe to real-time rapport changes
 */
export function subscribeToRapports(
  onRapChange: (rap: Rapport | null, action: "INSERT" | "UPDATE" | "DELETE") => void
): (() => void) | null {
  const client = getClient();

  const channel = client
    .channel("rapports-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "rapports",
      },
      (payload) => {
        if (payload.eventType === "DELETE") {
          onRapChange(null, "DELETE");
        } else if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          const newRap = (payload.new as { id: string; data: Rapport })?.data;
          if (newRap) {
            onRapChange(newRap, payload.eventType as "INSERT" | "UPDATE");
          }
        }
      }
    )
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}

/**
 * Synchronise les données partagées depuis Supabase vers localStorage.
 * Supabase est la source de vérité; localStorage sert de cache côté client.
 */
export async function syncFromSupabase(showError?: (msg: string) => void): Promise<void> {
  const client = getClient();
  try {
    const { data: extRows, error: extErr } = await client.from("extensions").select("data");
    if (!extErr && extRows) {
      const exts = extRows.map((r: any) => r.data).filter(Boolean);
      if (exts.length) localStorage.setItem(K.EXT, JSON.stringify(exts));
    }

    const { data: rapRows, error: rapErr } = await client.from("rapports").select("data");
    if (!rapErr && rapRows) {
      const raps = rapRows.map((r: any) => r.data as Rapport).filter(Boolean);
      if (raps.length) localStorage.setItem(K.RAP, JSON.stringify(raps));
    }
  } catch (e) {
    console.error("Supabase sync error", e);
    if (showError) showError("Erreur de synchronisation Supabase, données locales utilisées");
  }
}
