import { describe, expect, it } from "vitest";
import { normalizeSocialPct } from "./validateSocialPct";

describe("normalizeSocialPct()", () => {
  it("defaults to 10 when not provided", () => {
    expect(normalizeSocialPct(undefined)).toEqual({ ok: true, value: 10 });
    expect(normalizeSocialPct(null)).toEqual({ ok: true, value: 10 });
    expect(normalizeSocialPct("")).toEqual({ ok: true, value: 10 });
  });

  it("rejects values out of range", () => {
    expect(normalizeSocialPct(-1).ok).toBe(false);
    expect(normalizeSocialPct(101).ok).toBe(false);
  });
});

