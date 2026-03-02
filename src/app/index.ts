import { Store, Auth, seedIfNeeded, type Rapport } from "./state";
import { ADMIN_NAV, EXT_NAV, DEVISES, type Extension } from "./constants";
import { fmt, fmtD, fmtTRY, uid, mName } from "./utils";
import { icon } from "./icons";
import { syncFromSupabase, subscribeToExtensions } from "./supabase";
import { createAppContext, type AppContext } from "./context";
import { curParams, curPath, initRouter, navTo, regRoute } from "./router";
import { toast } from "./ui/toast";
import { openModal, closeModal } from "./ui/modal";
import { pgAdminExtsPage } from "./pages/admin/pgAdminExtsPage";
import { pgAdminDashPage } from "./pages/admin/pgAdminDashPage";
import { pgAdminSettingsPage } from "./pages/admin/pgAdminSettingsPage";

declare global {
  interface Window {
    _charts: Record<string, any>;
    switchTab: (tab: string) => void;
    closeModal: () => void;
    doLogin: (type: string) => void;
    doLogout: () => void;
    toggleSidebar: () => void;
    navTo: (path: string, params?: Record<string, string>) => void;
    curPath: () => string;
    curParams: () => Record<string, string>;
    openExtForm: (extId: string | null) => void;
    saveExtForm: (extId: string) => void;
    confirmDelExt: (id: string) => void;
    onDevChange: () => void;
    adminRapFilter: (sel: HTMLSelectElement, field: string) => void;
    showRapModal: (id: string) => void;
    doExportHTML: (id: string) => void;
    doExportPDF: (id: string) => void;
    doExportDOCX: (id: string) => void;
    openRapForm: (rapId: string | null) => void;
    saveRapForm: () => void;
    addDepRow: () => void;
    addConvRow: () => void;
    removeDepRow: (idx: number) => void;
    removeConvRow: (idx: number) => void;
    updateRapTotals: () => void;
    updateVentilation: () => void;
    extRapFilter: (sel: HTMLSelectElement, field: string) => void;
    doDeleteRap: (id: string) => void;
    goToStep: (step: number) => void;
    saveStep0: () => void;
    saveStep1: () => void;
    saveStep2: () => void;
    saveStep3: () => void;
    saveStep4: () => void;
    saveStep5: () => void;
    updateEffTotal: () => void;
    updateOffTotals: () => void;
    updateDepTotal: (idx: number) => void;
    pgAdminExts: () => void;
    saveSettings: () => void;
    clearLogo: () => void;
    exportData: () => void;
    importData: (input: HTMLInputElement) => void;
    resetData: () => void;
    doExportBilan: () => void;
    doExportBilanExt: (period: string) => void;
    exportBilanToCSV: (extId: string, period: string, yr: number, month?: number, quarter?: number) => void;
    handleLogoUpload: (input: HTMLInputElement) => void;
  }
}

let appCtx: AppContext | null = null;

// Login screen functions available immediately
window.switchTab = function (tab: string) {
  document.querySelectorAll(".login-tab").forEach((t, i) => {
    t.classList.toggle("active", i === (tab === "extension" ? 0 : 1));
  });
  document.getElementById("panel-extension")!.classList.toggle("active", tab === "extension");
  document.getElementById("panel-admin")!.classList.toggle("active", tab === "admin");
};

function navItemClick(path: string) {
  navTo(path);
  if (window.innerWidth <= 900) {
    document.getElementById("sidebar")?.classList.remove("open");
  }
}

function setTopbar(title: string, sub: string = "", badge: string = "") {
  document.getElementById("tb-title")!.textContent = title;
  document.getElementById("tb-sub")!.textContent = sub || "";
  document.getElementById("tb-badge")!.textContent = badge || "";
}

function render(html: string) {
  document.getElementById("page")!.innerHTML = html;
}

function buildNav(def: typeof ADMIN_NAV) {
  const nav = document.getElementById("sidebar-nav")!;
  nav.innerHTML = def
    .map(
      (g) =>
        `<div class="nav-group">${g.g}</div>${g.items
          .map(
            (it) =>
              `<button class="nav-item" data-path="${it.path}" onclick="navItemClick('${it.path}')"><span class="nav-icon">${icon(it.icon)}</span>${it.lbl}</button>`
          )
          .join("")}`
    )
    .join("");
}

function setActive(path: string) {
  document.querySelectorAll(".nav-item").forEach((el) => {
    el.classList.toggle("active", (el as HTMLElement).dataset.path === path);
  });
}

// Functions available globally (for onclick handlers)
window.closeModal = closeModal;

function updateLogoUI() {
  const logo = Store.getLogo();
  const wrap = document.getElementById("sb-logo-wrap")!;
  if (logo) wrap.innerHTML = `<div class="logo-img-wrap"><img src="${logo}" alt="logo"/></div>`;
  else wrap.innerHTML = `<div class="logo-placeholder">${icon("cross")}</div>`;

  const li = document.getElementById("login-icon")!;
  if (li) {
    if (logo) li.innerHTML = `<img src="${logo}" alt="logo"/>`;
    else li.innerHTML = icon("cross");
  }

  const cfg = Store.getSet();
  const sbn = document.getElementById("sb-community")!;
  if (sbn) sbn.textContent = cfg.nom || "Emerge in Christ";
}

function populateExtSel() {
  const sel = document.getElementById("ext-select") as HTMLSelectElement;
  sel.innerHTML = Store.getExts()
    .map((e) => `<option value="${e.id}">${e.nom} — ${e.ville}</option>`)
    .join("");
}

function startApp() {
  updateLogoUI();
  document.getElementById("login-screen")!.style.display = "none";
  document.getElementById("app")!.style.display = "flex";
  const ses = Auth.ses()!;

  // Initialize real-time sync for extensions
  initRealtimeSync();

  if (Auth.isAdmin()) {
    document.getElementById("sb-ext-name")!.textContent = "Administrateur Général";
    document.getElementById("sb-ext-role")!.textContent = "Accès réseau complet";
    buildNav(ADMIN_NAV);
    registerAdminRoutes();
    initRouter();
    navTo("/admin/dashboard");
  } else {
    const extSes = ses as { role: "extension"; extId: string };
    const ext = Store.getExt(extSes.extId);
    document.getElementById("sb-ext-name")!.textContent = ext?.nom || "—";
    document.getElementById("sb-ext-role")!.textContent = ext?.ville || "—";
    buildNav(EXT_NAV);
    registerExtRoutes(extSes.extId);
    initRouter();
    navTo("/ext/dashboard");
  }
}

function initRealtimeSync() {
  // Subscribe to extension changes from Supabase
  subscribeToExtensions((ext, action) => {
    if (action === "DELETE") {
      // Force refresh from Supabase on delete
      syncFromSupabase().then(() => {
        populateExtSel();
        toast("Une extension a été supprimée", "success");
      });
    } else if (ext) {
      // Update local storage with the new/updated extension
      const a = Store.getExts();
      const i = a.findIndex((e) => e.id === ext.id);
      if (i >= 0) {
        a[i] = ext;
      } else {
        a.push(ext);
      }
      localStorage.setItem("eic_ext", JSON.stringify(a));
      populateExtSel();
      toast(`Extension "${ext.nom}" mise à jour`, "success");
    }
  });
}

function statCard(iconName: string, label: string, value: string, sub: string) {
  return `<div class="stat-card"><div class="stat-label">${label}</div><div class="stat-value">${value}</div><div class="stat-sub">${sub}</div><div class="stat-icon">${icon(iconName)}</div></div>`;
}

function chartBar(id: string, labels: string[], data: number[], label: string, color: string) {
  const ctx = (document.getElementById(id) as HTMLCanvasElement)?.getContext("2d");
  if (!ctx) return;
  if (window._charts && window._charts[id]) window._charts[id].destroy();
  if (!window._charts) window._charts = {};
  window._charts[id] = new (window as any).Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{ label, data, backgroundColor: color, borderRadius: 5, borderSkipped: false }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: { color: "#5A5280", font: { family: "'DM Sans', sans-serif", size: 10 } },
          grid: { color: "rgba(90,82,128,.08)" },
        },
        y: {
          ticks: { color: "#5A5280", font: { family: "'DM Sans', sans-serif", size: 10 } },
          grid: { color: "rgba(90,82,128,.08)" },
        },
      },
    },
  });
}

function chartLine(id: string, labels: string[], datasets: any[]) {
  const ctx = (document.getElementById(id) as HTMLCanvasElement)?.getContext("2d");
  if (!ctx) return;
  if (window._charts && window._charts[id]) window._charts[id].destroy();
  if (!window._charts) window._charts = {};
  window._charts[id] = new (window as any).Chart(ctx, {
    type: "line",
    data: { labels, datasets: datasets.map((d) => ({ ...d, tension: 0.4, fill: false })) },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: "#A199C4", font: { family: "'DM Sans', sans-serif", size: 11 } } } },
      scales: { x: { ticks: { color: "#5A5280" } }, y: { ticks: { color: "#5A5280" } } },
    },
  });
}

function extCard(ext: Extension): string {
  const s = Store.stats(ext.id);
  const raps = Store.getRaps(ext.id);
  const rapCount = raps.length;
  const last = raps.slice().sort((a, b) => b.date.localeCompare(a.date))[0];
  return `<div class="ext-card" style="--ext-color:${ext.couleur || "#8B5CF6"}">
    <div class="flex justify-between items-center mb-8" style="gap:12px;flex-wrap:wrap;">
      <div>
        <div class="ext-card-name">${ext.nom}</div>
        <div class="ext-card-ville">${icon("mapPin")} ${ext.ville}, ${ext.pays}</div>
      </div>
      <span class="badge badge-purple">${ext.symbole || "€"} ${ext.devise}</span>
    </div>
    <div class="flex gap-16 mb-12" style="flex-wrap:wrap;">
      <div class="text-xs text-muted" style="line-height:1.8;min-width:180px;">
        ${icon("user")} ${ext.pasteur?.nom || "—"}<br>${icon("mail")} ${ext.pasteur?.email || "—"}<br>${icon("phone")} ${ext.pasteur?.tel || "—"}
      </div>
      <div class="text-xs text-muted" style="line-height:1.8;min-width:180px;">
        ${icon("handshake")} Coord: ${ext.coordinateur || "—"}<br>${icon("clipboard")} Secrét: ${ext.secretaire || "—"}<br>${icon("wallet")} Trésor: ${ext.tresorier || "—"}
      </div>
    </div>
    <div class="ext-mini-stats mb-12">
      <div><div class="ext-stat-val">${s.cultes}</div><div class="ext-stat-lbl">Cultes</div></div>
      <div><div class="ext-stat-val">${s.presence}</div><div class="ext-stat-lbl">Présence moy.</div></div>
      <div><div class="ext-stat-val">${s.nouveaux}</div><div class="ext-stat-lbl">Convertis</div></div>
    </div>
    <div class="flex justify-between items-center mt-8" style="gap:12px;flex-wrap:wrap;">
      <div class="text-xs text-muted">
        ${icon("fileText")} ${rapCount} rapport(s)${last ? ` · Dernier: ${fmtD(last.date)}` : ""}
      </div>
      <div class="flex gap-8">
        <button class="btn btn-secondary btn-sm" onclick="openExtForm('${ext.id}')">${icon("pen")} Modifier</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDelExt('${ext.id}')">${icon("trash")} Supprimer</button>
      </div>
    </div>
  </div>`;
}

function rapTableRow(r: Rapport): string {
  const ext = Store.getExt(r.extensionId);
  return `<tr>
    <td class="td-bold">${fmtD(r.date)}</td>
    <td><span class="badge" style="background:${ext?.couleur || "#8B5CF6"}22;color:${ext?.couleur || "#8B5CF6"};border:1px solid ${ext?.couleur || "#8B5CF6"}44">${ext?.nom || "—"}</span></td>
    <td>${r.moderateur || "—"}</td>
    <td>${r.effectif?.total || 0}</td>
    <td>${fmt(r.offrandes?.total, ext?.symbole || "€")}</td>
    <td>${r.nouveaux?.length || 0}</td>
    <td>
      <div class="flex gap-8">
        <button class="btn btn-secondary btn-sm btn-icon" onclick="showRapModal('${r.id}')" title="Voir">${icon("eye")}</button>
        <button class="btn btn-blue btn-sm btn-icon" onclick="doExportHTML('${r.id}')" title="Imprimer / PDF">${icon("fileText")}</button>
      </div>
    </td>
  </tr>`;
}

