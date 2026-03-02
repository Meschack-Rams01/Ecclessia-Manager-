/**
 * Minimal row types to match the current JSONB tables usage.
 *
 * Current code uses tables:
 * - extensions: { id, data }
 * - rapports:   { id, data }
 */
export type JsonRow<T> = {
  id: string;
  data: T;
};

