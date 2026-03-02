import type { Rapport } from "../../app/state";
import { computeVentilation, normalizeSocialPct } from "../../domain";
import { err, ok, type Result } from "../result";

/**
 * Use-case: prepare and persist a Rapport.
 *
 * - centralizes ventilation calculation
 * - ensures totals are consistent
 * - stamps updatedAt
 */
export async function upsertRapport(deps: {
  save: (rap: Rapport) => Promise<void>;
  getSocialPct: () => Promise<unknown>; // comes from SettingsRepository or Store
}): Promise<(input: Rapport) => Promise<Result<Rapport>>> {
  const socialPctRes = normalizeSocialPct(await deps.getSocialPct());
  if (!socialPctRes.ok) {
    return async () =>
      err({ code: "SETTINGS_INVALID", message: socialPctRes.errors.map((e) => e.message).join("; ") });
  }
  const socialPct = socialPctRes.value;

  return async (input: Rapport): Promise<Result<Rapport>> => {
    try {
      const off = input.offrandes || {
        ordinaires: 0,
        orateur: 0,
        dimes: 0,
        actionsGrace: 0,
        total: 0,
      };

      const total = (off.ordinaires || 0) + (off.orateur || 0) + (off.dimes || 0) + (off.actionsGrace || 0);
      const ventilation = computeVentilation(
        {
          ordinaires: off.ordinaires || 0,
          orateur: off.orateur || 0,
          dimes: off.dimes || 0,
          actionsGrace: off.actionsGrace || 0,
        },
        socialPct,
      );

      const depenses = input.depenses || [];
      const totalDepenses = depenses.reduce((s, d) => s + (d.montant || 0), 0);
      const soldeFinal = ventilation.reste - totalDepenses;

      const rap: Rapport = {
        ...input,
        offrandes: { ...off, total },
        ventilation,
        totalDepenses,
        soldeFinal,
        updatedAt: new Date().toISOString(),
      };

      await deps.save(rap);
      return ok(rap);
    } catch (cause) {
      return err({ code: "RAPPORT_UPSERT_FAILED", message: "Failed to save rapport", cause });
    }
  };
}