function showRapModal(rapId: string) {
  const r = Store.getRap(rapId);
  if (!r) return;
  const ext = Store.getExt(r.extensionId);
  const v = r.ventilation;
  const socialPct = Store.getSet().socialPct || 10;
  const logo = Store.getLogo();
  
  // Build tables with proper formatting
  const repartitionTable = `
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="bg-gray-100">
          <th class="border border-gray-300 px-3 py-2 text-left font-bold">Type de recette</th>
          <th class="border border-gray-300 px-3 py-2 text-right font-bold">Montant (₺)</th>
          <th class="border border-gray-300 px-3 py-2 text-right font-bold">Dîme 10 %</th>
          <th class="border border-gray-300 px-3 py-2 text-right font-bold">Social (${socialPct}%)</th>
          <th class="border border-gray-300 px-3 py-2 text-right font-bold">Reste</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="border border-gray-300 px-3 py-2">Offrandes ordinaires</td>
          <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(r.offrandes?.ordinaires || 0)}</td>
          <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(v?.ordinaires.dime || 0)}</td>
          <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(v?.ordinaires.social || 0)}</td>
          <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(v?.ordinaires.reste || 0)}</td>
        </tr>
        <tr>
          <td class="border border-gray-300 px-3 py-2">Offrandes pour Orateur</td>
          <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(r.offrandes?.orateur || 0)}</td>
          <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(v?.orateur.dime || 0)}</td>
          <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(v?.orateur.social || 0)}</td>
          <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(v?.orateur.reste || 0)}</td>
        </tr>
        <tr>
          <td class="border border-gray-300 px-3 py-2">Dîmes</td>
          <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(r.offrandes?.dimes || 0)}</td>
          <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(v?.dimes.dime || 0)}</td>
          <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(v?.dimes.social || 0)}</td>
          <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(v?.dimes.reste || 0)}</td>
        </tr>
        <tr>
          <td class="border border-gray-300 px-3 py-2">Actions de Grâce</td>
          <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(r.offrandes?.actionsGrace || 0)}</td>
          <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(v?.actionsGrace.dime || 0)}</td>
          <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(v?.actionsGrace.social || 0)}</td>
          <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(v?.actionsGrace.reste || 0)}</td>
        </tr>
        <tr class="bg-gray-100 font-bold">
          <td class="border border-gray-300 px-3 py-2">TOTAL</td>
          <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(r.offrandes?.total || 0)}</td>
          <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(v?.totalDime || 0)}</td>
          <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(v?.totalSocial || 0)}</td>
          <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(v?.reste || 0)}</td>
        </tr>
      </tbody>
    </table>`;

  const depensesTable = r.depenses?.length ? `
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="bg-gray-100">
          <th class="border border-gray-300 px-3 py-2 text-center font-bold w-12">N°</th>
          <th class="border border-gray-300 px-3 py-2 text-right font-bold">Montant (₺)</th>
          <th class="border border-gray-300 px-3 py-2 text-left font-bold">Motif</th>
        </tr>
      </thead>
      <tbody>
        ${r.depenses!.map((d, i) => `
          <tr>
            <td class="border border-gray-300 px-3 py-2 text-center">${i + 1}</td>
            <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(d.montant)}</td>
            <td class="border border-gray-300 px-3 py-2">${d.motif}</td>
          </tr>
        `).join("")}
        <tr class="bg-gray-100 font-bold">
          <td class="border border-gray-300 px-3 py-2">Total</td>
          <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(r.totalDepenses || 0)}</td>
          <td class="border border-gray-300 px-3 py-2"></td>
        </tr>
        <tr class="bg-gray-100 font-bold">
          <td class="border border-gray-300 px-3 py-2">Reste final</td>
          <td class="border border-gray-300 px-3 py-2 text-right">${fmtTRY(r.soldeFinal || 0)}</td>
          <td class="border border-gray-300 px-3 py-2"></td>
        </tr>
      </tbody>
    </table>` : `
    <p class="text-gray-500 italic">Aucune dépense</p>
    <p class="font-bold mt-2">Reste final: ${fmtTRY(r.soldeFinal || 0)}</p>`;

  const nouveauxTable = r.nouveaux?.length ? `
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="bg-gray-100">
          <th class="border border-gray-300 px-3 py-2 text-left font-bold">Noms</th>
          <th class="border border-gray-300 px-3 py-2 text-left font-bold">Téléphone</th>
        </tr>
      </thead>
      <tbody>
        ${r.nouveaux!.map(n => `
          <tr>
            <td class="border border-gray-300 px-3 py-2">${n.nom}</td>
            <td class="border border-gray-300 px-3 py-2">${n.tel || "—"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>` : "";

  const headerHtml = logo ? `
    <div class="flex items-center gap-4 mb-6 pb-4 border-b border-gray-300">
      <img src="${logo}" alt="Logo" class="h-16 w-auto object-contain" />
      <div>
        <h1 class="text-2xl font-bold uppercase tracking-wide">${ext?.nom || "Emerge in Christ"}</h1>
        <p class="text-gray-600">Rapport de Culte - ${fmtD(r.date)}</p>
      </div>
    </div>
  ` : `
    <div class="text-center mb-6 pb-4 border-b border-gray-300">
      <h1 class="text-2xl font-bold uppercase tracking-wide">${ext?.nom || "Emerge in Christ"}</h1>
      <p class="text-gray-600">Rapport de Culte - ${fmtD(r.date)}</p>
    </div>
  `;

  openModal(`
    <div class="modal-header"><h2>Rapport du ${fmtD(r.date)}</h2><button class="modal-close" onclick="closeModal()">${icon("x")}</button></div>
    <div class="modal-body" style="max-width: 800px; margin: 0 auto;">
      ${headerHtml}
      
      <!-- INFORMATIONS DU CULTE -->
      <div class="mb-6">
        <h3 class="text-lg font-bold uppercase mb-3 pb-2 border-b border-gray-200">Informations du Culte</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div><span class="font-semibold">Heure:</span> ${r.heureDebut || "—"} - ${r.heureFin || "—"}</div>
          <div><span class="font-semibold">Modérateur:</span> ${r.moderateur || "—"}</div>
          <div><span class="font-semibold">Prédicateur:</span> ${r.predicateur || "—"}</div>
          <div><span class="font-semibold">Interprète:</span> ${r.interprete || "—"}</div>
          <div><span class="font-semibold">Thème:</span> ${r.theme || "—"}</div>
          <div><span class="font-semibold">Textes:</span> ${r.textes || "—"}</div>
        </div>
      </div>

      <!-- EFFECTIF -->
      <div class="mb-6">
        <h3 class="text-lg font-bold uppercase mb-3 pb-2 border-b border-gray-200">Effectif des Présents</h3>
        <div class="grid grid-cols-5 gap-2 text-center text-sm bg-gray-50 p-3 rounded">
          <div><div class="font-semibold">${r.effectif?.papas || 0}</div><div class="text-xs text-gray-500">Papas</div></div>
          <div><div class="font-semibold">${r.effectif?.mamans || 0}</div><div class="text-xs text-gray-500">Mamans</div></div>
          <div><div class="font-semibold">${r.effectif?.freres || 0}</div><div class="text-xs text-gray-500">Frères</div></div>
          <div><div class="font-semibold">${r.effectif?.soeurs || 0}</div><div class="text-xs text-gray-500">Soeurs</div></div>
          <div><div class="font-semibold">${r.effectif?.enfants || 0}</div><div class="text-xs text-gray-500">Enfants</div></div>
        </div>
        <div class="text-center mt-2 font-bold">Total: ${r.effectif?.total || 0}</div>
      </div>

      <!-- RÉPARTITION DES RECETTES ET PRÉLÈVEMENTS -->
      <div class="mb-6">
        <h3 class="text-lg font-bold uppercase mb-3 pb-2 border-b border-gray-200">Répartition des Recettes et Prélèvements</h3>
        ${repartitionTable}
      </div>

      <!-- DÉPENSES -->
      <div class="mb-6">
        <h3 class="text-lg font-bold uppercase mb-3 pb-2 border-b border-gray-200">Dépenses</h3>
        ${depensesTable}
      </div>

      <!-- ACCUEIL DES NOUVEAUX -->
      ${nouveauxTable ? `
      <div class="mb-6">
        <h3 class="text-lg font-bold uppercase mb-3 pb-2 border-b border-gray-200">Accueil des Nouveaux</h3>
        ${nouveauxTable}
      </div>
      ` : ""}

      <!-- SIGNATURES -->
      <div class="mt-8 pt-4 border-t border-gray-300">
        <div class="grid grid-cols-3 gap-4 text-sm">
          <div class="text-center">
            <div class="border-b border-gray-400 mb-2 pb-4"></div>
            <div class="font-semibold">Secrétaire</div>
          </div>
          <div class="text-center">
            <div class="border-b border-gray-400 mb-2 pb-4"></div>
            <div class="font-semibold">Trésorier</div>
          </div>
          <div class="text-center">
            <div class="border-b border-gray-400 mb-2 pb-4"></div>
            <div class="font-semibold">Pasteur</div>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-blue" onclick="closeModal();doExportHTML('${r.id}')">${icon("fileText")} Imprimer / PDF</button>
    </div>
  `);
}

function doExportPDF(rapId: string) {
  const r = Store.getRap(rapId);
  if (!r) return;
  const ext = Store.getExt(r.extensionId);

  const { jsPDF } = (window as any).jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Set margins (2.5 cm = 25 mm)
  const marginLeft = 20;
  let y = 25; // Start after top margin

  // Use Times New Roman for professional look
  doc.setFont("times", "normal");

  // Add logo if available
  const logo = Store.getLogo();
  if (logo) {
    try {
      doc.addImage(logo, "PNG", pageWidth / 2 - 15, y, 25, 25);
      y += 35;
    } catch {
      y += 10;
    }
  }

  // Title - MAJUSCULES, centré, gras
  doc.setFontSize(18);
  doc.setFont("times", "bold");
  doc.text("RAPPORT DE CULTE", pageWidth / 2, y, { align: "center" });
  y += 10;
  
  doc.setFontSize(14);
  doc.setFont("times", "normal");
  doc.text(ext?.nom || "Emerge in Christ", pageWidth / 2, y, { align: "center" });
  y += 8;
  
  doc.setFontSize(11);
  doc.text(`Date: ${fmtD(r.date)}`, pageWidth / 2, y, { align: "center" });
  y += 15;

  // Section: INFORMATIONS DU CULTE - MAJUSCULES
  doc.setFontSize(12);
  doc.setFont("times", "bold");
  doc.text("INFORMATIONS DU CULTE", marginLeft, y);
  y += 8;
  
  doc.setFontSize(11);
  doc.setFont("times", "normal");
  doc.text(`Heure: ${r.heureDebut || "—"} - ${r.heureFin || "—"}`, marginLeft, y); y += 6;
  doc.text(`Modérateur: ${r.moderateur || "—"}`, marginLeft, y); y += 6;
  doc.text(`Prédicateur: ${r.predicateur || "—"}`, marginLeft, y); y += 6;
  doc.text(`Interprète: ${r.interprete || "—"}`, marginLeft, y); y += 6;
  doc.text(`Thème: ${r.theme || "—"}`, marginLeft, y); y += 6;
  doc.text(`Textes: ${r.textes || "—"}`, marginLeft, y); y += 10;

  // Effectif
  doc.setFont("times", "bold");
  doc.text("EFFECTIF DES PRÉSENTS", marginLeft, y);
  y += 8;
  doc.setFont("times", "normal");
  doc.text(`Papas: ${r.effectif?.papas || 0}  |  Mamans: ${r.effectif?.mamans || 0}  |  Frères: ${r.effectif?.freres || 0}  |  Soeurs: ${r.effectif?.soeurs || 0}  |  Enfants: ${r.effectif?.enfants || 0}`, marginLeft, y);
  y += 6;
  doc.setFont("times", "bold");
  doc.text(`Total présence: ${r.effectif?.total || 0}`, marginLeft, y);
  y += 15;

  // SECTION: RÉPARTITION DES RECETTES ET PRÉLÈVEMENTS - TABLE FORMAT
  doc.setFontSize(12);
  doc.text("RÉPARTITION DES RECETTES ET PRÉLÈVEMENTS", marginLeft, y);
  y += 10;
  
  // Table header with borders
  doc.setFontSize(10);
  doc.setFont("times", "bold");
  const colWidths = [60, 35, 35, 35, 35];
  const socialPct = Store.getSet().socialPct || 10;
  const cols = ["Type de recette", "Montant (₺)", "Dîme 10 %", `Social (${socialPct}%)`, "Reste"];
  let x = marginLeft;
  cols.forEach((col, i) => {
    doc.rect(x, y - 4, colWidths[i], 8); // Cell border
    doc.text(col, x + 2, y + 1);
    x += colWidths[i];
  });
  y += 8;
  
  // Table rows
  doc.setFont("times", "normal");
  const v = r.ventilation;
  
  const rows = [
    ["Offrandes ordinaires", r.offrandes?.ordinaires || 0, v?.ordinaires.dime || 0, v?.ordinaires.social || 0, v?.ordinaires.reste || 0],
    ["Offrandes pour Orateur", r.offrandes?.orateur || 0, v?.orateur.dime || 0, v?.orateur.social || 0, v?.orateur.reste || 0],
    ["Dîmes", r.offrandes?.dimes || 0, v?.dimes.dime || 0, v?.dimes.social || 0, v?.dimes.reste || 0],
    ["Actions de Grâce", r.offrandes?.actionsGrace || 0, v?.actionsGrace.dime || 0, v?.actionsGrace.social || 0, v?.actionsGrace.reste || 0],
  ];
  
  rows.forEach(row => {
    x = marginLeft;
    row.forEach((cell, i) => {
      doc.rect(x, y - 4, colWidths[i], 8);
      if (i === 0) {
        doc.text(String(cell), x + 2, y + 1);
      } else {
        doc.text(fmtTRY(cell), x + colWidths[i] - 2, y + 1, { align: "right" });
      }
      x += colWidths[i];
    });
    y += 8;
  });
  
  // TOTAL row
  x = marginLeft;
  doc.setFont("times", "bold");
  doc.rect(x, y - 4, colWidths[0], 8);
  doc.text("TOTAL", x + 2, y + 1);
  x += colWidths[0];
  
  const totals = [r.offrandes?.total || 0, v?.totalDime || 0, v?.totalSocial || 0, v?.reste || 0];
  totals.forEach((cell, i) => {
    doc.rect(x, y - 4, colWidths[i + 1], 8);
    doc.text(fmtTRY(cell), x + colWidths[i + 1] - 2, y + 1, { align: "right" });
    x += colWidths[i + 1];
  });
  y += 15;

  // Add new page for DÉPENSES section
  doc.addPage();

  // SECTION: DÉPENSES - TABLE FORMAT
  doc.setFontSize(12);
  doc.setFont("times", "bold");
  doc.text("DÉPENSES", marginLeft, y);
  y += 10;
  
  // Expenses table header
  doc.setFontSize(10);
  const depCols = ["N°", "Montant (₺)", "Motif"];
  const depWidths = [15, 40, 120];
  x = marginLeft;
  depCols.forEach((col, i) => {
    doc.rect(x, y - 4, depWidths[i], 8);
    doc.text(col, x + 2, y + 1);
    x += depWidths[i];
  });
  y += 8;
  
  doc.setFont("times", "normal");
  if (r.depenses?.length) {
    r.depenses.forEach((d, i) => {
      x = marginLeft;
      doc.rect(x, y - 4, depWidths[0], 8);
      doc.text(String(i + 1), x + 2, y + 1);
      x += depWidths[0];
      
      doc.rect(x, y - 4, depWidths[1], 8);
      doc.text(fmtTRY(d.montant), x + depWidths[1] - 2, y + 1, { align: "right" });
      x += depWidths[1];
      
      doc.rect(x, y - 4, depWidths[2], 8);
      doc.text(d.motif, x + 2, y + 1);
      y += 8;
    });
    
    // Total row
    x = marginLeft;
    doc.rect(x, y - 4, depWidths[0], 8);
    doc.setFont("times", "bold");
    doc.text("Total", x + 2, y + 1);
    x += depWidths[0];
    doc.rect(x, y - 4, depWidths[1], 8);
    doc.text(fmtTRY(r.totalDepenses || 0), x + depWidths[1] - 2, y + 1, { align: "right" });
    x += depWidths[1];
    doc.rect(x, y - 4, depWidths[2], 8);
    y += 10;
    
    // Reste final
    x = marginLeft;
    doc.text("Reste final", x + 2, y + 1);
    x += depWidths[0];
    doc.rect(x, y - 4, depWidths[1], 8);
    doc.text(fmtTRY(r.soldeFinal || 0), x + depWidths[1] - 2, y + 1, { align: "right" });
  } else {
    x = marginLeft;
    doc.rect(x, y - 4, 175, 8);
    doc.text("Aucune dépense", x + 2, y + 1);
    y += 10;
    
    x = marginLeft;
    doc.setFont("times", "bold");
    doc.text("Reste final", x + 2, y + 1);
    x += depWidths[0];
    doc.rect(x, y - 4, depWidths[1], 8);
    doc.text(fmtTRY(r.soldeFinal || 0), x + depWidths[1] - 2, y + 1, { align: "right" });
  }
  y += 15;

  // SECTION: ACCUEIL DES NOUVEAUX - TABLE FORMAT
  if (r.nouveaux?.length) {
    doc.setFontSize(12);
    doc.setFont("times", "bold");
    doc.text("ACCUEIL DES NOUVEAUX", marginLeft, y);
    y += 10;
    
    // New converts table header
    doc.setFontSize(10);
    const newCols = ["Noms", "Téléphone"];
    const newWidths = [100, 75];
    x = marginLeft;
    newCols.forEach((col, i) => {
      doc.rect(x, y - 4, newWidths[i], 8);
      doc.text(col, x + 2, y + 1);
      x += newWidths[i];
    });
    y += 8;
    
    doc.setFont("times", "normal");
    r.nouveaux.forEach((n) => {
      x = marginLeft;
      doc.rect(x, y - 4, newWidths[0], 10);
      doc.text(n.nom, x + 2, y + 2);
      x += newWidths[0];
      doc.rect(x, y - 4, newWidths[1], 10);
      doc.text(n.tel || "—", x + 2, y + 2);
      y += 10;
    });
    y += 10;
  }

  // SIGNATURES section
  doc.setFontSize(12);
  doc.setFont("times", "bold");
  doc.text("SIGNATURES", marginLeft, y);
  y += 15;
  
  doc.setFontSize(10);
  doc.setFont("times", "normal");
  doc.text("Secrétaire: ___________________", marginLeft, y);
  doc.text("Trésorier: ___________________", marginLeft + 65, y);
  doc.text("Pasteur: ___________________", marginLeft + 130, y);

  doc.save(`Rapport_${ext?.nom || "EIC"}_${r.date}.pdf`);
  toast("PDF exporté avec succès", "success");
}

function doExportHTML(rapId: string) {
  const r = Store.getRap(rapId);
  if (!r) return;
  const ext = Store.getExt(r.extensionId);
  const v = r.ventilation;
  const socialPct = Store.getSet().socialPct || 10;
  const logo = Store.getLogo();

  const repartitionTable = `
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="bg-gray-100">
          <th class="border border-black px-3 py-2 text-left font-bold">Type de recette</th>
          <th class="border border-black px-3 py-2 text-right font-bold">Montant (₺)</th>
          <th class="border border-black px-3 py-2 text-right font-bold">Dîme 10 %</th>
          <th class="border border-black px-3 py-2 text-right font-bold">Social (${socialPct}%)</th>
          <th class="border border-black px-3 py-2 text-right font-bold">Reste</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="border border-black px-3 py-2">Offrandes ordinaires</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(r.offrandes?.ordinaires || 0)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(v?.ordinaires.dime || 0)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(v?.ordinaires.social || 0)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(v?.ordinaires.reste || 0)}</td>
        </tr>
        <tr>
          <td class="border border-black px-3 py-2">Offrandes pour Orateur</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(r.offrandes?.orateur || 0)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(v?.orateur.dime || 0)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(v?.orateur.social || 0)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(v?.orateur.reste || 0)}</td>
        </tr>
        <tr>
          <td class="border border-black px-3 py-2">Dîmes</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(r.offrandes?.dimes || 0)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(v?.dimes.dime || 0)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(v?.dimes.social || 0)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(v?.dimes.reste || 0)}</td>
        </tr>
        <tr>
          <td class="border border-black px-3 py-2">Actions de Grâce</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(r.offrandes?.actionsGrace || 0)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(v?.actionsGrace.dime || 0)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(v?.actionsGrace.social || 0)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(v?.actionsGrace.reste || 0)}</td>
        </tr>
        <tr class="bg-gray-200 font-bold">
          <td class="border border-black px-3 py-2">TOTAL</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(r.offrandes?.total || 0)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(v?.totalDime || 0)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(v?.totalSocial || 0)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(v?.reste || 0)}</td>
        </tr>
      </tbody>
    </table>`;

  const depensesTable = r.depenses?.length ? `
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="bg-gray-100">
          <th class="border border-black px-3 py-2 text-center font-bold w-12">N°</th>
          <th class="border border-black px-3 py-2 text-right font-bold">Montant (₺)</th>
          <th class="border border-black px-3 py-2 text-left font-bold">Motif</th>
        </tr>
      </thead>
      <tbody>
        ${r.depenses!.map((d, i) => `
          <tr>
            <td class="border border-black px-3 py-2 text-center">${i + 1}</td>
            <td class="border border-black px-3 py-2 text-right">${fmtTRY(d.montant)}</td>
            <td class="border border-black px-3 py-2">${d.motif}</td>
          </tr>
        `).join("")}
        <tr class="bg-gray-200 font-bold">
          <td class="border border-black px-3 py-2">Total</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(r.totalDepenses || 0)}</td>
          <td class="border border-black px-3 py-2"></td>
        </tr>
        <tr class="bg-gray-200 font-bold">
          <td class="border border-black px-3 py-2">Reste final</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(r.soldeFinal || 0)}</td>
          <td class="border border-black px-3 py-2"></td>
        </tr>
      </tbody>
    </table>` : `
    <p class="text-gray-500 italic">Aucune dépense</p>
    <p class="font-bold mt-2">Reste final: ${fmtTRY(r.soldeFinal || 0)}</p>`;

  const nouveauxTable = r.nouveaux?.length ? `
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="bg-gray-100">
          <th class="border border-black px-3 py-2 text-left font-bold">Noms</th>
          <th class="border border-black px-3 py-2 text-left font-bold">Téléphone</th>
        </tr>
      </thead>
      <tbody>
        ${r.nouveaux!.map(n => `
          <tr>
            <td class="border border-black px-3 py-2">${n.nom}</td>
            <td class="border border-black px-3 py-2">${n.tel || "—"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>` : "";

  const headerHtml = logo ? `
    <div class="flex items-center gap-4 mb-6 pb-4 border-b-2 border-black print:flex">
      <img id="print-header-logo" src="${logo}" alt="Logo" class="h-10 w-auto object-contain print:h-10" style="max-height:40mm;" />
      <div>
        <h1 class="text-2xl font-bold uppercase tracking-wide">${ext?.nom || "Emerge in Christ"}</h1>
        <p class="text-gray-600">Rapport de Culte - ${fmtD(r.date)}</p>
      </div>
    </div>
    <div id="no-logo-div" class="hidden">
    </div>
  ` : `
    <div id="no-logo-div" class="text-center mb-6 pb-4 border-b-2 border-black">
      <h1 class="text-2xl font-bold uppercase tracking-wide">${ext?.nom || "Emerge in Christ"}</h1>
      <p class="text-gray-600">Rapport de Culte - ${fmtD(r.date)}</p>
    </div>
  `;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de Culte - ${ext?.nom || "EIC"} - ${r.date}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page {
      size: A4;
      margin: 16mm;
    }
    @media print {
      body { 
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact; 
        width: 100% !important;
        margin: 0 !important;
        padding: 16mm !important;
      }
      .no-print { display: none !important; }
      .print\\:page-break-before { page-break-before: always; }
      .print\\:hidden { display: none !important; }
      .break-before-page { page-break-before: always; break-before: always; }
      .break-after-avoid { break-after: avoid; page-break-after: avoid; }
      .break-inside-avoid { page-break-inside: avoid; break-inside: avoid; }
    }
    body {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 16mm;
      box-sizing: border-box;
    }
  </style>
</head>
<body class="bg-white text-gray-900 font-sans">
  <!-- LOGO UPLOAD SECTION (visible on screen, hidden on print) -->
  <div class="no-print mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg print:hidden">
    <div class="flex flex-col sm:flex-row items-center gap-4">
      <div class="flex-1">
        <label class="block text-sm font-semibold text-blue-800 mb-2">Logo pour l'impression (optionnel)</label>
        <div class="flex gap-2 flex-wrap">
          <input type="file" id="logo-upload" accept="image/*,image/svg+xml" class="text-sm text-blue-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" />
          <input type="text" id="logo-url" placeholder="Ou coller une URL..." class="flex-1 min-w-48 px-3 py-2 border border-blue-300 rounded text-sm" />
          <button onclick="applyLogo()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold">Appliquer</button>
          <button onclick="saveLogoForFuture()" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold" title="Sauvegarder pour les prochaines impressions">💾 Sauvegarder</button>
        </div>
      </div>
      <div id="logo-preview" class="hidden items-center gap-2">
        <img id="preview-img" src="" alt="Aperçu" class="h-12 w-auto object-contain border border-blue-300 rounded" />
        <button onclick="removeLogo()" class="ml-2 text-red-600 hover:text-red-800 text-sm">✕ Retirer</button>
      </div>
    </div>
  </div>

  <div class="text-center mb-6">
    <h1 class="text-3xl font-bold uppercase tracking-wider border-b-4 border-black pb-2 inline-block">RAPPORT DE CULTE</h1>
  </div>
  
  ${headerHtml}
  
  <!-- INFORMATIONS DU CULTE -->
  <div class="mb-6">
    <h3 class="text-lg font-bold uppercase mb-3 pb-2 border-b border-black">Informations du Culte</h3>
    <div class="grid grid-cols-2 gap-4 text-sm">
      <div><span class="font-bold">Heure:</span> ${r.heureDebut || "—"} - ${r.heureFin || "—"}</div>
      <div><span class="font-bold">Modérateur:</span> ${r.moderateur || "—"}</div>
      <div><span class="font-bold">Prédicateur:</span> ${r.predicateur || "—"}</div>
      <div><span class="font-bold">Interprète:</span> ${r.interprete || "—"}</div>
      <div><span class="font-bold">Thème:</span> ${r.theme || "—"}</div>
      <div><span class="font-bold">Textes:</span> ${r.textes || "—"}</div>
    </div>
  </div>

  <!-- EFFECTIF -->
  <div class="mb-6">
    <h3 class="text-lg font-bold uppercase mb-3 pb-2 border-b border-black">Effectif des Présents</h3>
    <div class="grid grid-cols-5 gap-2 text-center text-sm border border-black p-3">
      <div><div class="font-bold text-lg">${r.effectif?.papas || 0}</div><div class="text-xs">Papas</div></div>
      <div><div class="font-bold text-lg">${r.effectif?.mamans || 0}</div><div class="text-xs">Mamans</div></div>
      <div><div class="font-bold text-lg">${r.effectif?.freres || 0}</div><div class="text-xs">Frères</div></div>
      <div><div class="font-bold text-lg">${r.effectif?.soeurs || 0}</div><div class="text-xs">Sœurs</div></div>
      <div><div class="font-bold text-lg">${r.effectif?.enfants || 0}</div><div class="text-xs">Enfants</div></div>
    </div>
    <div class="text-center mt-3 font-bold text-lg border border-black p-2 inline-block px-8">Total: ${r.effectif?.total || 0}</div>
  </div>

  <!-- RÉPARTITION DES RECETTES ET PRÉLÈVEMENTS -->
  <div class="mb-6">
    <h3 class="text-lg font-bold uppercase mb-3 pb-2 border-b border-black">Répartition des Recettes et Prélèvements</h3>
    ${repartitionTable}
  </div>

  <!-- DÉPENSES (Nouvelle page à l'impression) -->
  <div class="mb-6 break-before-page" style="break-before: page; page-break-before: always;">
    <h3 class="text-lg font-bold uppercase mb-3 pb-2 border-b border-black" style="break-after: avoid;">Dépenses</h3>
    <div class="break-inside-avoid" style="page-break-inside: avoid; break-inside: avoid;">
      ${depensesTable}
    </div>
  </div>

  <!-- ACCUEIL DES NOUVEAUX -->
  ${nouveauxTable ? `
  <div class="mb-6">
    <h3 class="text-lg font-bold uppercase mb-3 pb-2 border-b border-black">Accueil des Nouveaux</h3>
    ${nouveauxTable}
  </div>
  ` : ""}

  <!-- SIGNATURES -->
  <div class="mt-12 pt-4 border-t-4 border-black">
    <div class="grid grid-cols-3 gap-4 text-sm">
      <div class="text-center">
        <div class="border-b-2 border-black mb-2 pb-8"></div>
        <div class="font-bold">Secrétaire</div>
        <div class="text-xs">${r.signatures?.secretaire || ""}</div>
      </div>
      <div class="text-center">
        <div class="border-b-2 border-black mb-2 pb-8"></div>
        <div class="font-bold">Trésorier</div>
        <div class="text-xs">${r.signatures?.tresorier || ""}</div>
      </div>
      <div class="text-center">
        <div class="border-b-2 border-black mb-2 pb-8"></div>
        <div class="font-bold">Pasteur</div>
        <div class="text-xs">${r.signatures?.pasteur || ""}</div>
      </div>
    </div>
  </div>

  <!-- BOUTON IMPRESSION -->
  <div class="no-print mt-8 text-center">
    <button onclick="window.print()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg">
      Imprimer / Enregistrer PDF
    </button>
    <p class="text-sm text-gray-500 mt-2">Utilisez "Enregistrer sous PDF" dans la boîte de dialogue d'impression</p>
  </div>
  <script>
    // Initialize logo from localStorage (persisted from settings or previous saves)
    let currentLogo = localStorage.getItem('eic_logo') || null;
    
    // Also check sessionStorage for temporary logo during this session
    if (!currentLogo) {
      currentLogo = sessionStorage.getItem('print_logo');
    }

    function applyLogo() {
      const fileInput = document.getElementById('logo-upload');
      const urlInput = document.getElementById('logo-url');
      
      if (fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
          currentLogo = e.target.result;
          // Persist to sessionStorage for this print session
          sessionStorage.setItem('print_logo', currentLogo);
          updateLogoDisplay();
        };
        reader.readAsDataURL(fileInput.files[0]);
      } else if (urlInput.value.trim()) {
        currentLogo = urlInput.value.trim();
        sessionStorage.setItem('print_logo', currentLogo);
        updateLogoDisplay();
      }
    }

    function updateLogoDisplay() {
      const preview = document.getElementById('logo-preview');
      const previewImg = document.getElementById('preview-img');
      const headerLogo = document.getElementById('print-header-logo');
      const noLogoDiv = document.getElementById('no-logo-div');
      
      if (currentLogo) {
        if (preview) {
          preview.classList.remove('hidden');
          preview.classList.add('flex');
          previewImg.src = currentLogo;
        }
        if (headerLogo) {
          headerLogo.src = currentLogo;
          headerLogo.parentElement.classList.remove('hidden');
        }
        if (noLogoDiv) {
          noLogoDiv.classList.add('hidden');
        }
      }
    }

    function removeLogo() {
      currentLogo = null;
      sessionStorage.removeItem('print_logo');
      // Note: We don't remove from localStorage here to preserve saved logo
      document.getElementById('logo-preview').classList.add('hidden');
      document.getElementById('logo-preview').classList.remove('flex');
      document.getElementById('logo-upload').value = '';
      document.getElementById('logo-url').value = '';
      const headerLogo = document.getElementById('print-header-logo');
      if (headerLogo) {
        headerLogo.src = '';
        headerLogo.parentElement.classList.add('hidden');
      }
      const noLogoDiv = document.getElementById('no-logo-div');
      if (noLogoDiv) {
        noLogoDiv.classList.remove('hidden');
      }
    }

    function saveLogoForFuture() {
      if (currentLogo) {
        try {
          localStorage.setItem('eic_logo', currentLogo);
          alert('Logo sauvegardé ! Il sera automatiquement affiché lors de vos prochaines impressions.');
        } catch (e) {
          alert("Erreur lors de la sauvegarde du logo. L'image est peut-être trop grande.");
        }
      } else {
        alert("Veuillez d'abord sélectionner un logo.");
      }
    }

    // Run on page load to display existing logo
    document.addEventListener('DOMContentLoaded', function() {
      if (currentLogo) {
        updateLogoDisplay();
      }
    });

    window.applyLogo = applyLogo;
    window.removeLogo = removeLogo;
    window.saveLogoForFuture = saveLogoForFuture;
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
  toast("Fenêtre d'impression ouverte", "success");
}

async function doExportDOCX(rapId: string) {
  const r = Store.getRap(rapId);
  if (!r) return;
  const ext = Store.getExt(r.extensionId);
  const sym = ext?.symbole || "€";

  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType } = (window as any).docx;

  const v = r.ventilation;
  const socialPct = Store.getSet().socialPct || 10;

  // Table for RÉPARTITION DES RECETTES ET PRÉLÈVEMENTS
  const repartitionRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Type de recette", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Montant", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Dîme 10%", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `Social ${socialPct}%`, bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Reste", bold: true })] })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Offrandes ordinaires")] }),
        new TableCell({ children: [new Paragraph(fmt(r.offrandes?.ordinaires || 0, sym))] }),
        new TableCell({ children: [new Paragraph(fmt(v?.ordinaires.dime || 0, sym))] }),
        new TableCell({ children: [new Paragraph(fmt(v?.ordinaires.social || 0, sym))] }),
        new TableCell({ children: [new Paragraph(fmt(v?.ordinaires.reste || 0, sym))] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Offrandes pour Orateur")] }),
        new TableCell({ children: [new Paragraph(fmt(r.offrandes?.orateur || 0, sym))] }),
        new TableCell({ children: [new Paragraph(fmt(v?.orateur.dime || 0, sym))] }),
        new TableCell({ children: [new Paragraph(fmt(v?.orateur.social || 0, sym))] }),
        new TableCell({ children: [new Paragraph(fmt(v?.orateur.reste || 0, sym))] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Dîmes")] }),
        new TableCell({ children: [new Paragraph(fmt(r.offrandes?.dimes || 0, sym))] }),
        new TableCell({ children: [new Paragraph(fmt(v?.dimes.dime || 0, sym))] }),
        new TableCell({ children: [new Paragraph(fmt(v?.dimes.social || 0, sym))] }),
        new TableCell({ children: [new Paragraph(fmt(v?.dimes.reste || 0, sym))] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Actions de Grâce")] }),
        new TableCell({ children: [new Paragraph(fmt(r.offrandes?.actionsGrace || 0, sym))] }),
        new TableCell({ children: [new Paragraph(fmt(v?.actionsGrace.dime || 0, sym))] }),
        new TableCell({ children: [new Paragraph(fmt(v?.actionsGrace.social || 0, sym))] }),
        new TableCell({ children: [new Paragraph(fmt(v?.actionsGrace.reste || 0, sym))] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "TOTAL", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fmt(r.offrandes?.total || 0, sym), bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fmt(v?.totalDime || 0, sym), bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fmt(v?.totalSocial || 0, sym), bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fmt(v?.reste || 0, sym), bold: true })] })] }),
      ],
    }),
  ];

  // Table for DÉPENSES
  const depRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "N°", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Montant", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Motif", bold: true })] })] }),
      ],
    }),
  ];
  if (r.depenses?.length) {
    r.depenses.forEach((d, i) => {
      depRows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(String(i + 1))] }),
          new TableCell({ children: [new Paragraph(fmt(d.montant, sym))] }),
          new TableCell({ children: [new Paragraph(d.motif)] }),
        ],
      }));
    });
    depRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fmt(r.totalDepenses || 0, sym), bold: true })] })] }),
        new TableCell({ children: [new Paragraph("")] }),
      ],
    }));
    depRows.push(new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Reste final", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: fmt(r.soldeFinal || 0, sym), bold: true })] })] }),
        new TableCell({ children: [new Paragraph("")] }),
      ],
    }));
  }

  // Table for ACCUEIL DES NOUVEAUX
  const nouveauxRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Noms", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Téléphone", bold: true })] })] }),
      ],
    }),
  ];
  if (r.nouveaux?.length) {
    r.nouveaux.forEach((n) => {
      nouveauxRows.push(new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(n.nom)] }),
          new TableCell({ children: [new Paragraph(n.tel || "—")] }),
        ],
      }));
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ children: [new TextRun({ text: "RAPPORT DE CULTE", bold: true, size: 48 })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun(ext?.nom || "Emerge in Christ")] }),
          new Paragraph({ children: [new TextRun(`Date: ${fmtD(r.date)}`)], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun({ text: "" }) ] }),
          new Paragraph({ children: [new TextRun({ text: "RÉPARTITION DES RECETTES ET PRÉLÈVEMENTS", bold: true }) ] }),
          new Table({ rows: repartitionRows }),
          new Paragraph({ children: [new TextRun({ text: "" }) ] }),
          new Paragraph({ children: [new TextRun({ text: "DÉPENSES", bold: true }) ] }),
          new Table({ rows: depRows }),
          ...(r.nouveaux?.length ? [
            new Paragraph({ children: [new TextRun({ text: "" }) ] }),
            new Paragraph({ children: [new TextRun({ text: "ACCUEIL DES NOUVEAUX", bold: true }) ] }),
            new Table({ rows: nouveauxRows }),
          ] : []),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Rapport_${ext?.nom || "EIC"}_${r.date}.docx`;
  a.click();
  URL.revokeObjectURL(url);
  toast("DOCX exporté avec succès", "success");
}

function getBilanData(extId: string | null, period: "monthly" | "quarterly" | "annual", year: number, month?: number, quarter?: number) {
  let raps = Store.getRaps(extId).filter(r => {
    const d = new Date(r.date + "T00:00");
    return d.getFullYear() === year;
  });

  if (period === "monthly" && month !== undefined) {
    raps = raps.filter(r => new Date(r.date + "T00:00").getMonth() === month);
  } else if (period === "quarterly" && quarter !== undefined) {
    const qStart = quarter * 3;
    const qEnd = qStart + 2;
    raps = raps.filter(r => {
      const m = new Date(r.date + "T00:00").getMonth();
      return m >= qStart && m <= qEnd;
    });
  }

  const data = {
    ordinaires: 0,
    orateur: 0,
    dimes: 0,
    actionsGrace: 0,
    totalRecettes: 0,
    dimeTotal: 0,
    socialTotal: 0,
    resteTotal: 0,
    totalDepenses: 0,
    soldeFinal: 0,
    cultes: raps.length,
    presence: 0,
    nouveaux: 0,
  };

  raps.forEach(r => {
    data.ordinaires += r.offrandes?.ordinaires || 0;
    data.orateur += r.offrandes?.orateur || 0;
    data.dimes += r.offrandes?.dimes || 0;
    data.actionsGrace += r.offrandes?.actionsGrace || 0;
    data.totalRecettes += r.offrandes?.total || 0;
    data.dimeTotal += r.ventilation?.totalDime || 0;
    data.socialTotal += r.ventilation?.totalSocial || 0;
    data.resteTotal += r.ventilation?.reste || 0;
    data.totalDepenses += r.totalDepenses || 0;
    data.soldeFinal += r.soldeFinal || 0;
    data.presence += r.effectif?.total || 0;
    data.nouveaux += r.nouveaux?.length || 0;
  });

  return data;
}

function pgAdminBilansFinancier() {
  setActive("/admin/bilans/financier");
  const exts = Store.getExts();
  const params = curParams();
  const yr = params.year ? parseInt(params.year) : new Date().getFullYear();
  const period = (params.period as "monthly" | "quarterly" | "annual") || "annual";
  const month = params.month ? parseInt(params.month) : undefined;
  const quarter = params.quarter ? parseInt(params.quarter) : undefined;
  const extId = params.ext || "";

  const socialPct = Store.getSet().socialPct || 10;

  let periodLabel = `${yr}`;
  if (period === "monthly" && month !== undefined) {
    periodLabel = `${mName(month)} ${yr}`;
  } else if (period === "quarterly" && quarter !== undefined) {
    const qLabels = ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"];
    periodLabel = `${qLabels[quarter]} ${yr}`;
  }

  setTopbar("Bilans Financiers", periodLabel, "Admin");

  const extIdToUse = extId || null;
  const data = getBilanData(extIdToUse, period, yr, month, quarter);

  const selectedExt = extId ? exts.find(e => e.id === extId) : null;

  render(`
    <div class="page-header">
      <div><h1>Bilans Financiers</h1><p>${periodLabel} ${selectedExt ? `- ${selectedExt.nom}` : "- Toutes extensions"}</p></div>
      <div class="flex gap-8">
        <button class="btn btn-blue" onclick="window.doExportBilan()">${icon("fileText")} Imprimer / PDF</button>
        <button class="btn btn-secondary" onclick="window.exportBilanToCSV('${extId || ''}', '${period}', ${yr}, ${month || 'undefined'}, ${quarter || 'undefined'})">${icon("download")} CSV</button>
        <button class="btn btn-secondary" onclick="navTo('/print/summary', {period:'monthly',year:'${yr}',ext:'${extId || ''}'})">${icon("download")} Mensuel</button>
        <button class="btn btn-secondary" onclick="navTo('/print/summary', {period:'quarterly',year:'${yr}',ext:'${extId || ''}'})">${icon("download")} Trimestriel</button>
        <button class="btn btn-secondary" onclick="navTo('/print/summary', {period:'annual',year:'${yr}',ext:'${extId || ''}'})">${icon("download")} Annuel</button>
      </div>
    </div>

    <div class="filter-bar mb-12">
      <select onchange="navTo('/admin/bilans/financier', {year:this.value,period:'${period}',ext:'${extId}',month:'${month || ''}',quarter:'${quarter || ''}'})">
        ${[2026,2025,2024,2023,2022].map(y => `<option value="${y}"${yr === y ? " selected" : ""}>${y}</option>`).join("")}
      </select>
      <select onchange="navTo('/admin/bilans/financier', {year:'${yr}',period:this.value,ext:'${extId}'})">
        <option value="annual"${period === "annual" ? " selected" : ""}>Annuel</option>
        <option value="quarterly"${period === "quarterly" ? " selected" : ""}>Trimestriel</option>
        <option value="monthly"${period === "monthly" ? " selected" : ""}>Mensuel</option>
      </select>
      ${period === "quarterly" ? `
      <select onchange="navTo('/admin/bilans/financier', {year:'${yr}',period:'quarterly',ext:'${extId}',quarter:this.value})">
        <option value="">-- Trimestre --</option>
        ${[0,1,2,3].map(q => `<option value="${q}"${quarter === q ? " selected" : ""}>Q${q+1}</option>`).join("")}
      </select>
      ` : ""}
      ${period === "monthly" ? `
      <select onchange="navTo('/admin/bilans/financier', {year:'${yr}',period:'monthly',ext:'${extId}',month:this.value})">
        <option value="">-- Mois --</option>
        ${Array.from({length:12},(_,i)=>`<option value="${i}"${month === i ? " selected" : ""}>${mName(i)}</option>`).join("")}
      </select>
      ` : ""}
      <select onchange="navTo('/admin/bilans/financier', {year:'${yr}',period:'${period}',ext:this.value,month:'${month || ''}',quarter:'${quarter || ''}'})">
        <option value="">Toutes les extensions</option>
        ${exts.map(e => `<option value="${e.id}"${extId === e.id ? " selected" : ""}>${e.nom}</option>`).join("")}
      </select>
    </div>

    <div class="grid-4 mb-20">
      <div class="card">
        <div class="form-section-title mb-8">Cultes</div>
        <div class="text-4xl font-bold text-purple-600">${data.cultes}</div>
      </div>
      <div class="card">
        <div class="form-section-title mb-8">Présence totale</div>
        <div class="text-4xl font-bold text-blue-600">${data.presence}</div>
      </div>
      <div class="card">
        <div class="form-section-title mb-8">Total Offrandes</div>
        <div class="text-4xl font-bold text-green-600">${fmtTRY(data.totalRecettes)}</div>
      </div>
      <div class="card">
        <div class="form-section-title mb-8">Solde Final</div>
        <div class="text-4xl font-bold ${data.soldeFinal >= 0 ? 'text-green-600' : 'text-red-600'}">${fmtTRY(data.soldeFinal)}</div>
      </div>
    </div>

    <div class="card mb-12">
      <div class="form-section-title mb-12">RÉPARTITION DES RECETTES</div>
      <table class="w-full">
        <thead>
          <tr class="bg-gray-100">
            <th class="border border-gray-300 px-4 py-3 text-left font-bold">Type de recette</th>
            <th class="border border-gray-300 px-4 py-3 text-right font-bold">Montant (₺)</th>
            <th class="border border-gray-300 px-4 py-3 text-right font-bold">Dîme 10%</th>
            <th class="border border-gray-300 px-4 py-3 text-right font-bold">Social (${socialPct}%)</th>
            <th class="border border-gray-300 px-4 py-3 text-right font-bold">Reste</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border border-gray-300 px-4 py-3">Offrandes ordinaires</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(data.ordinaires)}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(data.ordinaires * 0.1)}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(data.ordinaires * (socialPct/100))}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(data.ordinaires * (1 - 0.1 - socialPct/100))}</td>
          </tr>
          <tr>
            <td class="border border-gray-300 px-4 py-3">Offrandes pour Orateur</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(data.orateur)}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">₺ 0,00</td>
            <td class="border border-gray-300 px-4 py-3 text-right">₺ 0,00</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(data.orateur)}</td>
          </tr>
          <tr>
            <td class="border border-gray-300 px-4 py-3">Dîmes</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(data.dimes)}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(data.dimes * 0.1)}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(data.dimes * (socialPct/100))}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(data.dimes * (1 - 0.1 - socialPct/100))}</td>
          </tr>
          <tr>
            <td class="border border-gray-300 px-4 py-3">Actions de Grâce</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(data.actionsGrace)}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(data.actionsGrace * 0.1)}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(data.actionsGrace * (socialPct/100))}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(data.actionsGrace * (1 - 0.1 - socialPct/100))}</td>
          </tr>
          <tr class="bg-gray-200 font-bold">
            <td class="border border-gray-300 px-4 py-3">TOTAL</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(data.totalRecettes)}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(data.dimeTotal)}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(data.socialTotal)}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(data.resteTotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="grid-2 gap-12">
      <div class="card">
        <div class="form-section-title mb-12">RÉSUMÉ FINANCIER</div>
        <div class="calc-box">
          <div class="calc-row"><span>Total Recettes</span><span>${fmtTRY(data.totalRecettes)}</span></div>
          <div class="calc-row"><span>- Prélèvement Dîme (10%)</span><span class="text-red-600">${fmtTRY(data.dimeTotal)}</span></div>
          <div class="calc-row"><span>- Prélèvement Social (${socialPct}%)</span><span class="text-red-600">${fmtTRY(data.socialTotal)}</span></div>
          <div class="calc-row total-row"><span>= Montant Disponible</span><span>${fmtTRY(data.resteTotal)}</span></div>
          <div class="calc-row"><span>- Total Dépenses</span><span class="text-red-600">${fmtTRY(data.totalDepenses)}</span></div>
          <div class="calc-row total-row"><span>= Solde Final</span><span class="${data.soldeFinal >= 0 ? 'text-green-600' : 'text-red-600'}">${fmtTRY(data.soldeFinal)}</span></div>
        </div>
      </div>
      <div class="card">
        <div class="form-section-title mb-12">AUTRES STATISTIQUES</div>
        <div class="calc-box">
          <div class="calc-row"><span>Nombre de cultes</span><span>${data.cultes}</span></div>
          <div class="calc-row"><span>Présence totale</span><span>${data.presence}</span></div>
          <div class="calc-row"><span>Présence moyenne</span><span>${data.cultes > 0 ? Math.round(data.presence / data.cultes) : 0}</span></div>
          <div class="calc-row"><span>Nouveaux convertis</span><span>${data.nouveaux}</span></div>
          <div class="calc-row"><span>Moyenne offrandes/culte</span><span>${fmtTRY(data.cultes > 0 ? data.totalRecettes / data.cultes : 0)}</span></div>
        </div>
      </div>
    </div>
  `);

  // Store current bilan params for export
  (window as any)._bilanParams = { extId: extIdToUse, period, yr, month, quarter, periodLabel, socialPct };
}

function doExportBilanHTML() {
  // Check for URL params first (when called via direct navigation)
  const urlParams = new URLSearchParams(window.location.search);
  const urlPeriod = urlParams.get('period') as "monthly" | "quarterly" | "annual" | null;
  const urlYear = urlParams.get('year');
  const urlExt = urlParams.get('ext');
  
  // Use URL params if available, otherwise fall back to stored params
  let params;
  if (urlPeriod) {
    const yr = urlYear ? parseInt(urlYear) : new Date().getFullYear();
    const period = urlPeriod;
    const extId = urlExt || null;
    const socialPct = Store.getSet().socialPct || 10;
    let periodLabel = `${yr}`;
    let month: number | undefined;
    let quarter: number | undefined;
    
    // For monthly/quarterly, we need default values
    if (period === "monthly") {
      month = new Date().getMonth();
      periodLabel = `${mName(month)} ${yr}`;
    } else if (period === "quarterly") {
      quarter = Math.floor(new Date().getMonth() / 3);
      const qLabels = ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"];
      periodLabel = `${qLabels[quarter]} ${yr}`;
    }
    
    params = { extId, period, yr, month, quarter, periodLabel, socialPct };
  } else {
    params = (window as any)._bilanParams || { extId: null, period: "annual", yr: new Date().getFullYear(), periodLabel: String(new Date().getFullYear()), socialPct: 10 };
  }
  
  const { extId, period, yr, month, quarter, periodLabel, socialPct } = params;
  // const exts = Store.getExts(); // not needed in export
  const logo = Store.getLogo();
  const cfg = Store.getSet();

  const data = getBilanData(extId, period, yr, month, quarter);

  const headerHtml = logo ? `
    <div class="flex items-center gap-4 mb-6 pb-4 border-b-2 border-black">
      <img src="${logo}" alt="Logo" class="h-12 w-auto object-contain" style="max-height:40mm;" />
      <div>
        <h1 class="text-2xl font-bold uppercase">${cfg.nom || "Emerge in Christ"}</h1>
        <p class="text-gray-600">Bilan Financier - ${periodLabel}</p>
      </div>
    </div>
  ` : `
    <div class="text-center mb-6 pb-4 border-b-2 border-black">
      <h1 class="text-2xl font-bold uppercase">${cfg.nom || "Emerge in Christ"}</h1>
      <p class="text-gray-600">Bilan Financier - ${periodLabel}</p>
    </div>
  `;

  const repartitionTable = `
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="bg-gray-100">
          <th class="border border-black px-3 py-2 text-left font-bold">Type de recette</th>
          <th class="border border-black px-3 py-2 text-right font-bold">Montant (₺)</th>
          <th class="border border-black px-3 py-2 text-right font-bold">Dîme 10 %</th>
          <th class="border border-black px-3 py-2 text-right font-bold">Social (${socialPct}%)</th>
          <th class="border border-black px-3 py-2 text-right font-bold">Reste</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="border border-black px-3 py-2">Offrandes ordinaires</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.ordinaires)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.ordinaires * 0.1)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.ordinaires * (socialPct/100))}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.ordinaires * (1 - 0.1 - socialPct/100))}</td>
        </tr>
        <tr>
          <td class="border border-black px-3 py-2">Offrandes pour Orateur</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.orateur)}</td>
          <td class="border border-black px-3 py-2 text-right">₺ 0,00</td>
          <td class="border border-black px-3 py-2 text-right">₺ 0,00</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.orateur)}</td>
        </tr>
        <tr>
          <td class="border border-black px-3 py-2">Dîmes</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.dimes)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.dimes * 0.1)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.dimes * (socialPct/100))}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.dimes * (1 - 0.1 - socialPct/100))}</td>
        </tr>
        <tr>
          <td class="border border-black px-3 py-2">Actions de Grâce</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.actionsGrace)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.actionsGrace * 0.1)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.actionsGrace * (socialPct/100))}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.actionsGrace * (1 - 0.1 - socialPct/100))}</td>
        </tr>
        <tr class="bg-gray-200 font-bold">
          <td class="border border-black px-3 py-2">TOTAL</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.totalRecettes)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.dimeTotal)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.socialTotal)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.resteTotal)}</td>
        </tr>
      </tbody>
    </table>`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bilan Financier - ${periodLabel}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page { size: A4; margin: 16mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; width: 100% !important; margin: 0 !important; padding: 16mm !important; }
      .no-print { display: none !important; }
    }
    body { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 16mm; box-sizing: border-box; }
  </style>
</head>
<body class="bg-white text-gray-900 font-sans">
  <div class="no-print mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg print:hidden">
    <p class="text-sm text-blue-800"><strong>Conseil :</strong> Utilisez "Enregistrer sous PDF" dans la boîte de dialogue d'impression pour sauvegarder ce bilan.</p>
  </div>

  <div class="text-center mb-6">
    <h1 class="text-3xl font-bold uppercase tracking-wider border-b-4 border-black pb-2 inline-block">BILAN FINANCIER</h1>
  </div>

  ${headerHtml}

  <!-- STATISTIQUES GLOBALES -->
  <div class="mb-6">
    <h3 class="text-lg font-bold uppercase mb-3 pb-2 border-b border-black">Statistiques Globales</h3>
    <div class="grid grid-cols-4 gap-4 text-center">
      <div class="border border-black p-3"><div class="text-2xl font-bold">${data.cultes}</div><div class="text-sm">Cultes</div></div>
      <div class="border border-black p-3"><div class="text-2xl font-bold">${data.presence}</div><div class="text-sm">Présence</div></div>
      <div class="border border-black p-3"><div class="text-2xl font-bold text-green-700">${fmtTRY(data.totalRecettes)}</div><div class="text-sm">Total Recettes</div></div>
      <div class="border border-black p-3"><div class="text-2xl font-bold ${data.soldeFinal >= 0 ? 'text-green-700' : 'text-red-700'}">${fmtTRY(data.soldeFinal)}</div><div class="text-sm">Solde Final</div></div>
    </div>
  </div>

  <!-- RÉPARTITION DES RECETTES -->
  <div class="mb-6">
    <h3 class="text-lg font-bold uppercase mb-3 pb-2 border-b border-black">Répartition des Recettes et Prélèvements</h3>
    ${repartitionTable}
  </div>

  <!-- RÉSUMÉ FINANCIER -->
  <div class="mb-6">
    <h3 class="text-lg font-bold uppercase mb-3 pb-2 border-b border-black">Résumé Financier</h3>
    <table class="w-full border-collapse text-sm">
      <tbody>
        <tr class="bg-gray-100"><td class="border border-black px-3 py-2 font-bold">Total Recettes</td><td class="border border-black px-3 py-2 text-right font-bold">${fmtTRY(data.totalRecettes)}</td></tr>
        <tr><td class="border border-black px-3 py-2">- Prélèvement Dîme (10%)</td><td class="border border-black px-3 py-2 text-right text-red-600">${fmtTRY(data.dimeTotal)}</td></tr>
        <tr><td class="border border-black px-3 py-2">- Prélèvement Social (${socialPct}%)</td><td class="border border-black px-3 py-2 text-right text-red-600">${fmtTRY(data.socialTotal)}</td></tr>
        <tr class="bg-gray-200"><td class="border border-black px-3 py-2 font-bold">= Montant Disponible</td><td class="border border-black px-3 py-2 text-right font-bold">${fmtTRY(data.resteTotal)}</td></tr>
        <tr><td class="border border-black px-3 py-2">- Total Dépenses</td><td class="border border-black px-3 py-2 text-right text-red-600">${fmtTRY(data.totalDepenses)}</td></tr>
        <tr class="bg-gray-200"><td class="border border-black px-3 py-2 font-bold">= Solde Final</td><td class="border border-black px-3 py-2 text-right font-bold ${data.soldeFinal >= 0 ? 'text-green-700' : 'text-red-700'}">${fmtTRY(data.soldeFinal)}</td></tr>
      </tbody>
    </table>
  </div>

  <!-- AUTRES STATISTIQUES -->
  <div class="mb-6">
    <h3 class="text-lg font-bold uppercase mb-3 pb-2 border-b border-black">Autres Statistiques</h3>
    <div class="grid grid-cols-3 gap-4 text-sm">
      <div><span class="font-bold">Nombre de cultes :</span> ${data.cultes}</div>
      <div><span class="font-bold">Présence totale :</span> ${data.presence}</div>
      <div><span class="font-bold">Présence moyenne :</span> ${data.cultes > 0 ? Math.round(data.presence / data.cultes) : 0}</div>
      <div><span class="font-bold">Nouveaux convertis :</span> ${data.nouveaux}</div>
      <div><span class="font-bold">Moyenne offrandes/culte :</span> ${fmtTRY(data.cultes > 0 ? data.totalRecettes / data.cultes : 0)}</div>
    </div>
  </div>

  <!-- SIGNATURES -->
  <div class="mt-12 pt-4 border-t-4 border-black">
    <div class="grid grid-cols-3 gap-4 text-sm">
      <div class="text-center">
        <div class="border-b-2 border-black mb-2 pb-8"></div>
        <div class="font-bold">Secrétaire</div>
      </div>
      <div class="text-center">
        <div class="border-b-2 border-black mb-2 pb-8"></div>
        <div class="font-bold">Trésorier</div>
      </div>
      <div class="text-center">
        <div class="border-b-2 border-black mb-2 pb-8"></div>
        <div class="font-bold">Pasteur</div>
      </div>
    </div>
  </div>

  <div class="no-print mt-8 text-center">
    <button onclick="window.print()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg">
      Imprimer / Enregistrer PDF
    </button>
  </div>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
  toast("Fenêtre d'impression ouverte", "success");
}

function registerAdminRoutes() {
  regRoute("/admin/dashboard", pgAdminDash);
  regRoute("/admin/extensions", pgAdminExts);
  regRoute("/admin/rapports", pgAdminRaps);
  regRoute("/admin/bilans", pgAdminBilans);
  regRoute("/admin/bilans/financier", pgAdminBilansFinancier);
  regRoute("/print/summary", doExportBilanHTML);
  regRoute("/admin/convertis", pgAdminConvertis);
  regRoute("/admin/settings", pgAdminSettings);
  (window as any).doExportBilan = doExportBilanHTML;
  regRoute("*", () => navTo("/admin/dashboard"));
  window.addEventListener("hashchange", () => setActive(curPath()));
}

function registerExtRoutes(extId: string) {
  regRoute("/ext/dashboard", () => pgExtDash(extId));
  regRoute("/ext/new", () => pgExtNew(extId));
  regRoute("/ext/rapports", pgExtRaps);
  regRoute("/ext/bilans", () => pgExtBilans(extId));
  regRoute("/ext/convertis", () => pgExtConvertis(extId));
  regRoute("*", () => navTo("/ext/dashboard"));
  window.addEventListener("hashchange", () => setActive(curPath()));
}

function pgAdminDash() {
  pgAdminDashPage({
    setActive,
    setTopbar,
    render,
    icon,
    statCard,
    chartBar,
    getCfg: () => Store.getSet(),
    getExts: () => Store.getExts(),
    stats: (extId) => Store.stats(extId ?? null),
    monthly: (extId, yr) => Store.monthly(extId, yr),
  });
}

function pgAdminExts() {
  pgAdminExtsPage({
    setActive,
    setTopbar,
    render,
    icon,
    getExts: () => Store.getExts(),
    extCard,
  });
}

function pgAdminRaps(params: Record<string, string> = {}) {
  setActive("/admin/rapports");
  setTopbar("Tous les Rapports", "Réseau complet", "Admin");
  const exts = Store.getExts();
  const fExt = params.ext || "";
  const fMonth = params.month !== undefined && params.month !== "" ? parseInt(params.month) : -1;
  const fYear = params.year ? parseInt(params.year) : 0;

  let raps = Store.getRaps(fExt || null);
  if (fMonth >= 0) raps = raps.filter((r) => new Date(r.date + "T00:00").getMonth() === fMonth);
  if (fYear) raps = raps.filter((r) => new Date(r.date + "T00:00").getFullYear() === fYear);
  raps.sort((a, b) => b.date.localeCompare(a.date));

  render(`
    <div class="page-header">
      <div><h1>Rapports de Culte</h1><p>${raps.length} rapport(s)</p></div>
    </div>
    <div class="filter-bar">
      <select onchange="adminRapFilter(this,'ext')">
        <option value="">— Toutes les extensions —</option>
        ${exts.map((e) => `<option value="${e.id}"${fExt === e.id ? " selected" : ""}>${e.nom}</option>`).join("")}
      </select>
      <select onchange="adminRapFilter(this,'month')">
        <option value="">— Tous les mois —</option>
        ${Array.from({ length: 12 }, (_, i) => `<option value="${i}"${fMonth === i ? " selected" : ""}>${mName(i)}</option>`).join("")}
      </select>
      <select onchange="adminRapFilter(this,'year')">
        <option value="">— Toutes années —</option>
        ${[2026, 2025, 2024, 2023].map((y) => `<option value="${y}"${fYear === y ? " selected" : ""}>${y}</option>`).join("")}
      </select>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Extension</th><th>Modérateur</th><th>Présence</th><th>Offrandes</th><th>Convertis</th><th>Actions</th></tr></thead>
        <tbody>
          ${raps.length === 0 ? `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text3)">Aucun rapport trouvé</td></tr>` : ""}
          ${raps.map(rapTableRow).join("")}
        </tbody>
      </table>
    </div>`);
}

function pgAdminBilans() {
  setActive("/admin/bilans");
  setTopbar("Bilans Comparatifs", "Analyse et synthèse", "Admin");
  const exts = Store.getExts();
  const yr = new Date().getFullYear();
  const mo = Store.monthly(null, yr);

  render(`
    <div class="page-header">
      <div><h1>Bilans Comparatifs</h1><p>${exts.length} extensions · ${yr}</p></div>
    </div>
    <div class="grid-3 mb-20">
      ${exts
        .map((ext) => {
          const s = Store.stats(ext.id);
          return `<div class="card" style="border-left:3px solid ${ext.couleur}">
            <div class="flex justify-between items-center mb-12">
              <div class="font-bold">${ext.nom}</div>
              <span class="badge badge-purple">${ext.symbole}</span>
            </div>
            <div class="calc-box">
              <div class="calc-row"><span>Cultes</span><span>${s.cultes}</span></div>
              <div class="calc-row"><span>Présence moy.</span><span>${s.presence}</span></div>
              <div class="calc-row"><span>Offrandes</span><span>${fmt(s.offrandes, ext.symbole)}</span></div>
              <div class="calc-row total-row"><span>Convertis</span><span>${s.nouveaux}</span></div>
            </div>
          </div>`;
        })
        .join("")}
    </div>
    <div class="card mb-20">
      <div class="form-section-title mb-12">Présence comparative par mois (${yr})</div>
      <div class="chart-wrap" style="height:260px"><canvas id="chCmp"></canvas></div>
    </div>
    <div class="form-section-title mb-12">Tableau comparatif mensuel</div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Mois</th>${exts.map((e) => `<th>${e.nom}</th>`).join("")}<th>Total</th></tr></thead>
        <tbody>
          ${mo
            .map((m) => {
              const vals = exts.map((ext) => Store.monthly(ext.id, yr)[m.i].presence);
              const tot = vals.reduce((a, b) => a + b, 0);
              return `<tr><td class="td-bold">${m.lbl} ${yr}</td>${vals.map((v) => `<td>${v || 0}</td>`).join("")}<td class="td-bold">${tot}</td></tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `);

  const datasets = exts.map((ext) => ({
    label: ext.nom,
    data: Store.monthly(ext.id, yr).map((m) => m.presence),
    borderColor: ext.couleur,
    backgroundColor: ext.couleur + "44",
  }));
  chartLine("chCmp", mo.map((m) => m.lbl), datasets);
}

function pgAdminConvertis() {
  setActive("/admin/convertis");
  setTopbar("Nouveaux Convertis", "Suivi pastoral", "Admin");
  const exts = Store.getExts();
  const convertis = Store.allNouveaux();

  render(`
    <div class="page-header">
      <div><h1>Nouveaux Convertis</h1><p>${convertis.length} converti(s) enregistré(s)</p></div>
    </div>
    <div class="filter-bar mb-20">
      <select id="conv-ext-filter" onchange="this.dataset.v=this.value;pgAdminConvertis()">
        <option value="">— Toutes les extensions —</option>
        ${exts.map((e) => `<option value="${e.id}">${e.nom}</option>`).join("")}
      </select>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Extension</th><th>Nom</th><th>Téléphone</th><th>Actions</th></tr></thead>
        <tbody>
          ${convertis.length === 0 ? `<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text3)">Aucun converti enregistré</td></tr>` : ""}
          ${convertis
            .map((c) => {
              const ext = Store.getExt(c.extId);
              return `<tr>
                <td class="td-bold">${fmtD(c.date)}</td>
                <td><span class="badge" style="background:${ext?.couleur || "#8B5CF6"}22;color:${ext?.couleur || "#8B5CF6"};border:1px solid ${ext?.couleur || "#8B5CF6"}44">${ext?.nom || "—"}</span></td>
                <td>${c.nom}</td>
                <td>${c.tel || "—"}</td>
                <td><button class="btn btn-secondary btn-sm" onclick="showRapModal('${c.rapId}')">${icon("eye")}</button></td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `);
}

function pgAdminSettings() {
  pgAdminSettingsPage({
    setActive,
    setTopbar,
    render,
    icon,
    getCfg: () => Store.getSet(),
    getLogo: () => Store.getLogo(),
  });
}

function saveSettings() {
  const nom = (document.getElementById("set-nom") as HTMLInputElement).value.trim();
  const adminPw = (document.getElementById("set-admin-pw") as HTMLInputElement).value.trim();
  const socialPctInput = (document.getElementById("set-social-pct") as HTMLInputElement).value;
  const socialPct = socialPctInput ? parseInt(socialPctInput) : 10;
  Store.saveSet({ nom, adminPw, socialPct });
  updateLogoUI();
  toast("Paramètres enregistrés", "success");
}

function handleLogoUpload(input: HTMLInputElement) {
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = e.target?.result as string;
    Store.setLogo(data);
    updateLogoUI();
    toast("Logo mis à jour", "success");
    pgAdminSettings();
  };
  reader.readAsDataURL(file);
}

function clearLogo() {
  Store.setLogo(null);
  updateLogoUI();
  toast("Logo supprimé", "success");
  pgAdminSettings();
}

function exportData() {
  const data = {
    extensions: Store.getExts(),
    rapports: Store.getRaps(),
    settings: Store.getSet(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `churchreport_backup_${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast("Données exportées", "success");
}

function importData(input: HTMLInputElement) {
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string);
      if (data.extensions) localStorage.setItem("eic_ext", JSON.stringify(data.extensions));
      if (data.rapports) localStorage.setItem("eic_rap", JSON.stringify(data.rapports));
      if (data.settings) localStorage.setItem("eic_set", JSON.stringify(data.settings));
      toast("Données importées", "success");
      location.reload();
    } catch {
      toast("Fichier invalide", "error");
    }
  };
  reader.readAsText(file);
}

function resetData() {
  if (!confirm("Réinitialiser toutes les données ? Cette action est irréversible.")) return;
  localStorage.clear();
  location.reload();
}

function pgExtDash(extId: string) {
  setActive("/ext/dashboard");
  const ext = Store.getExt(extId);
  const st = Store.stats(extId);
  const mo = Store.monthly(extId, new Date().getFullYear());
  setTopbar("Tableau de Bord", ext?.nom || "Mon Extension", ext?.ville || "");

  render(`
    <div class="page-header">
      <div><h1>Bienvenue</h1><p>${ext?.nom || ""}</p></div>
      <button class="btn btn-primary" onclick="navTo('/ext/new')">${icon("plus")} Nouveau Rapport</button>
    </div>
    <div class="grid-4 mb-20">
      ${statCard("fileText", "Cultes", String(st.cultes), "Total enregistrés")}
      ${statCard("users", "Présence moy.", String(st.presence), "Par culte")}
      ${statCard("wallet", "Offrandes", fmt(st.offrandes, ext?.symbole || "€"), "Total")}
      ${statCard("userCheck", "Convertis", String(st.nouveaux), "Total")}
    </div>
    <div class="grid-2 mb-20">
      <div class="card"><div class="form-section-title mb-12">Présence mensuelle ${new Date().getFullYear()}</div><div class="chart-wrap"><canvas id="chP"></canvas></div></div>
      <div class="card"><div class="form-section-title mb-12">Offrandes mensuelles ${new Date().getFullYear()}</div><div class="chart-wrap"><canvas id="chO"></canvas></div></div>
    </div>
  `);

  const lb = mo.map((m) => m.lbl);
  chartBar("chP", lb, mo.map((m) => m.presence), "Présence", "rgba(139,92,246,.7)");
  chartBar("chO", lb, mo.map((m) => m.offrandes), "Offrandes", "rgba(245,158,11,.7)");
}

let rapFormData: Rapport | null = null;
let rapStep = 0;

function pgExtNew(extId: string) {
  setActive("/ext/new");
  const ext = Store.getExt(extId);
  setTopbar("Nouveau Rapport", ext?.nom || "", "");

  // const params = curParams(); // reserved for future edit-mode support
  // Only reset if explicitly editing an existing rap or no form data exists
  if (!rapFormData) {
    rapFormData = {
      id: uid(),
      extensionId: extId,
      date: new Date().toISOString().split("T")[0],
      heureDebut: "09:00",
      heureFin: "12:00",
      moderateur: ext?.coordinateur || "",
      predicateur: ext?.pasteur.nom || "",
      effectif: { papas: 0, mamans: 0, freres: 0, soeurs: 0, enfants: 0, total: 0 },
      offrandes: { ordinaires: 0, orateur: 0, dimes: 0, actionsGrace: 0, total: 0 },
      ventilation: {
        ordinaires: { dime: 0, social: 0, reste: 0 },
        orateur: { dime: 0, social: 0, reste: 0 },
        dimes: { dime: 0, social: 0, reste: 0 },
        actionsGrace: { dime: 0, social: 0, reste: 0 },
        totalDime: 0,
        totalSocial: 0,
        reste: 0,
      },
      depenses: [],
      nouveaux: [],
      signatures: { secretaire: ext?.secretaire || "", tresorier: ext?.tresorier || "", pasteur: ext?.pasteur.nom || "" },
    };
    rapStep = 0;
  }

  const sym = ext?.symbole || "€";
  const steps = ["Culte", "Effectif", "Offrandes", "Dépenses", "Convertis", "Signature"];
  const stepLabels = [
    { icon: "clock", label: "Culte" },
    { icon: "users", label: "Effectif" },
    { icon: "wallet", label: "Offrandes" },
    { icon: "download", label: "Dépenses" },
    { icon: "userCheck", label: "Convertis" },
    { icon: "pen", label: "Signature" },
  ];

  render(`
    <div class="page-header">
      <div><h1>Nouveau Rapport</h1><p>${ext?.nom || ""}</p></div>
    </div>
    <div class="stepper mb-20">
      ${steps
        .map(
          (s, i) =>
            `<div class="step-item">
              <div class="step-dot ${i === rapStep ? "s-active" : ""} ${i < rapStep ? "s-done" : ""}" onclick="goToStep(${i})">${i < rapStep ? "✓" : i + 1}</div>
              <span class="step-lbl ${i === rapStep ? "s-active" : ""}">${icon(stepLabels[i].icon)} ${stepLabels[i].label}</span>
            </div>${i < steps.length - 1 ? '<div class="step-connector"></div>' : ""}`
        )
        .join("")}
    </div>
    <div class="card">
      ${renderStepContent(rapFormData!, sym)}
    </div>
  `);
}

function goToStep(step: number) {
  rapStep = step;
  const ses = Auth.ses();
  if (ses?.role === "extension") {
    pgExtNew(ses.extId);
  }
}

function renderStepContent(r: Rapport, sym: string): string {
  switch (rapStep) {
    case 0:
      return `
        <div class="form-section-title">Informations du culte</div>
        <div class="form-row cols-2">
          <div><label>Date *</label><input type="date" id="rf-date" value="${r.date}" /></div>
          <div><label>Thème</label><input type="text" id="rf-theme" value="${r.theme || ""}" /></div>
        </div>
        <div class="form-row cols-2">
          <div><label>Heure de début</label><input type="time" id="rf-begin" value="${r.heureDebut || ""}" /></div>
          <div><label>Heure de fin</label><input type="time" id="rf-end" value="${r.heureFin || ""}" /></div>
        </div>
        <div class="form-row cols-2">
          <div><label>Modérateur</label><input type="text" id="rf-mod" value="${r.moderateur || ""}" /></div>
          <div><label>Prédicateur</label><input type="text" id="rf-pred" value="${r.predicateur || ""}" /></div>
        </div>
        <div class="form-row cols-2">
          <div><label>Interprète</label><input type="text" id="rf-int" value="${r.interprete || ""}" /></div>
          <div><label>Textes bibliques</label><input type="text" id="rf-txt" value="${r.textes || ""}" /></div>
        </div>
        <div class="flex justify-between mt-16">
          <button class="btn btn-secondary" onclick="navTo('/ext/dashboard')">Annuler</button>
          <button class="btn btn-primary" onclick="saveStep0()">Suivant →</button>
        </div>`;
    case 1:
      return `
        <div class="form-section-title">Effectif des présents</div>
        <div class="form-row cols-5">
          <div><label>Papas</label><input type="number" id="rf-papas" value="${r.effectif?.papas || 0}" min="0" onchange="updateEffTotal()" /></div>
          <div><label>Mamans</label><input type="number" id="rf-mamans" value="${r.effectif?.mamans || 0}" min="0" onchange="updateEffTotal()" /></div>
          <div><label>Frères</label><input type="number" id="rf-freres" value="${r.effectif?.freres || 0}" min="0" onchange="updateEffTotal()" /></div>
          <div><label>Soeurs</label><input type="number" id="rf-soeurs" value="${r.effectif?.soeurs || 0}" min="0" onchange="updateEffTotal()" /></div>
          <div><label>Enfants</label><input type="number" id="rf-enfants" value="${r.effectif?.enfants || 0}" min="0" onchange="updateEffTotal()" /></div>
        </div>
        <div class="total-box mt-12">
          <span class="total-box-label">Total présence</span>
          <span class="total-box-value" id="rf-eff-total">${r.effectif?.total || 0}</span>
        </div>
        <div class="flex justify-between mt-16">
          <button class="btn btn-secondary" onclick="goToStep(0)">← Précédent</button>
          <button class="btn btn-primary" onclick="saveStep1()">Suivant →</button>
        </div>`;
    case 2: {
      const socialPct = (Store.getSet().socialPct ?? 10) / 100;
      const ord = r.offrandes?.ordinaires || 0;
      const ora = r.offrandes?.orateur || 0;
      const dim = r.offrandes?.dimes || 0;
      const ag = r.offrandes?.actionsGrace || 0;
      const tot = ord + ora + dim + ag;
      // Calculate ventilation breakdown
      // Rules: 
      // - Offrandes pour Orateur: NO deductions (dime=0, social=0, reste=full)
      // - Dîme 10%: applies to ordinaires, dimes, actionsGrace (NOT orateur)
      // - Social %: applies to all except orateur
      const ordDime = +(ord * 0.1).toFixed(2), ordSocial = +(ord * socialPct).toFixed(2), ordReste = +(ord - ord * 0.1 - ord * socialPct).toFixed(2);
      const oraDime = 0, oraSocial = 0, oraReste = ora;
      const dimDime = +(dim * 0.1).toFixed(2), dimSocial = +(dim * socialPct).toFixed(2), dimReste = +(dim - dim * 0.1 - dim * socialPct).toFixed(2);
      const agDime = +(ag * 0.1).toFixed(2), agSocial = +(ag * socialPct).toFixed(2), agReste = +(ag - ag * 0.1 - ag * socialPct).toFixed(2);
      const totalDime = +(ordDime + dimDime + agDime).toFixed(2);
      const totalSocial = +(ordSocial + dimSocial + agSocial).toFixed(2);
      const totalReste = +(ordReste + oraReste + dimReste + agReste).toFixed(2);
      return `
        <div class="form-section-title">Offrandes (${sym})</div>
        <div class="form-row cols-2">
          <div><label>Offrandes ordinaires</label><input type="number" id="rf-ord" value="${ord}" min="0" onchange="updateOffTotals()" /></div>
          <div><label>Offrande orateur</label><input type="number" id="rf-ora" value="${ora}" min="0" onchange="updateOffTotals()" /></div>
        </div>
        <div class="form-row cols-2">
          <div><label>Dîmes</label><input type="number" id="rf-dim" value="${dim}" min="0" onchange="updateOffTotals()" /></div>
          <div><label>Actions de grâce</label><input type="number" id="rf-ag" value="${ag}" min="0" onchange="updateOffTotals()" /></div>
        </div>
        <div class="total-box mt-12">
          <span class="total-box-label">Total offrandes</span>
          <span class="total-box-value" id="rf-off-total">${fmt(tot, sym)}</span>
        </div>
        <div class="form-section-title mt-20">RÉPARTITION DES RECETTES ET PRÉLÈVEMENTS</div>
        <div class="table-wrap mt-12">
          <table>
            <thead><tr><th>Type de recette</th><th>Montant</th><th>Dîme (10%)</th><th>Social (${Store.getSet().socialPct || 10}%)</th><th>Reste</th></tr></thead>
            <tbody>
              <tr><td>Offrandes ordinaires</td><td>${fmt(ord, sym)}</td><td>${fmt(ordDime, sym)}</td><td>${fmt(ordSocial, sym)}</td><td>${fmt(ordReste, sym)}</td></tr>
              <tr><td>Offrandes pour Orateur</td><td>${fmt(ora, sym)}</td><td>${fmt(oraDime, sym)}</td><td>${fmt(oraSocial, sym)}</td><td>${fmt(oraReste, sym)}</td></tr>
              <tr><td>Dîmes</td><td>${fmt(dim, sym)}</td><td>${fmt(dimDime, sym)}</td><td>${fmt(dimSocial, sym)}</td><td>${fmt(dimReste, sym)}</td></tr>
              <tr><td>Actions de Grâce</td><td>${fmt(ag, sym)}</td><td>${fmt(agDime, sym)}</td><td>${fmt(agSocial, sym)}</td><td>${fmt(agReste, sym)}</td></tr>
              <tr class="total-row"><td><strong>TOTAL</strong></td><td><strong>${fmt(tot, sym)}</strong></td><td><strong>${fmt(totalDime, sym)}</strong></td><td><strong>${fmt(totalSocial, sym)}</strong></td><td><strong>${fmt(totalReste, sym)}</strong></td></tr>
            </tbody>
          </table>
        </div>
        <input type="hidden" id="rf-vent-total-reste" value="${totalReste}" />
        <div class="flex justify-between mt-16">
          <button class="btn btn-secondary" onclick="goToStep(1)">← Précédent</button>
          <button class="btn btn-primary" onclick="saveStep2()">Suivant →</button>
        </div>`;
    }
    case 3: {
      const totalDep = (r.depenses || []).reduce((s, d) => s + d.montant, 0);
      return `
        <div class="form-section-title">Dépenses (${sym})</div>
        <div id="dep-list">
          ${(r.depenses || []).map((d, i) => `<div class="dep-row"><input type="text" placeholder="Motif" value="${d.motif}" id="dep-mot-${i}"><input type="number" placeholder="Montant" value="${d.montant}" min="0" id="dep-mon-${i}" onchange="updateDepTotal(${i})"><button class="btn btn-danger btn-icon" onclick="removeDepRow(${i})">${icon("x")}</button></div>`).join("")}
        </div>
        <button class="btn btn-secondary btn-sm mt-8" onclick="addDepRow()">${icon("plus")} Ajouter une dépense</button>
        <div class="total-box mt-12">
          <span class="total-box-label">Total dépenses</span>
          <span class="total-box-value" id="rf-dep-total">${fmt(totalDep, sym)}</span>
        </div>
        <div class="flex justify-between mt-16">
          <button class="btn btn-secondary" onclick="goToStep(2)">← Précédent</button>
          <button class="btn btn-primary" onclick="saveStep3()">Suivant →</button>
        </div>`;
    }
    case 4:
      return `
        <div class="form-section-title">ACCUEIL DES NOUVEAUX</div>
        <div id="conv-list">
          ${(r.nouveaux || []).map((n, i) => `<div class="conv-row"><input type="text" placeholder="Nom" value="${n.nom}" id="conv-nom-${i}"><input type="text" placeholder="Téléphone" value="${n.tel || ""}" id="conv-tel-${i}"><button class="btn btn-danger btn-icon" onclick="removeConvRow(${i})">${icon("x")}</button></div>`).join("")}
        </div>
        <button class="btn btn-secondary btn-sm mt-8" onclick="addConvRow()">${icon("plus")} Ajouter un converti</button>
        <div class="flex justify-between mt-16">
          <button class="btn btn-secondary" onclick="goToStep(3)">← Précédent</button>
          <button class="btn btn-primary" onclick="saveStep4()">Suivant →</button>
        </div>`;
    case 5:
      return `
        <div class="form-section-title">Signatures</div>
        <div class="form-row">
          <label>Secrétaire</label>
          <input type="text" id="rf-sec" value="${r.signatures?.secretaire || ""}" />
        </div>
        <div class="form-row">
          <label>Trésorier</label>
          <input type="text" id="rf-treso" value="${r.signatures?.tresorier || ""}" />
        </div>
        <div class="form-row">
          <label>Pasteur</label>
          <input type="text" id="rf-past" value="${r.signatures?.pasteur || ""}" />
        </div>
        <div class="flex justify-between mt-16">
          <button class="btn btn-secondary" onclick="goToStep(4)">← Précédent</button>
          <button class="btn btn-primary" onclick="saveStep5()">${icon("save")} Enregistrer</button>
        </div>`;
    default:
      return "";
  }
}

function saveStep0() {
  if (!rapFormData) return;
  rapFormData.date = (document.getElementById("rf-date") as HTMLInputElement).value;
  rapFormData.theme = (document.getElementById("rf-theme") as HTMLInputElement).value;
  rapFormData.heureDebut = (document.getElementById("rf-begin") as HTMLInputElement).value;
  rapFormData.heureFin = (document.getElementById("rf-end") as HTMLInputElement).value;
  rapFormData.moderateur = (document.getElementById("rf-mod") as HTMLInputElement).value;
  rapFormData.predicateur = (document.getElementById("rf-pred") as HTMLInputElement).value;
  rapFormData.interprete = (document.getElementById("rf-int") as HTMLInputElement).value;
  rapFormData.textes = (document.getElementById("rf-txt") as HTMLInputElement).value;
  rapStep = 1;
  const ses = Auth.ses();
  if (ses?.role === "extension") pgExtNew(ses.extId);
}

function updateEffTotal() {
  const p = parseInt((document.getElementById("rf-papas") as HTMLInputElement).value) || 0;
  const m = parseInt((document.getElementById("rf-mamans") as HTMLInputElement).value) || 0;
  const f = parseInt((document.getElementById("rf-freres") as HTMLInputElement).value) || 0;
  const s = parseInt((document.getElementById("rf-soeurs") as HTMLInputElement).value) || 0;
  const e = parseInt((document.getElementById("rf-enfants") as HTMLInputElement).value) || 0;
  document.getElementById("rf-eff-total")!.textContent = String(p + m + f + s + e);
}

function saveStep1() {
  if (!rapFormData) return;
  rapFormData.effectif = {
    papas: parseInt((document.getElementById("rf-papas") as HTMLInputElement).value) || 0,
    mamans: parseInt((document.getElementById("rf-mamans") as HTMLInputElement).value) || 0,
    freres: parseInt((document.getElementById("rf-freres") as HTMLInputElement).value) || 0,
    soeurs: parseInt((document.getElementById("rf-soeurs") as HTMLInputElement).value) || 0,
    enfants: parseInt((document.getElementById("rf-enfants") as HTMLInputElement).value) || 0,
    total: 0,
  };
  rapFormData.effectif.total =
    rapFormData.effectif.papas +
    rapFormData.effectif.mamans +
    rapFormData.effectif.freres +
    rapFormData.effectif.soeurs +
    rapFormData.effectif.enfants;
  rapStep = 2;
  const ses = Auth.ses();
  if (ses?.role === "extension") pgExtNew(ses.extId);
}

function updateOffTotals() {
  const ord = parseInt((document.getElementById("rf-ord") as HTMLInputElement).value) || 0;
  const ora = parseInt((document.getElementById("rf-ora") as HTMLInputElement).value) || 0;
  const dim = parseInt((document.getElementById("rf-dim") as HTMLInputElement).value) || 0;
  const ag = parseInt((document.getElementById("rf-ag") as HTMLInputElement).value) || 0;
  const tot = ord + ora + dim + ag;
  const ext = Store.getExt(rapFormData?.extensionId || "");
  const sym = ext?.symbole || "€";

  document.getElementById("rf-off-total")!.textContent = fmt(tot, sym);

  // Backward-compat: these IDs may not exist depending on UI version.
  const eDim = document.getElementById("rf-vent-dim");
  if (eDim) eDim.textContent = fmt(dim * 0.1, sym);
  const eSoc = document.getElementById("rf-vent-soc");
  if (eSoc) eSoc.textContent = fmt(tot * 0.1, sym);
  const eRes = document.getElementById("rf-vent-reste");
  if (eRes) eRes.textContent = fmt(tot * 0.8, sym);
}

function saveStep2() {
  if (!rapFormData) return;
  const ord = parseInt((document.getElementById("rf-ord") as HTMLInputElement).value) || 0;
  const ora = parseInt((document.getElementById("rf-ora") as HTMLInputElement).value) || 0;
  const dim = parseInt((document.getElementById("rf-dim") as HTMLInputElement).value) || 0;
  const ag = parseInt((document.getElementById("rf-ag") as HTMLInputElement).value) || 0;
  const total = ord + ora + dim + ag;

  // Get social percentage from settings (default 10%)
  const socialPct = (Store.getSet().socialPct ?? 10) / 100;

  // Calculate detailed breakdown
  const ordDime = +(ord * 0.1).toFixed(2);
  const ordSocial = +(ord * socialPct).toFixed(2);
  const ordReste = +(ord - ordDime - ordSocial).toFixed(2);

  const oraDime = 0;
  const oraSocial = 0;
  const oraReste = ora;

  const dimDime = +(dim * 0.1).toFixed(2);
  const dimSocial = +(dim * socialPct).toFixed(2);
  const dimReste = +(dim - dimDime - dimSocial).toFixed(2);

  const agDime = +(ag * 0.1).toFixed(2);
  const agSocial = +(ag * socialPct).toFixed(2);
  const agReste = +(ag - agDime - agSocial).toFixed(2);

  const totalDime = +(ord * 0.1 + dimDime + ag * 0.1).toFixed(2);
  const totalSocial = +(ordSocial + dimSocial + agSocial).toFixed(2);
  const totalReste = +(ordReste + oraReste + dimReste + agReste).toFixed(2);

  rapFormData.offrandes = { ordinaires: ord, orateur: ora, dimes: dim, actionsGrace: ag, total };
  rapFormData.ventilation = {
    ordinaires: { dime: ordDime, social: ordSocial, reste: ordReste },
    orateur: { dime: oraDime, social: oraSocial, reste: oraReste },
    dimes: { dime: dimDime, social: dimSocial, reste: dimReste },
    actionsGrace: { dime: agDime, social: agSocial, reste: agReste },
    totalDime,
    totalSocial,
    reste: totalReste,
  };
  rapStep = 3;
  const ses = Auth.ses();
  if (ses?.role === "extension") pgExtNew(ses.extId);
}

function updateDepTotal(_idx: number) {
  void _idx;
  // Recalcule simplement le total à partir des champs actuels
  const depRows = document.querySelectorAll(".dep-row");
  let total = 0;
  depRows.forEach((_, i) => {
    const mon = parseInt((document.getElementById(`dep-mon-${i}`) as HTMLInputElement)?.value) || 0;
    total += mon;
  });
  const ses = Auth.ses();
  const ext = ses && ses.role === "extension" ? Store.getExt(ses.extId) : null;
  const sym = ext?.symbole || "€";
  document.getElementById("rf-dep-total")!.textContent = fmt(total, sym);
}

window.addDepRow = function () {
  if (!rapFormData) return;
  rapFormData.depenses = rapFormData.depenses || [];
  rapFormData.depenses.push({ motif: "", montant: 0 });
  const ses = Auth.ses();
  if (ses?.role === "extension") pgExtNew(ses.extId);
};

window.removeDepRow = function (idx: number) {
  if (!rapFormData?.depenses) return;
  rapFormData.depenses.splice(idx, 1);
  const ses = Auth.ses();
  if (ses?.role === "extension") pgExtNew(ses.extId);
};

function saveStep3() {
  if (!rapFormData) return;
  const depRows = document.querySelectorAll(".dep-row");
  const deps: { motif: string; montant: number }[] = [];
  depRows.forEach((row, i) => {
    const mot = (document.getElementById(`dep-mot-${i}`) as HTMLInputElement)?.value || "";
    const mon = parseInt((document.getElementById(`dep-mon-${i}`) as HTMLInputElement)?.value) || 0;
    if (mot) deps.push({ motif: mot, montant: mon });
  });
  rapFormData.depenses = deps;
  rapFormData.totalDepenses = deps.reduce((s, d) => s + d.montant, 0);
  
  // Calculate based on "Reste" from ventilation (not total offrandes)
  const reste = rapFormData.ventilation?.reste || 0;
  
  // Check if expenses exceed the "Reste"
  if (rapFormData.totalDepenses > reste) {
    toast(`Attention: Les dépenses (${rapFormData.totalDepenses}) dépassent le reste disponible (${reste})!`, "error");
    // Don't proceed to next step
    return;
  }
  
  rapFormData.soldeFinal = reste - rapFormData.totalDepenses;
  rapStep = 4;
  const ses = Auth.ses();
  if (ses?.role === "extension") pgExtNew(ses.extId);
}

window.addConvRow = function () {
  if (!rapFormData) return;
  rapFormData.nouveaux = rapFormData.nouveaux || [];
  rapFormData.nouveaux.push({ nom: "", tel: "" });
  const ses = Auth.ses();
  if (ses?.role === "extension") pgExtNew(ses.extId);
};

window.removeConvRow = function (idx: number) {
  if (!rapFormData?.nouveaux) return;
  rapFormData.nouveaux.splice(idx, 1);
  const ses = Auth.ses();
  if (ses?.role === "extension") pgExtNew(ses.extId);
};

function saveStep4() {
  if (!rapFormData) return;
  const convRows = document.querySelectorAll(".conv-row");
  const convs: { nom: string; tel?: string }[] = [];
  convRows.forEach((_, i) => {
    const nom = (document.getElementById(`conv-nom-${i}`) as HTMLInputElement)?.value || "";
    const tel = (document.getElementById(`conv-tel-${i}`) as HTMLInputElement)?.value || "";
    if (nom) convs.push({ nom, tel: tel || undefined });
  });
  rapFormData.nouveaux = convs;
  rapStep = 5;
  const ses = Auth.ses();
  if (ses?.role === "extension") pgExtNew(ses.extId);
}

function saveStep5() {
  if (!rapFormData) return;
  rapFormData.signatures = {
    secretaire: (document.getElementById("rf-sec") as HTMLInputElement).value,
    tresorier: (document.getElementById("rf-treso") as HTMLInputElement).value,
    pasteur: (document.getElementById("rf-past") as HTMLInputElement).value,
  };

  // Persist via application layer (centralized business rules) when available.
  const toSave = rapFormData;
  Promise.resolve()
    .then(async () => {
      if (appCtx) {
        const res = await appCtx.saveRapport(toSave);
        if (!res.ok) throw new Error(res.message);
      } else {
        Store.saveRap(toSave);
      }
    })
    .then(() => {
      toast("Rapport enregistré avec succès", "success");
      rapFormData = null;
      rapStep = 0;
      navTo("/ext/rapports");
    })
    .catch((e) => {
      toast("Erreur lors de l'enregistrement du rapport", "error");
      console.error(e);
    });
}

function pgExtRaps(params: Record<string, string> = {}) {
  setActive("/ext/rapports");
  const ses = Auth.ses();
  if (!ses || ses.role !== "extension") return;
  const extId = ses.extId;
  const ext = Store.getExt(extId);
  const fMonth = params.month !== undefined && params.month !== "" ? parseInt(params.month) : -1;
  const fYear = params.year ? parseInt(params.year) : 0;

  let raps = Store.getRaps(extId);
  if (fMonth >= 0) raps = raps.filter((r) => new Date(r.date + "T00:00").getMonth() === fMonth);
  if (fYear) raps = raps.filter((r) => new Date(r.date + "T00:00").getFullYear() === fYear);
  raps.sort((a, b) => b.date.localeCompare(a.date));

  setTopbar("Mes Rapports", ext?.nom || "", "");

  render(`
    <div class="page-header">
      <div><h1>Mes Rapports</h1><p>${raps.length} rapport(s)</p></div>
      <button class="btn btn-primary" onclick="navTo('/ext/new')">${icon("plus")} Nouveau</button>
    </div>
    <div class="filter-bar">
      <select onchange="extRapFilter(this,'month')">
        <option value="">— Tous les mois —</option>
        ${Array.from({ length: 12 }, (_, i) => `<option value="${i}"${fMonth === i ? " selected" : ""}>${mName(i)}</option>`).join("")}
      </select>
      <select onchange="extRapFilter(this,'year')">
        <option value="">— Toutes années —</option>
        ${[2026, 2025, 2024, 2023].map((y) => `<option value="${y}"${fYear === y ? " selected" : ""}>${y}</option>`).join("")}
      </select>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Présence</th><th>Offrandes</th><th>Convertis</th><th>Actions</th></tr></thead>
        <tbody>
          ${raps.length === 0 ? `<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text3)">Aucun rapport</td></tr>` : ""}
          ${raps
            .map(
              (r) => `<tr>
            <td class="td-bold">${fmtD(r.date)}</td>
            <td>${r.effectif?.total || 0}</td>
            <td>${fmt(r.offrandes?.total, ext?.symbole || "€")}</td>
            <td>${r.nouveaux?.length || 0}</td>
            <td>
              <div class="flex gap-8">
                <button class="btn btn-secondary btn-sm btn-icon" onclick="showRapModal('${r.id}')" title="Voir">${icon("eye")}</button>
                <button class="btn btn-danger btn-sm btn-icon" onclick="doDeleteRap('${r.id}')" title="Supprimer">${icon("trash")}</button>
              </div>
            </td>
          </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `);
}

window.extRapFilter = function (sel: HTMLSelectElement, field: string) {
  const p = curParams();
  if (sel.value !== "") p[field] = sel.value;
  else delete p[field];
  navTo("/ext/rapports", p);
};

window.doDeleteRap = function (id: string) {
  if (!confirm("Supprimer ce rapport ?")) return;
  Store.delRap(id);
  toast("Rapport supprimé", "success");
  pgExtRaps();
};

function pgExtBilans(extId: string) {
  setActive("/ext/bilans");
  const ext = Store.getExt(extId);
  const yr = new Date().getFullYear();
  const mo = Store.monthly(extId, yr);
  const socialPct = Store.getSet().socialPct || 10;

  setTopbar("Bilans", ext?.nom || "", "");

  const currentYearData = getBilanData(extId, "annual", yr, undefined, undefined);

  render(`
    <div class="page-header">
      <div><h1>Bilans Financiers</h1><p>${ext?.nom || ""} - ${yr}</p></div>
      <div class="flex gap-8">
        <button class="btn btn-blue" onclick="window.doExportBilanExt('monthly')">${icon("fileText")} Mensuel</button>
        <button class="btn btn-blue" onclick="window.doExportBilanExt('quarterly')">${icon("fileText")} Trimestriel</button>
        <button class="btn btn-blue" onclick="window.doExportBilanExt('annual')">${icon("fileText")} Annuel</button>
        <button class="btn btn-secondary" onclick="window.exportBilanToCSV('${extId}', 'annual', ${yr})">${icon("download")} CSV</button>
      </div>
    </div>

    <div class="grid-4 mb-20">
      <div class="card" style="border-left:3px solid ${ext?.couleur}">
        <div class="form-section-title mb-8">Cultes</div>
        <div class="text-4xl font-bold text-purple-600">${currentYearData.cultes}</div>
      </div>
      <div class="card" style="border-left:3px solid ${ext?.couleur}">
        <div class="form-section-title mb-8">Présence totale</div>
        <div class="text-4xl font-bold text-blue-600">${currentYearData.presence}</div>
      </div>
      <div class="card" style="border-left:3px solid ${ext?.couleur}">
        <div class="form-section-title mb-8">Total Offrandes</div>
        <div class="text-4xl font-bold text-green-600">${fmtTRY(currentYearData.totalRecettes)}</div>
      </div>
      <div class="card" style="border-left:3px solid ${ext?.couleur}">
        <div class="form-section-title mb-8">Solde Final</div>
        <div class="text-4xl font-bold ${currentYearData.soldeFinal >= 0 ? 'text-green-600' : 'text-red-600'}">${fmtTRY(currentYearData.soldeFinal)}</div>
      </div>
    </div>

    <div class="card mb-12">
      <div class="form-section-title mb-12">RÉPARTITION DES RECETTES (${yr})</div>
      <table class="w-full">
        <thead>
          <tr class="bg-gray-100">
            <th class="border border-gray-300 px-4 py-3 text-left font-bold">Type de recette</th>
            <th class="border border-gray-300 px-4 py-3 text-right font-bold">Montant (₺)</th>
            <th class="border border-gray-300 px-4 py-3 text-right font-bold">Dîme 10%</th>
            <th class="border border-gray-300 px-4 py-3 text-right font-bold">Social (${socialPct}%)</th>
            <th class="border border-gray-300 px-4 py-3 text-right font-bold">Reste</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="border border-gray-300 px-4 py-3">Offrandes ordinaires</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(currentYearData.ordinaires)}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(currentYearData.ordinaires * 0.1)}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(currentYearData.ordinaires * (socialPct/100))}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(currentYearData.ordinaires * (1 - 0.1 - socialPct/100))}</td>
          </tr>
          <tr>
            <td class="border border-gray-300 px-4 py-3">Offrandes pour Orateur</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(currentYearData.orateur)}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">₺ 0,00</td>
            <td class="border border-gray-300 px-4 py-3 text-right">₺ 0,00</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(currentYearData.orateur)}</td>
          </tr>
          <tr>
            <td class="border border-gray-300 px-4 py-3">Dîmes</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(currentYearData.dimes)}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(currentYearData.dimes * 0.1)}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(currentYearData.dimes * (socialPct/100))}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(currentYearData.dimes * (1 - 0.1 - socialPct/100))}</td>
          </tr>
          <tr>
            <td class="border border-gray-300 px-4 py-3">Actions de Grâce</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(currentYearData.actionsGrace)}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(currentYearData.actionsGrace * 0.1)}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(currentYearData.actionsGrace * (socialPct/100))}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(currentYearData.actionsGrace * (1 - 0.1 - socialPct/100))}</td>
          </tr>
          <tr class="bg-gray-200 font-bold">
            <td class="border border-gray-300 px-4 py-3">TOTAL</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(currentYearData.totalRecettes)}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(currentYearData.dimeTotal)}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(currentYearData.socialTotal)}</td>
            <td class="border border-gray-300 px-4 py-3 text-right">${fmtTRY(currentYearData.resteTotal)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card mb-20">
      <div class="form-section-title mb-12">Présence mensuelle (${yr})</div>
      <div class="chart-wrap" style="height:200px"><canvas id="chM"></canvas></div>
    </div>
    <div class="form-section-title mb-12">Détails mensuels</div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Mois</th><th>Cultes</th><th>Présence</th><th>Offrandes</th><th>Convertis</th></tr></thead>
        <tbody>
          ${mo
            .map(
              (m) => `<tr>
            <td class="td-bold">${m.lbl} ${yr}</td>
            <td>${m.cultes}</td>
            <td>${m.presence}</td>
            <td>${fmt(m.offrandes, ext?.symbole || "€")}</td>
            <td>${m.nouveaux}</td>
          </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `);

  chartBar("chM", mo.map((m) => m.lbl), mo.map((m) => m.presence), "Présence", "rgba(139,92,246,.7)");

  (window as any)._extBilanParams = { extId, socialPct };
}

function doExportBilanExtHTML(period: "monthly" | "quarterly" | "annual") {
  const ses = Auth.ses();
  if (!ses || ses.role !== "extension") return;
  const extId = ses.extId;
  const params = (window as any)._extBilanParams || { extId, socialPct: 10 };
  const { socialPct } = params;
  const ext = Store.getExt(extId);
  const logo = Store.getLogo();
  const yr = new Date().getFullYear();

  let periodLabel = `${yr}`;
  let data;

  if (period === "monthly") {
    const currentMonth = new Date().getMonth();
    data = getBilanData(extId, "monthly", yr, currentMonth, undefined);
    periodLabel = `${mName(currentMonth)} ${yr}`;
  } else if (period === "quarterly") {
    const currentQuarter = Math.floor(new Date().getMonth() / 3);
    data = getBilanData(extId, "quarterly", yr, undefined, currentQuarter);
    const qLabels = ["Q1 (Jan-Mar)", "Q2 (Apr-Jun)", "Q3 (Jul-Sep)", "Q4 (Oct-Dec)"];
    periodLabel = `${qLabels[currentQuarter]} ${yr}`;
  } else {
    data = getBilanData(extId, "annual", yr, undefined, undefined);
  }

  const headerHtml = logo ? `
    <div class="flex items-center gap-4 mb-6 pb-4 border-b-2 border-black">
      <img src="${logo}" alt="Logo" class="h-12 w-auto object-contain" style="max-height:40mm;" />
      <div>
        <h1 class="text-2xl font-bold uppercase">${ext?.nom || "Emerge in Christ"}</h1>
        <p class="text-gray-600">Bilan Financier - ${periodLabel}</p>
      </div>
    </div>
  ` : `
    <div class="text-center mb-6 pb-4 border-b-2 border-black">
      <h1 class="text-2xl font-bold uppercase">${ext?.nom || "Emerge in Christ"}</h1>
      <p class="text-gray-600">Bilan Financier - ${periodLabel}</p>
    </div>
  `;

  const repartitionTable = `
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="bg-gray-100">
          <th class="border border-black px-3 py-2 text-left font-bold">Type de recette</th>
          <th class="border border-black px-3 py-2 text-right font-bold">Montant (₺)</th>
          <th class="border border-black px-3 py-2 text-right font-bold">Dîme 10 %</th>
          <th class="border border-black px-3 py-2 text-right font-bold">Social (${socialPct}%)</th>
          <th class="border border-black px-3 py-2 text-right font-bold">Reste</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="border border-black px-3 py-2">Offrandes ordinaires</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.ordinaires)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.ordinaires * 0.1)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.ordinaires * (socialPct/100))}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.ordinaires * (1 - 0.1 - socialPct/100))}</td>
        </tr>
        <tr>
          <td class="border border-black px-3 py-2">Offrandes pour Orateur</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.orateur)}</td>
          <td class="border border-black px-3 py-2 text-right">₺ 0,00</td>
          <td class="border border-black px-3 py-2 text-right">₺ 0,00</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.orateur)}</td>
        </tr>
        <tr>
          <td class="border border-black px-3 py-2">Dîmes</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.dimes)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.dimes * 0.1)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.dimes * (socialPct/100))}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.dimes * (1 - 0.1 - socialPct/100))}</td>
        </tr>
        <tr>
          <td class="border border-black px-3 py-2">Actions de Grâce</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.actionsGrace)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.actionsGrace * 0.1)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.actionsGrace * (socialPct/100))}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.actionsGrace * (1 - 0.1 - socialPct/100))}</td>
        </tr>
        <tr class="bg-gray-200 font-bold">
          <td class="border border-black px-3 py-2">TOTAL</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.totalRecettes)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.dimeTotal)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.socialTotal)}</td>
          <td class="border border-black px-3 py-2 text-right">${fmtTRY(data.resteTotal)}</td>
        </tr>
      </tbody>
    </table>`;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bilan Financier - ${ext?.nom || "EIC"} - ${periodLabel}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @page { size: A4; margin: 16mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; width: 100% !important; margin: 0 !important; padding: 16mm !important; }
      .no-print { display: none !important; }
    }
    body { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 16mm; box-sizing: border-box; }
  </style>
</head>
<body class="bg-white text-gray-900 font-sans">
  <div class="no-print mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg print:hidden">
    <p class="text-sm text-blue-800"><strong>Conseil :</strong> Utilisez "Enregistrer sous PDF" dans la boîte de dialogue d'impression pour sauvegarder ce bilan.</p>
  </div>

  <div class="text-center mb-6">
    <h1 class="text-3xl font-bold uppercase tracking-wider border-b-4 border-black pb-2 inline-block">BILAN FINANCIER</h1>
  </div>

  ${headerHtml}

  <!-- STATISTIQUES GLOBALES -->
  <div class="mb-6">
    <h3 class="text-lg font-bold uppercase mb-3 pb-2 border-b border-black">Statistiques Globales</h3>
    <div class="grid grid-cols-4 gap-4 text-center">
      <div class="border border-black p-3"><div class="text-2xl font-bold">${data.cultes}</div><div class="text-sm">Cultes</div></div>
      <div class="border border-black p-3"><div class="text-2xl font-bold">${data.presence}</div><div class="text-sm">Présence</div></div>
      <div class="border border-black p-3"><div class="text-2xl font-bold text-green-700">${fmtTRY(data.totalRecettes)}</div><div class="text-sm">Total Recettes</div></div>
      <div class="border border-black p-3"><div class="text-2xl font-bold ${data.soldeFinal >= 0 ? 'text-green-700' : 'text-red-700'}">${fmtTRY(data.soldeFinal)}</div><div class="text-sm">Solde Final</div></div>
    </div>
  </div>

  <!-- RÉPARTITION DES RECETTES -->
  <div class="mb-6">
    <h3 class="text-lg font-bold uppercase mb-3 pb-2 border-b border-black">Répartition des Recettes et Prélèvements</h3>
    ${repartitionTable}
  </div>

  <!-- RÉSUMÉ FINANCIER -->
  <div class="mb-6">
    <h3 class="text-lg font-bold uppercase mb-3 pb-2 border-b border-black">Résumé Financier</h3>
    <table class="w-full border-collapse text-sm">
      <tbody>
        <tr class="bg-gray-100"><td class="border border-black px-3 py-2 font-bold">Total Recettes</td><td class="border border-black px-3 py-2 text-right font-bold">${fmtTRY(data.totalRecettes)}</td></tr>
        <tr><td class="border border-black px-3 py-2">- Prélèvement Dîme (10%)</td><td class="border border-black px-3 py-2 text-right text-red-600">${fmtTRY(data.dimeTotal)}</td></tr>
        <tr><td class="border border-black px-3 py-2">- Prélèvement Social (${socialPct}%)</td><td class="border border-black px-3 py-2 text-right text-red-600">${fmtTRY(data.socialTotal)}</td></tr>
        <tr class="bg-gray-200"><td class="border border-black px-3 py-2 font-bold">= Montant Disponible</td><td class="border border-black px-3 py-2 text-right font-bold">${fmtTRY(data.resteTotal)}</td></tr>
        <tr><td class="border border-black px-3 py-2">- Total Dépenses</td><td class="border border-black px-3 py-2 text-right text-red-600">${fmtTRY(data.totalDepenses)}</td></tr>
        <tr class="bg-gray-200"><td class="border border-black px-3 py-2 font-bold">= Solde Final</td><td class="border border-black px-3 py-2 text-right font-bold ${data.soldeFinal >= 0 ? 'text-green-700' : 'text-red-700'}">${fmtTRY(data.soldeFinal)}</td></tr>
      </tbody>
    </table>
  </div>

  <!-- AUTRES STATISTIQUES -->
  <div class="mb-6">
    <h3 class="text-lg font-bold uppercase mb-3 pb-2 border-b border-black">Autres Statistiques</h3>
    <div class="grid grid-cols-3 gap-4 text-sm">
      <div><span class="font-bold">Nombre de cultes :</span> ${data.cultes}</div>
      <div><span class="font-bold">Présence totale :</span> ${data.presence}</div>
      <div><span class="font-bold">Présence moyenne :</span> ${data.cultes > 0 ? Math.round(data.presence / data.cultes) : 0}</div>
      <div><span class="font-bold">Nouveaux convertis :</span> ${data.nouveaux}</div>
      <div><span class="font-bold">Moyenne offrandes/culte :</span> ${fmtTRY(data.cultes > 0 ? data.totalRecettes / data.cultes : 0)}</div>
    </div>
  </div>

  <!-- SIGNATURES -->
  <div class="mt-12 pt-4 border-t-4 border-black">
    <div class="grid grid-cols-3 gap-4 text-sm">
      <div class="text-center">
        <div class="border-b-2 border-black mb-2 pb-8"></div>
        <div class="font-bold">Secrétaire</div>
      </div>
      <div class="text-center">
        <div class="border-b-2 border-black mb-2 pb-8"></div>
        <div class="font-bold">Trésorier</div>
      </div>
      <div class="text-center">
        <div class="border-b-2 border-black mb-2 pb-8"></div>
        <div class="font-bold">Pasteur</div>
      </div>
    </div>
  </div>

  <div class="no-print mt-8 text-center">
    <button onclick="window.print()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg">
      Imprimer / Enregistrer PDF
    </button>
  </div>
</body>
</html>`;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
  toast("Fenêtre d'impression ouverte", "success");
}

