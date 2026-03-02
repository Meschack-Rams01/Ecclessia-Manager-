import type { Rapport, RapportOffrandes } from "../../app/state";
import { computeVentilation, normalizeSocialPct } from "../../domain";
import { err, ok, type Result } from "../result";

function calcOffreTotal(entries: { montant: number; tauxChange: number }[] | undefined): number {
  if (!entries || !Array.isArray(entries)) return 0;
  return entries.reduce((sum, e) => sum + (e.montant * e.tauxChange), 0);
}

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
      const off = input.offrandes;
      const extDevise = 'EUR'; // Would need to get from extension

      // Handle both old format (number) and new format (array)
      const ordinaires = Array.isArray(off?.ordinaires) ? calcOffreTotal(off.ordinaires) : (off?.ordinaires || 0);
      const orateur = Array.isArray(off?.orateur) ? calcOffreTotal(off.orateur) : (off?.orateur || 0);
      const dimes = Array.isArray(off?.dimes) ? calcOffreTotal(off.dimes) : (off?.dimes || 0);
      const actionsGrace = Array.isArray(off?.actionsGrace) ? calcOffreTotal(off.actionsGrace) : (off?.actionsGrace || 0);
      
      const total = ordinaires + orateur + dimes + actionsGrace;
      
      // Ensure proper format with arrays
      const offrandes: RapportOffrandes = {
        ordinaires: Array.isArray(off?.ordinaires) ? off.ordinaires : [{ montant: ordinaires, devise: extDevise, tauxChange: 1 }],
        orateur: Array.isArray(off?.orateur) ? off.orateur : [{ montant: orateur, devise: extDevise, tauxChange: 1 }],
        dimes: Array.isArray(off?.dimes) ? off.dimes : [{ montant: dimes, devise: extDevise, tauxChange: 1 }],
        actionsGrace: Array.isArray(off?.actionsGrace) ? off.actionsGrace : [{ montant: actionsGrace, devise: extDevise, tauxChange: 1 }],
        total,
      };

      const ventilation = computeVentilation(
        {
          ordinaires,
          orateur,
          dimes,
          actionsGrace,
        },
        socialPct,
      );

      const depenses = input.depenses || [];
      const totalDepenses = depenses.reduce((s, d) => s + (d.montant || 0), 0);
      const resteFinal = ventilation.reste - totalDepenses;

      const rap: Rapport = {
        ...input,
        offrandes,
        ventilation,
        totalDepenses,
        soldeFinal: resteFinal,
        updatedAt: new Date().toISOString(),
      };

      await deps.save(rap);
      return ok(rap);
    } catch (cause) {
      return err({ code: "RAPPORT_UPSERT_FAILED", message: "Failed to save rapport", cause });
    }
  };
}

