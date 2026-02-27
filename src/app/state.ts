import { DEF_EXTS, K, type Extension } from "./constants";
import { saveExtToFirebase, deleteExtFromFirebase, saveRapToFirebase, deleteRapFromFirebase } from "./firebase";

export type RapportDepense = { motif: string; montant: number };
export type RapportConverti = { nom: string; tel?: string };
export type Rapport = {
  id: string;
  extensionId: string;
  date: string;
  heureDebut?: string;
  heureFin?: string;
  moderateur?: string;
  predicateur?: string;
  interprete?: string;
  theme?: string;
  textes?: string;
  effectif?: { papas: number; mamans: number; freres: number; soeurs: number; enfants: number; total: number };
  offrandes?: { ordinaires: number; orateur: number; dimes: number; actionsGrace: number; total: number };
  ventilation?: { dixPctDime: number; dixPctSocial: number; reste: number };
  depenses?: RapportDepense[];
  totalDepenses?: number;
  soldeFinal?: number;
  nouveaux?: RapportConverti[];
  signatures?: { secretaire: string; tresorier: string; pasteur: string };
  updatedAt?: string;
};

export type Session = { role: "admin" } | { role: "extension"; extId: string };

export type Settings = { nom: string; adminPw: string };

const DEMO_MODE = false;

export function seedIfNeeded(): void {
  // En production, Supabase est la source de vérité; le seed ne sert qu'en mode démo local.
  if (!DEMO_MODE) return;
  if (localStorage.getItem(K.SEED)) return;
  localStorage.setItem(K.EXT, JSON.stringify(DEF_EXTS));

  const raps: Rapport[] = [];
  DEF_EXTS.forEach((ext) => {
    [0, 1, 2, 3, 4].forEach((m) => {
      [5, 12, 19, 26].forEach((day) => {
        const dt = new Date(2025, m, day);
        if (dt > new Date()) return;
        const pres = 60 + Math.floor(Math.random() * 80);
        const tot = 200 + Math.floor(Math.random() * 500);
        const dimes = Math.floor(tot * 0.3),
          ord = Math.floor(tot * 0.5),
          or = Math.floor(tot * 0.1),
          ag = tot - dimes - ord - or;
        const nCount = Math.floor(Math.random() * 4);
        const dep = Math.floor(tot * 0.3);
        raps.push({
          id: `r_${ext.id}_${m}_${day}`,
          extensionId: ext.id,
          date: dt.toISOString().split("T")[0],
          heureDebut: "09:00",
          heureFin: "12:00",
          moderateur: ext.coordinateur,
          predicateur: ext.pasteur.nom,
          interprete: "",
          theme: "La Grâce de Dieu",
          textes: "Jean 3:16",
          effectif: {
            papas: Math.floor(pres * 0.2),
            mamans: Math.floor(pres * 0.25),
            freres: Math.floor(pres * 0.2),
            soeurs: Math.floor(pres * 0.25),
            enfants: Math.floor(pres * 0.1),
            total: pres,
          },
          offrandes: { ordinaires: ord, orateur: or, dimes, actionsGrace: ag, total: tot },
          ventilation: {
            dixPctDime: +Number(dimes * 0.1).toFixed(2),
            dixPctSocial: +Number(tot * 0.1).toFixed(2),
            reste: +Number(tot * 0.8).toFixed(2),
          },
          depenses: [
            { motif: "Transport", montant: Math.floor(dep * 0.4) },
            { motif: "Collation", montant: Math.floor(dep * 0.3) },
            { motif: "Fournitures", montant: Math.floor(dep * 0.3) },
          ],
          totalDepenses: dep,
          soldeFinal: tot - dep,
          nouveaux: Array.from({ length: nCount }, (_, i) => ({
            nom: `Nouveau ${i + 1} (${ext.nom})`,
            tel: "+357 99 " + String(100000 + Math.floor(Math.random() * 900000)),
          })),
          signatures: { secretaire: ext.secretaire, tresorier: ext.tresorier, pasteur: ext.pasteur.nom },
          updatedAt: new Date().toISOString(),
        });
      });
    });
  });
  localStorage.setItem(K.RAP, JSON.stringify(raps));
  localStorage.setItem(K.SEED, "1");
}