(window as any).doExportBilanExt = doExportBilanExtHTML;

function exportBilanToCSV(extId: string | null, period: "monthly" | "quarterly" | "annual", yr: number, month?: number, quarter?: number) {
  const data = getBilanData(extId, period, yr, month, quarter);
  const exts = Store.getExts();
  const ext = extId ? exts.find(e => e.id === extId) : null;
  const socialPct = Store.getSet().socialPct || 10;
  
  let periodLabel = `${yr}`;
  if (period === "monthly" && month !== undefined) {
    periodLabel = `${mName(month)} ${yr}`;
  } else if (period === "quarterly" && quarter !== undefined) {
    const qLabels = ["Q1", "Q2", "Q3", "Q4"];
    periodLabel = `${qLabels[quarter]} ${yr}`;
  }
  
  // Build CSV content - use simple string concatenation to avoid template literal issues
  const socialHeader = "Social (" + socialPct + "%)";
  const headerRow = "Type,Montant (₺),Dime 10%," + socialHeader + ",Reste";
  const row1 = "Offrandes ordinaires," + data.ordinaires.toFixed(2) + "," + (data.ordinaires * 0.1).toFixed(2) + "," + (data.ordinaires * socialPct / 100).toFixed(2) + "," + (data.ordinaires * (1 - 0.1 - socialPct / 100)).toFixed(2);
  const row2 = "Offrandes pour Orateur," + data.orateur.toFixed(2) + ",0.00,0.00," + data.orateur.toFixed(2);
  const row3 = "Dimes," + data.dimes.toFixed(2) + "," + (data.dimes * 0.1).toFixed(2) + "," + (data.dimes * socialPct / 100).toFixed(2) + "," + (data.dimes * (1 - 0.1 - socialPct / 100)).toFixed(2);
  const row4 = "Actions de Grace," + data.actionsGrace.toFixed(2) + "," + (data.actionsGrace * 0.1).toFixed(2) + "," + (data.actionsGrace * socialPct / 100).toFixed(2) + "," + (data.actionsGrace * (1 - 0.1 - socialPct / 100)).toFixed(2);
  const rowTotal = "TOTAL," + data.totalRecettes.toFixed(2) + "," + data.dimeTotal.toFixed(2) + "," + data.socialTotal.toFixed(2) + "," + data.resteTotal.toFixed(2);
  
  const summary = "\n\nRESUME FINANCIER\nTotal Recettes," + data.totalRecettes.toFixed(2) + "\n- Prelvement Dime (10%)," + data.dimeTotal.toFixed(2) + "\n- Prelvement Social (" + socialPct + "%)," + data.socialTotal.toFixed(2) + "\n= Montant Disponible," + data.resteTotal.toFixed(2) + "\n- Total Depenses," + data.totalDepenses.toFixed(2) + "\n= Solde Final," + data.soldeFinal.toFixed(2);
  
  const stats = "\n\nSTATISTIQUES\nNombre de cultes," + data.cultes + "\nPresence totale," + data.presence + "\nPresence moyenne," + (data.cultes > 0 ? Math.round(data.presence / data.cultes) : 0) + "\nNouveaux convertis," + data.nouveaux;
  
  const csv = headerRow + "\n" + row1 + "\n" + row2 + "\n" + row3 + "\n" + row4 + "\n" + rowTotal + summary + stats;
  
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Bilan_${ext?.nom || "EIC"}_${periodLabel.replace(/ /g, "_")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast("Bilan exporté en CSV", "success");
}

(window as any).exportBilanToCSV = exportBilanToCSV;

function pgExtConvertis(extId: string) {
  setActive("/ext/convertis");
  const ext = Store.getExt(extId);
  const convertis = Store.allNouveaux(extId);

  setTopbar("Convertis", ext?.nom || "", "");

  render(`
    <div class="page-header">
      <div><h1>Nouveaux Convertis</h1><p>${convertis.length} converti(s)</p></div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Nom</th><th>Téléphone</th><th>Actions</th></tr></thead>
        <tbody>
          ${convertis.length === 0 ? `<tr><td colspan="4" style="text-align:center;padding:32px;color:var(--text3)">Aucun converti</td></tr>` : ""}
          ${convertis
            .map(
              (c) => `<tr>
            <td class="td-bold">${fmtD(c.date)}</td>
            <td>${c.nom}</td>
            <td>${c.tel || "—"}</td>
            <td><button class="btn btn-secondary btn-sm" onclick="showRapModal('${c.rapId}')">${icon("eye")}</button></td>
          </tr>`
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `);
}

window.confirmDelExt = function (id: string) {
  const ext = Store.getExt(id);
  if (!ext) return;
  openModal(
    `<div class="modal-header"><h2>Supprimer l'extension</h2><button class="modal-close" onclick="closeModal()">${icon("x")}</button></div>
    <div class="modal-body"><p style="color:var(--text2)">Supprimer <strong style="color:var(--text)">${ext.nom}</strong> et tous ses rapports ? Action irréversible.</p></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
      <button class="btn btn-danger" onclick="closeModal();(window as any)._delExt('${id}')">Confirmer</button>
    </div>`
  );
};

(window as any)._delExt = function (id: string) {
  Promise.resolve()
    .then(async () => {
      if (appCtx) {
        const res = await appCtx.deleteExtension(id);
        if (!res.ok) throw new Error(res.message);
      } else {
        Store.delExt(id);
      }
    })
    .then(() => {
      toast("Extension supprimée", "success");
      pgAdminExts();
    })
    .catch((e) => {
      toast("Erreur lors de la suppression", "error");
      console.error(e);
    });
};

window.openExtForm = function (extId: string | null) {
  const e = extId ? Store.getExt(extId) : null;
  const isEdit = !!extId;
  openModal(
    `<div class="modal-header"><h2>${isEdit ? "Modifier" : "Nouvelle"} Extension</h2><button class="modal-close" onclick="closeModal()">${icon("x")}</button></div>
    <div class="modal-body">
      <div class="form-section-title mb-12">Identité</div>
      <div class="form-row cols-2">
        <div><label>Nom de l'extension *</label><input id="ef-nom" value="${e?.nom || ""}"/></div>
        <div><label>Date de création</label><input id="ef-date" type="date" value="${e?.dateCreation || ""}"/></div>
      </div>
      <div class="form-row cols-3">
        <div><label>Couleur</label><input id="ef-col" type="color" value="${e?.couleur || "#8B5CF6"}"/></div>
        <div><label>Devise</label><select id="ef-dev" onchange="onDevChange()">
          ${DEVISES.map((d) => `<option value="${d.c}" data-s="${d.s}" ${e?.devise === d.c ? "selected" : ""}>${d.c} — ${d.s}</option>`).join("")}
        </select></div>
        <div><label>Symbole</label><input id="ef-sym" value="${e?.symbole || "€"}" placeholder="€"/></div>
      </div>
      <div class="form-section-title mb-12">Localisation</div>
      <div class="form-row"><label>Adresse complète</label><input id="ef-addr" value="${e?.adresse || ""}"/></div>
      <div class="form-row cols-2">
        <div><label>Ville</label><input id="ef-ville" value="${e?.ville || ""}"/></div>
        <div><label>Pays</label><input id="ef-pays" value="${e?.pays || ""}"/></div>
      </div>
      <div class="form-section-title mb-12">Équipe Pastorale</div>
      <div class="form-row cols-2">
        <div><label>Pasteur Principal</label><input id="ef-past" value="${e?.pasteur?.nom || ""}"/></div>
        <div><label>Email du Pasteur</label><input id="ef-email" type="email" value="${e?.pasteur?.email || ""}"/></div>
      </div>
      <div class="form-row cols-2">
        <div><label>Téléphone</label><input id="ef-tel" value="${e?.pasteur?.tel || ""}"/></div>
        <div><label>Coordinateur</label><input id="ef-coord" value="${e?.coordinateur || ""}"/></div>
      </div>
      <div class="form-row cols-2">
        <div><label>Secrétaire</label><input id="ef-sec" value="${e?.secretaire || ""}"/></div>
        <div><label>Trésorier</label><input id="ef-tres" value="${e?.tresorier || ""}"/></div>
      </div>
      <div class="form-section-title mb-12">Accès</div>
      <div class="form-row cols-2">
        <div><label>Mot de passe *</label><input id="ef-pw" value="${e?.password || ""}"/></div>
        <div></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" onclick="saveExtForm('${extId || ""}')">${icon("save")} Enregistrer</button>
    </div>`,
    true
  );
};

window.onDevChange = function () {
  const sel = document.getElementById("ef-dev") as HTMLSelectElement;
  const opt = sel.options[sel.selectedIndex];
  const sym = document.getElementById("ef-sym") as HTMLInputElement;
  if (sym && opt) sym.value = opt.dataset.s || "";
};

window.saveExtForm = function (extId: string) {
  const g = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value?.trim() || "";
  const nom = g("ef-nom");
  if (!nom) {
    toast("Le nom est obligatoire", "error");
    return;
  }
  const pw = g("ef-pw");
  if (!pw) {
    toast("Mot de passe obligatoire", "error");
    return;
  }
  const ext: Extension = {
    id: extId || "ext_" + Date.now(),
    nom,
    dateCreation: g("ef-date"),
    couleur: g("ef-col") || "#8B5CF6",
    devise: (document.getElementById("ef-dev") as HTMLSelectElement)?.value || "EUR",
    symbole: g("ef-sym") || "€",
    adresse: g("ef-addr"),
    ville: g("ef-ville"),
    pays: g("ef-pays"),
    pasteur: { nom: g("ef-past"), email: g("ef-email"), tel: g("ef-tel") },
    coordinateur: g("ef-coord"),
    secretaire: g("ef-sec"),
    tresorier: g("ef-tres"),
    password: pw,
  };

  Promise.resolve()
    .then(async () => {
      if (appCtx) {
        const res = await appCtx.saveExtension(ext);
        if (!res.ok) throw new Error(res.message);
        // Keep UI list consistent (local cache)
        localStorage.setItem("eic_ext", JSON.stringify(Store.getExts()));
      } else {
        Store.saveExt(ext);
      }
    })
    .then(() => {
      closeModal();
      toast(`Extension "${nom}" enregistrée`, "success");
      pgAdminExts();
    })
    .catch((e) => {
      toast("Erreur lors de l'enregistrement", "error");
      console.error(e);
    });
};

window.adminRapFilter = function (sel: HTMLSelectElement, field: string) {
  const p = curParams();
  if (sel.value !== "") p[field] = sel.value;
  else delete p[field];
  navTo("/admin/rapports", p);
};

window.showRapModal = showRapModal;
window.doExportHTML = doExportHTML;
window.doExportPDF = doExportPDF;
window.doExportDOCX = doExportDOCX;

export async function initApp() {
  appCtx = await createAppContext();

  // Supabase => localStorage (source de vérité distante)
  await syncFromSupabase((msg) => toast(msg, "error"));
  // Optionnel: seed de données de démo en local uniquement si DEMO_MODE=true
  seedIfNeeded();

  window.doLogin = function (type: string) {
    const err = document.getElementById("login-error")!;
    err.style.display = "none";
    if (type === "admin") {
      const pw = (document.getElementById("admin-pw") as HTMLInputElement).value;
      if (Auth.loginAdmin(pw)) {
        startApp();
      } else {
        err.textContent = "Mot de passe incorrect.";
        err.style.display = "block";
      }
    } else {
      const id = (document.getElementById("ext-select") as HTMLSelectElement).value;
      const pw = (document.getElementById("ext-pw") as HTMLInputElement).value;
      if (Auth.loginExt(id, pw)) {
        startApp();
      } else {
        err.textContent = "Extension ou mot de passe incorrect.";
        err.style.display = "block";
      }
    }
  };

  window.doLogout = function () {
    Auth.logout();
    location.reload();
  };

  window.toggleSidebar = function () {
    document.getElementById("sidebar")!.classList.toggle("open");
  };

  window.navTo = navTo;
  (window as any).navItemClick = navItemClick;
  window.curPath = curPath;
  window.curParams = curParams;
  window.goToStep = goToStep;
  window.saveStep0 = saveStep0;
  window.saveStep1 = saveStep1;
  window.saveStep2 = saveStep2;
  window.saveStep3 = saveStep3;
  window.saveStep4 = saveStep4;
  window.saveStep5 = saveStep5;
  window.updateEffTotal = updateEffTotal;
  window.updateOffTotals = updateOffTotals;
  window.updateDepTotal = updateDepTotal;

  // Admin functions used in onclick handlers
  window.pgAdminExts = pgAdminExts;
  window.saveSettings = saveSettings;
  window.clearLogo = clearLogo;
  window.handleLogoUpload = handleLogoUpload;
  window.exportData = exportData;
  window.importData = importData;
  window.resetData = resetData;

  const ses = Auth.ses();
  if (ses) {
    startApp();
    return;
  }

  populateExtSel();
  updateLogoUI();
}
