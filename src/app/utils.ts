export function fmt(v: unknown, sym = ""): string {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "")) || 0;
  return (
    sym +
    n.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

// Turkish Lira format: ₺ 1 850,00 (space as thousands separator, comma as decimal)
export function fmtTRY(v: unknown): string {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "")) || 0;
  return "₺ " + n.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtD(d?: string | null): string {
  if (!d) return "—";
  try {
    return new Date(d + "T00:00").toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export function uid(): string {
  return "r_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
}

export function mName(m: number): string {
  return new Date(2024, m).toLocaleString("fr-FR", { month: "long" });
}

export function hexRgb(h?: string | null): [number, number, number] {
  if (!h || h.length < 7) return [124, 58, 237];
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}

export function esc(s?: string | null): string {
  return (s || "").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