export const Store = {
  // Extensions
  getExts(): Extension[] {
    try {
      return JSON.parse(localStorage.getItem(K.EXT) || "null") || DEF_EXTS;
    } catch {
      return DEF_EXTS;
    }
  },
  getExt(id: string): Extension | null {
    return this.getExts().find((e) => e.id === id) || null;
  },
  saveExt(ext: Extension): void {
    const a = this.getExts();
    const i = a.findIndex((e) => e.id === ext.id);
    if (i >= 0) a[i] = ext;
    else a.push(ext);
    localStorage.setItem(K.EXT, JSON.stringify(a));
    // Sync to Firebase in background
    saveExtToFirebase(ext).catch(console.error);
  },
  delExt(id: string): void {
    localStorage.setItem(
      K.EXT,
      JSON.stringify(this.getExts().filter((e) => e.id !== id)),
    );
    localStorage.setItem(
      K.RAP,
      JSON.stringify(this.getRaps().filter((r) => r.extensionId !== id)),
    );
    // Sync deletion to Firebase in background
    deleteExtFromFirebase(id).catch(console.error);
  },

  // Rapports
  getRaps(extId: string | null = null): Rapport[] {
    try {
      const a: Rapport[] = JSON.parse(localStorage.getItem(K.RAP) || "null") || [];
      return extId ? a.filter((r) => r.extensionId === extId) : a;
    } catch {
      return [];
    }
  },
  getRap(id: string): Rapport | null {
    return this.getRaps().find((r) => r.id === id) || null;
  },
  saveRap(r: Rapport): Rapport {
    const a = this.getRaps();
    const i = a.findIndex((x) => x.id === r.id);
    r.updatedAt = new Date().toISOString();
    if (i >= 0) a[i] = r;
    else a.push(r);
    localStorage.setItem(K.RAP, JSON.stringify(a));
    return r;
  },
  delRap(id: string): void {
    localStorage.setItem(
      K.RAP,
      JSON.stringify(this.getRaps().filter((r) => r.id !== id)),
    );
  },

  // Session
  getSes(): Session | null {
    try {
      return JSON.parse(localStorage.getItem(K.SES) || "null");
    } catch {
      return null;
    }
  },
  setSes(s: Session): void {
    localStorage.setItem(K.SES, JSON.stringify(s));
  },
  clearSes(): void {
    localStorage.removeItem(K.SES);
  },

  // Logo
  getLogo(): string | null {
    return localStorage.getItem(K.LOGO) || null;
  },
  setLogo(d: string | null): void {
    if (d) localStorage.setItem(K.LOGO, d);
    else localStorage.removeItem(K.LOGO);
  },

  // Settings
  getSet(): Settings {
    try {
      return JSON.parse(localStorage.getItem(K.SET) || "null") || { nom: "Emerge in Christ", adminPw: "admin123" };
    } catch {
      return { nom: "Emerge in Christ", adminPw: "admin123" };
    }
  },
  saveSet(s: Settings): void {
    localStorage.setItem(K.SET, JSON.stringify(s));
  },

  // Analytics
  stats(extId: string | null = null): { cultes: number; presence: number; offrandes: number; nouveaux: number } {
    const a = this.getRaps(extId);
    const n = a.length;
    return {
      cultes: n,
      presence: n ? Math.round(a.reduce((s, r) => s + (r.effectif?.total || 0), 0) / n) : 0,
      offrandes: a.reduce((s, r) => s + (r.offrandes?.total || 0), 0),
      nouveaux: a.reduce((s, r) => s + (r.nouveaux?.length || 0), 0),
    };
  },
  monthly(
    extId: string | null = null,
    yr: number = new Date().getFullYear(),
  ): { i: number; lbl: string; cultes: number; presence: number; offrandes: number; nouveaux: number }[] {
    const a = this.getRaps(extId).filter((r) => new Date(r.date + "T00:00").getFullYear() === yr);
    const m = Array.from({ length: 12 }, (_, i) => ({
      i,
      lbl: new Date(yr, i).toLocaleString("fr-FR", { month: "short" }),
      cultes: 0,
      presence: 0,
      offrandes: 0,
      nouveaux: 0,
    }));
    a.forEach((r) => {
      const mi = new Date(r.date + "T00:00").getMonth();
      m[mi].cultes++;
      m[mi].presence += r.effectif?.total || 0;
      m[mi].offrandes += r.offrandes?.total || 0;
      m[mi].nouveaux += r.nouveaux?.length || 0;
    });
    return m;
  },
  allNouveaux(extId: string | null = null): (RapportConverti & { date: string; extId: string; rapId: string })[] {
    const a: (RapportConverti & { date: string; extId: string; rapId: string })[] = [];
    this.getRaps(extId).forEach((r) =>
      (r.nouveaux || []).forEach((n) => a.push({ ...n, date: r.date, extId: r.extensionId, rapId: r.id })),
    );
    return a;
  },
};

export const Auth = {
  ses(): Session | null {
    return Store.getSes();
  },
  isAdmin(): boolean {
    const s = Store.getSes();
    return s?.role === "admin";
  },
  isExt(): boolean {
    const s = Store.getSes();
    return s?.role === "extension";
  },
  loginAdmin(pw: string): boolean {
    const cfg = Store.getSet();
    if (pw === cfg.adminPw) {
      Store.setSes({ role: "admin" });
      return true;
    }
    return false;
  },
  loginExt(id: string, pw: string): boolean {
    const e = Store.getExt(id);
    if (e && e.password === pw) {
      Store.setSes({ role: "extension", extId: e.id });
      return true;
    }
    return false;
  },
  logout(): void {
    Store.clearSes();
  },
};

