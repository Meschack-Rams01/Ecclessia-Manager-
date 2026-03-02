/**
 * Domain-level ID factory.
 *
 * Note: for security-sensitive identifiers, prefer server-side UUIDs.
 * For client-side optimistic creation we generate a reasonably unique id.
 */
export function newId(prefix: string): string {
  // Use crypto.randomUUID() if available (more secure, proper UUID)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  // Fallback for older browsers
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${ts}_${rand}`;
}

