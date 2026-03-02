import { describe, expect, it } from "vitest";
import type { Rapport } from "../../app/state";
import { upsertRapport } from "./upsertRapport";

describe("upsertRapport()", () => {
  it("computes ventilation + totals and calls save", async () => {
    let saved: Rapport | null = null;
    const usecase = await upsertRapport({
      getSocialPct: async () => 10,
      save: async (r) => {
        saved = r;
      },
    });

    const input: Rapport = {
      id: "r1",
      extensionId: "ext1",
      date: "2026-01-01",
      offrandes: { 
        ordinaires: [{ montant: 100, devise: 'EUR', tauxChange: 1 }], 
        orateur: [{ montant: 50, devise: 'EUR', tauxChange: 1 }], 
        dimes: [{ montant: 0, devise: 'EUR', tauxChange: 1 }], 
        actionsGrace: [{ montant: 0, devise: 'EUR', tauxChange: 1 }], 
        total: 0 
      },
      depenses: [{ motif: "x", montant: 10 }],
    };

    const res = await usecase(input);
    expect(res.ok).toBe(true);
    expect(saved).not.toBeNull();
    expect(saved!.offrandes!.total).toBe(150);
    expect(saved!.ventilation!.orateur.reste).toBe(50);
    expect(saved!.totalDepenses).toBe(10);
    expect(saved!.soldeFinal).toBeCloseTo(saved!.ventilation!.reste - 10, 2);
  });
});

