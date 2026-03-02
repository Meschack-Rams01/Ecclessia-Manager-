export type OfferingBreakdown = {
  ordinaires: number;
  orateur: number;
  dimes: number;
  actionsGrace: number;
};

export type Ventilation = {
  ordinaires: { dime: number; social: number; reste: number };
  orateur: { dime: number; social: number; reste: number };
  dimes: { dime: number; social: number; reste: number };
  actionsGrace: { dime: number; social: number; reste: number };
  totalDime: number;
  totalSocial: number;
  reste: number;
};

function asNumber(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Single source of truth for the "ventilation" business rule.
 *
 * Rules implemented (matching current app behavior):
 * - "Orateur" has NO deductions (dime=0, social=0, reste=amount)
 * - Dîme (10%) applies to ordinaires, dimes, actionsGrace
 * - Social (%) applies to ordinaires, dimes, actionsGrace
 */
export function computeVentilation(input: OfferingBreakdown, socialPct: number): Ventilation {
  const socialRate = asNumber(socialPct) / 100;

  const ord = round2(Math.max(0, asNumber(input.ordinaires)));
  const ora = round2(Math.max(0, asNumber(input.orateur)));
  const dim = round2(Math.max(0, asNumber(input.dimes)));
  const ag = round2(Math.max(0, asNumber(input.actionsGrace)));

  const calc = (amount: number, applyDime: boolean, applySocial: boolean) => {
    const dime = applyDime ? round2(amount * 0.1) : 0;
    const social = applySocial ? round2(amount * socialRate) : 0;
    const reste = round2(amount - dime - social);
    return { dime, social, reste };
  };

  const ordinaires = calc(ord, true, true);
  const orateur = calc(ora, false, false);
  const dimes = calc(dim, true, true);
  const actionsGrace = calc(ag, true, true);

  const totalDime = round2(ordinaires.dime + dimes.dime + actionsGrace.dime);
  const totalSocial = round2(ordinaires.social + dimes.social + actionsGrace.social);
  const reste = round2(ordinaires.reste + orateur.reste + dimes.reste + actionsGrace.reste);

  return {
    ordinaires,
    orateur,
    dimes,
    actionsGrace,
    totalDime,
    totalSocial,
    reste,
  };
}

