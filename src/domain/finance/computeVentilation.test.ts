import { describe, expect, it } from "vitest";
import { computeVentilation } from "./computeVentilation";

describe("computeVentilation()", () => {
  it("applies deductions only to ordinaires/dimes/actionsGrace", () => {
    const v = computeVentilation(
      { ordinaires: 100, orateur: 50, dimes: 200, actionsGrace: 100 },
      10,
    );

    expect(v.orateur.dime).toBe(0);
    expect(v.orateur.social).toBe(0);
    expect(v.orateur.reste).toBe(50);

    // 10% dime + 10% social on 100 => 10 + 10 => reste 80
    expect(v.ordinaires).toEqual({ dime: 10, social: 10, reste: 80 });
  });

  it("produces consistent totals", () => {
    const v = computeVentilation(
      { ordinaires: 123.45, orateur: 0, dimes: 10, actionsGrace: 1 },
      12,
    );

    const totalReste =
      v.ordinaires.reste + v.orateur.reste + v.dimes.reste + v.actionsGrace.reste;
    expect(v.reste).toBeCloseTo(totalReste, 2);

    const totalDime = v.ordinaires.dime + v.dimes.dime + v.actionsGrace.dime;
    expect(v.totalDime).toBeCloseTo(totalDime, 2);

    const totalSocial = v.ordinaires.social + v.dimes.social + v.actionsGrace.social;
    expect(v.totalSocial).toBeCloseTo(totalSocial, 2);
  });
});

