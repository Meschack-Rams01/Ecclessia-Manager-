import type { Rapport } from "./state";
import { upsertRapport } from "../application";
import {
  LocalStorageExtensionRepository,
  LocalStorageRapportRepository,
  LocalStorageSettingsRepository,
  SupabaseExtensionRepository,
  SupabaseRapportRepository,
} from "../infrastructure";
import { tryCreateSupabaseClient } from "../infrastructure/supabase/tryClient";
import { logger } from "../infrastructure/logger";
import { Store } from "./state";
import type { Extension } from "./constants";

export type AppContext = {
  /** Persist a rapport using the application layer (centralizes business rules). */
  saveRapport: (rap: Rapport) => Promise<{ ok: true } | { ok: false; message: string }>;
  /** Persist an extension (admin). */
  saveExtension: (ext: Extension) => Promise<{ ok: true } | { ok: false; message: string }>;
  /** Delete an extension (admin). */
  deleteExtension: (id: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  /** Info for debugging / UI badges later. */
  dataMode: "supabase" | "local";
};

export async function createAppContext(): Promise<AppContext> {
  const supa = tryCreateSupabaseClient();
  const rapportRepo = supa ? new SupabaseRapportRepository() : new LocalStorageRapportRepository();
  const extRepo = supa ? new SupabaseExtensionRepository() : new LocalStorageExtensionRepository();
  // Not wired into UI yet, but establishes the contract
  void new LocalStorageSettingsRepository();
  const dataMode: AppContext["dataMode"] = supa ? "supabase" : "local";

  const usecase = await upsertRapport({
    save: async (rap) => {
      await rapportRepo.upsert(rap);
    },
    getSocialPct: async () => Store.getSet().socialPct,
  });

  return {
    dataMode,
    saveRapport: async (rap) => {
      const res = await usecase(rap);
      if (res.ok) return { ok: true };
      logger.error("rapport.save.failed", res.error, { code: res.error.code });
      return { ok: false, message: res.error.message };
    },
    saveExtension: async (ext) => {
      try {
        await extRepo.upsert(ext);
        // Keep existing UI cache behavior: update local list immediately
        await new LocalStorageExtensionRepository().upsert(ext);
        return { ok: true };
      } catch (e) {
        logger.error("extension.save.failed", e, { id: ext.id });
        return { ok: false, message: "Failed to save extension" };
      }
    },
    deleteExtension: async (id) => {
      try {
        await extRepo.delete(id);
        await new LocalStorageExtensionRepository().delete(id);
        return { ok: true };
      } catch (e) {
        logger.error("extension.delete.failed", e, { id });
        return { ok: false, message: "Failed to delete extension" };
      }
    },
  };
}

