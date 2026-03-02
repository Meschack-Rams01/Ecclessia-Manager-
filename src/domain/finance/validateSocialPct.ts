import { fail, ok, type ValidationResult } from "../validation/validation";

/** Ensure socialPct is in [0..100], defaulting to 10 if undefined/null/empty. */
export function normalizeSocialPct(v: unknown): ValidationResult<number> {
  if (v === undefined || v === null || v === "") return ok(10);
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fail({ path: "socialPct", message: "Must be a number" });
  if (n < 0 || n > 100) return fail({ path: "socialPct", message: "Must be between 0 and 100" });
  return ok(n);
}

