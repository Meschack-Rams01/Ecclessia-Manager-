import type { Extension } from "../../constants";

type Monthly = { i: number; lbl: string; cultes: number; presence: number; offrandes: number; nouveaux: number };

type Deps = {
  setActive: (path: string) => void;
  setTopbar: (title: string, sub?: string, badge?: string) => void;
  render: (html: string) => void;
  icon: (name: string) => string;
  statCard: (iconName: string, label: string, value: string, sub: string) => string;
  chartBar: (id: string, labels: string[], data: number[], label: string, color: string) => void;

  getCfg: () => { nom?: string };
  getExts: () => Extension[];
  stats: (extId?: string | null) => { cultes: number; presence: number; offrandes: number; nouveaux: number };
  monthly: (extId: string | null, yr: number) => Monthly[];
};

export function pgAdminDashPage(deps: Deps) {
  deps.setActive("/admin/dashboard");

  const cfg = deps.getCfg();
  const exts = deps.getExts();
  const st = deps.stats(null);
  const yr = new Date().getFullYear();
  const mo = deps.monthly(null, yr);
  deps.setTopbar("Tableau de Bord Global", "Vue d'ensemble du réseau", "Admin");

  const maxC = Math.max(1, ...exts.map((e) => deps.stats(e.id).cultes));

  deps.render(`
    <div class="page-header">
      <div><h1>Vue Générale</h1><p>${cfg.nom || "Emerge in Christ"} · ${exts.length} extension(s)</p></div>
      <button class="btn btn-secondary btn-sm" onclick="navTo('/admin/extensions')">${deps.icon("settings")} Gérer</button>
    </div>
    <div class="grid-4 mb-20">
      ${deps.statCard("building", "Extensions", String(exts.length), "Sites actifs")}
      ${deps.statCard("fileText", "Cultes", String(st.cultes), "Total réseau")}
      ${deps.statCard("users", "Présence moy.", String(st.presence), "Par culte")}
      ${deps.statCard("userCheck", "Convertis", String(st.nouveaux), "Total réseau")}
    </div>
    <div class="grid-2 mb-20">
      <div class="card"><div class="form-section-title mb-12">Présence mensuelle ${yr}</div><div class="chart-wrap"><canvas id="chP"></canvas></div></div>
      <div class="card"><div class="form-section-title mb-12">Offrandes mensuelles ${yr}</div><div class="chart-wrap"><canvas id="chO"></canvas></div></div>
    </div>
    <div class="form-section-title mb-12">Performance par Extension</div>
    <div class="grid-3">
      ${exts
        .map((ext) => {
          const s = deps.stats(ext.id);
          return `<div class="ext-card" style="--ext-color:${ext.couleur}">
            <div class="ext-card-name">${ext.nom}</div>
            <div class="ext-card-ville">${deps.icon("mapPin")} ${ext.ville}, ${ext.pays}</div>
            <div class="ext-mini-stats mb-12">
              <div><div class="ext-stat-val">${s.cultes}</div><div class="ext-stat-lbl">Cultes</div></div>
              <div><div class="ext-stat-val">${s.presence}</div><div class="ext-stat-lbl">Moy.</div></div>
              <div><div class="ext-stat-val">${s.nouveaux}</div><div class="ext-stat-lbl">Conv.</div></div>
            </div>
            <div class="text-xs text-muted mb-4">Activité relative</div>
            <div class="progress-bar"><div class="progress-fill" style="width:${Math.round((s.cultes / maxC) * 100)}%;background:${ext.couleur}"></div></div>
          </div>`;
        })
        .join("")}
    </div>
  `);

  const lb = mo.map((m) => m.lbl);
  deps.chartBar("chP", lb, mo.map((m) => m.presence), "Présence", "rgba(139,92,246,.7)");
  deps.chartBar("chO", lb, mo.map((m) => m.offrandes), "Offrandes", "rgba(245,158,11,.7)");
}

