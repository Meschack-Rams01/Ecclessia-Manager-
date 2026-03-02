export type ValidationError = {
  path: string;
  message: string;
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: ValidationError[] };

export function ok<T>(value: T): ValidationResult<T> {
  return { ok: true, value };
}

export function fail<T = never>(errors: ValidationError[] | ValidationError): ValidationResult<T> {
  return { ok: false, errors: Array.isArray(errors) ? errors : [errors] };
}

export function mergeResults<T extends Record<string, unknown>>(
  shape: Record<keyof T, ValidationResult<any>>,
): ValidationResult<T> {
  const errors: ValidationError[] = [];
  const value: any = {};
  for (const [k, res] of Object.entries(shape)) {
    if (res.ok) value[k] = res.value;
    else errors.push(...res.errors.map((e) => ({ ...e, path: e.path ? `${String(k)}.${e.path}` : String(k) })));
  }
  return errors.length ? fail(errors) : ok(value as T);
}

export function asTrimmedString(v: unknown): string {
  return typeof v === "string" ? v.trim() : String(v ?? "").trim();
}

export function asFiniteNumber(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

export function validateString(path: string, v: unknown, opts?: { min?: number; max?: number }): ValidationResult<string> {
  const s = asTrimmedString(v);
  if (opts?.min !== undefined && s.length < opts.min) {
    return fail({ path, message: `Must be at least ${opts.min} characters` });
  }
  if (opts?.max !== undefined && s.length > opts.max) {
    return fail({ path, message: `Must be at most ${opts.max} characters` });
  }
  return ok(s);
}

export function validateNumber(
  path: string,
  v: unknown,
  opts?: { min?: number; max?: number; integer?: boolean },
): ValidationResult<number> {
  const n = asFiniteNumber(v);
  if (!Number.isFinite(n)) return fail({ path, message: "Must be a number" });
  if (opts?.integer && !Number.isInteger(n)) return fail({ path, message: "Must be an integer" });
  if (opts?.min !== undefined && n < opts.min) return fail({ path, message: `Must be >= ${opts.min}` });
  if (opts?.max !== undefined && n > opts.max) return fail({ path, message: `Must be <= ${opts.max}` });
  return ok(n);
}

