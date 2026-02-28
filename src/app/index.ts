import { Store, Auth, seedIfNeeded, type Rapport, type Session } from "./state";
import { ADMIN_NAV, EXT_NAV, DEVISES, type Extension } from "./constants";
import { fmt, fmtD, uid, mName } from "./utils";
import { icon } from "./icons";

declare global {
  interface Window {
    _charts: Record<string, any>;
    switchTab: (tab: string) => void;
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
  }
}

const _routes: Record<string, (params: Record<string, string>) => void> = {};

function regRoute(path: string, fn: (params: Record<string, string>) => void) {
  _routes[path] = fn;
}

function navTo(path: string, params: Record<string, string> = {}) {
  const q = Object.keys(params).length ? "?" + new URLSearchParams(params).toString() : "";
  window.location.hash = path + q;
}

function curPath(): string {
  return (window.location.hash.slice(1).split("?")[0]) || "/";
}

function curParams(): Record<string, string> {
  const [, q] = window.location.hash.slice(1).split("?");
  return q ? Object.fromEntries(new URLSearchParams(q)) : {};
}

function initRouter() {
  const dispatch = () => {
    const p = curPath();
    const fn = _routes[p] || _routes["*"];
    if (fn) fn(curParams());
  };
  window.addEventListener("hashchange", dispatch);
  dispatch();
}

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

function toast(msg: string, type: "success" | "error" = "success") {
  const w = document.getElementById("toast-wrap")!;
  const el = document.createElement("div");
  el.className = `toast t-${type}`;
  el.innerHTML = `<span>${type === "success" ? "✓" : "✕"}</span><span>${msg}</span>`;
  w.appendChild(el);
  setTimeout(() => {
    el.style.animation = "toastOut .3s ease forwards";
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

function openModal(html: string, large: boolean = false) {
  document.getElementById("modal-root")!.innerHTML = `
    <div class="modal-backdrop" onclick="if(event.target===this)closeModal()">
       <div class="modal${large ? " modal-lg" : ""}">${html}</div>
     </div>`;
}

function closeModal() {
  document.getElementById("modal-root")!.innerHTML = "";
}

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
      // Force refresh from Firebase on delete
      syncFromFirebase().then(() => {
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
        <button class="btn btn-gold btn-sm btn-icon" onclick="doExportPDF('${r.id}')" title="PDF">${icon("file")}</button>
        <button class="btn btn-success btn-sm btn-icon" onclick="doExportDOCX('${r.id}')" title="DOCX">${icon("pen")}</button>
      </div>
    </td>
  </tr>`;
}

function showRapModal(rapId: string) {
  const r = Store.getRap(rapId);
  if (!r) return;
  const ext = Store.getExt(r.extensionId);
  const sym = ext?.symbole || "€";
  
  openModal(`
    <div class="modal-header"><h2>Rapport du ${fmtD(r.date)}</h2><button class="modal-close" onclick="closeModal()">${icon("x")}</button></div>
    <div class="modal-body">
      <div class="grid-2 mb-12">
        <div class="calc-box">
          <div class="form-section-title">Culte</div>
          <div class="calc-row"><span>Heure</span><span>${r.heureDebut || "—"} - ${r.heureFin || "—"}</span></div>
          <div class="calc-row"><span>Modérateur</span><span>${r.moderateur || "—"}</span></div>
          <div class="calc-row"><span>Prédicateur</span><span>${r.predicateur || "—"}</span></div>
          <div class="calc-row"><span>Thème</span><span>${r.theme || "—"}</span></div>
          <div class="calc-row"><span>Textes</span><span>${r.textes || "—"}</span></div>
        </div>
        <div class="calc-box">
          <div class="form-section-title">Effectif</div>
          <div class="calc-row"><span>Papas</span><span>${r.effectif?.papas || 0}</span></div>
          <div class="calc-row"><span>Mamans</span><span>${r.effectif?.mamans || 0}</span></div>
          <div class="calc-row"><span>Frères</span><span>${r.effectif?.freres || 0}</span></div>
          <div class="calc-row"><span>Soeurs</span><span>${r.effectif?.soeurs || 0}</span></div>
          <div class="calc-row"><span>Enfants</span><span>${r.effectif?.enfants || 0}</span></div>
          <div class="calc-row total-row"><span>Total</span><span>${r.effectif?.total || 0}</span></div>
        </div>
      </div>
      <div class="grid-2 mb-12">
        <div class="calc-box">
          <div class="form-section-title">Offrandes (${sym})</div>
          <div class="calc-row"><span>Offrandes ordinaires</span><span>${fmt(r.offrandes?.ordinaires, sym)}</span></div>
          <div class="calc-row"><span>Offrande orateur</span><span>${fmt(r.offrandes?.orateur, sym)}</span></div>
          <div class="calc-row"><span>Dîmes</span><span>${fmt(r.offrandes?.dimes, sym)}</span></div>
          <div class="calc-row"><span>Actions de grâce</span><span>${fmt(r.offrandes?.actionsGrace, sym)}</span></div>
          <div class="calc-row total-row"><span>Total</span><span>${fmt(r.offrandes?.total, sym)}</span></div>
        </div>
        <div class="calc-box">
          <div class="form-section-title">Ventilation (${sym})</div>
          <div class="calc-row"><span>10% Dîmes</span><span>${fmt(r.ventilation?.dixPctDime, sym)}</span></div>
          <div class="calc-row"><span>10% Social</span><span>${fmt(r.ventilation?.dixPctSocial, sym)}</span></div>
          <div class="calc-row"><span>Reste</span><span>${fmt(r.ventilation?.reste, sym)}</span></div>
          <div class="calc-row"><span>Dépenses</span><span>${fmt(r.totalDepenses, sym)}</span></div>
          <div class="calc-row total-row"><span>Solde final</span><span>${fmt(r.soldeFinal, sym)}</span></div>
        </div>
      </div>
      ${r.depenses?.length ? `
      <div class="form-section-title mb-8">Dépenses</div>
      <div class="table-wrap mb-12">
        <table><thead><tr><th>Motif</th><th>Montant</th></tr></thead>
        <tbody>${r.depenses!.map(d => `<tr><td>${d.motif}</td><td>${fmt(d.montant, sym)}</td></tr>`).join("")}</tbody></table>
      </div>` : ""}
      ${r.nouveaux?.length ? `
      <div class="form-section-title mb-8">Nouveaux convertis</div>
      <div class="table-wrap mb-12">
        <table><thead><tr><th>Nom</th><th>Téléphone</th></tr></thead>
        <tbody>${r.nouveaux!.map(n => `<tr><td>${n.nom}</td><td>${n.tel || "—"}</td></tr>`).join("")}</tbody></table>
      </div>` : ""}
    </div>
    <div class="modal-footer">
      <button class="btn btn-gold" onclick="closeModal();doExportPDF('${r.id}')">${icon("file")} Exporter PDF</button>
      <button class="btn btn-success" onclick="closeModal();doExportDOCX('${r.id}')">${icon("pen")} Exporter DOCX</button>
    </div>
  `);
}

function doExportPDF(rapId: string) {
  const r = Store.getRap(rapId);
  if (!r) return;
  const ext = Store.getExt(r.extensionId);
  const sym = ext?.symbole || "€";

  const { jsPDF } = (window as any).jspdf;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.text("RAPPORT DE CULTE", pageWidth / 2, 20, { align: "center" });
  doc.setFontSize(12);
  doc.text(ext?.nom || "Emerge in Christ", pageWidth / 2, 28, { align: "center" });
  doc.text(`Date: ${fmtD(r.date)}`, pageWidth / 2, 34, { align: "center" });

  let y = 50;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMATIONS DU CULTE", 15, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(`Heure: ${r.heureDebut || "—"} - ${r.heureFin || "—"}`, 15, y);
  y += 6;
  doc.text(`Modérateur: ${r.moderateur || "—"}`, 15, y);
  y += 6;
  doc.text(`Prédicateur: ${r.predicateur || "—"}`, 15, y);
  y += 6;
  doc.text(`Interprète: ${r.interprete || "—"}`, 15, y);
  y += 6;
  doc.text(`Thème: ${r.theme || "—"}`, 15, y);
  y += 6;
  doc.text(`Textes: ${r.textes || "—"}`, 15, y);

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.text("EFFECTIF", 15, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(`Papas: ${r.effectif?.papas || 0} | Mamans: ${r.effectif?.mamans || 0} | Frères: ${r.effectif?.freres || 0} | Soeurs: ${r.effectif?.soeurs || 0} | Enfants: ${r.effectif?.enfants || 0}`, 15, y);
  y += 6;
  doc.text(`Total présence: ${r.effectif?.total || 0}`, 15, y);

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.text("OFFRANDES", 15, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(`Offrandes ordinaires: ${fmt(r.offrandes?.ordinaires, sym)}`, 15, y);
  y += 6;
  doc.text(`Offrande orateur: ${fmt(r.offrandes?.orateur, sym)}`, 15, y);
  y += 6;
  doc.text(`Dîmes: ${fmt(r.offrandes?.dimes, sym)}`, 15, y);
  y += 6;
  doc.text(`Actions de grâce: ${fmt(r.offrandes?.actionsGrace, sym)}`, 15, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.text(`TOTAL: ${fmt(r.offrandes?.total, sym)}`, 15, y);

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.text("VENTILATION", 15, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(`10% des dîmes: ${fmt(r.ventilation?.dixPctDime, sym)}`, 15, y);
  y += 6;
  doc.text(`10% social: ${fmt(r.ventilation?.dixPctSocial, sym)}`, 15, y);
  y += 6;
  doc.text(`Reste: ${fmt(r.ventilation?.reste, sym)}`, 15, y);

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.text("DÉPENSES", 15, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  if (r.depenses?.length) {
    r.depenses.forEach((d) => {
      doc.text(`- ${d.motif}: ${fmt(d.montant, sym)}`, 15, y);
      y += 6;
    });
    doc.setFont("helvetica", "bold");
    doc.text(`Total dépenses: ${fmt(r.totalDepenses, sym)}`, 15, y);
    doc.setFont("helvetica", "normal");
    y += 6;
    doc.text(`Solde final: ${fmt(r.soldeFinal, sym)}`, 15, y);
  } else {
    doc.text("Aucune dépense", 15, y);
  }

  if (r.nouveaux?.length) {
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("NOUVEAUX CONVERTIS", 15, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    r.nouveaux.forEach((n) => {
      doc.text(`- ${n.nom}${n.tel ? ` (${n.tel})` : ""}`, 15, y);
      y += 6;
    });
  }

  y += 15;
  doc.setFont("helvetica", "bold");
  doc.text("SIGNATURES", 15, y);
  y += 15;
  doc.setFont("helvetica", "normal");
  doc.text(`Secrétaire: ___________________`, 15, y);
  doc.text(`Trésorier: ___________________`, 80, y);
  doc.text(`Pasteur: ___________________`, 145, y);

  doc.save(`Rapport_${ext?.nom || "EIC"}_${r.date}.pdf`);
  toast("PDF exporté avec succès", "success");
}

async function doExportDOCX(rapId: string) {
  const r = Store.getRap(rapId);
  if (!r) return;
  const ext = Store.getExt(r.extensionId);
  const sym = ext?.symbole || "€";

  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } = (window as any).docx;

  const tableRows = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Catégorie", bold: true })] })] }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Détails", bold: true })] })] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Heure")] }),
        new TableCell({ children: [new Paragraph(`${r.heureDebut || "—"} - ${r.heureFin || "—"}`)] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Modérateur")] }),
        new TableCell({ children: [new Paragraph(r.moderateur || "—")] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Prédicateur")] }),
        new TableCell({ children: [new Paragraph(r.predicateur || "—")] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Thème")] }),
        new TableCell({ children: [new Paragraph(r.theme || "—")] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Total présence")] }),
        new TableCell({ children: [new Paragraph(String(r.effectif?.total || 0))] }),
      ],
    }),
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph("Total offrandes")] }),
        new TableCell({ children: [new Paragraph(fmt(r.offrandes?.total, sym))] }),
      ],
    }),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({ children: [new TextRun({ text: "RAPPORT DE CULTE", bold: true, size: 48 })], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun(ext?.nom || "Emerge in Christ")] }),
          new Paragraph({ children: [new TextRun(`Date: ${fmtD(r.date)}`)], alignment: AlignmentType.CENTER }),
          new Paragraph({ children: [new TextRun({ text: "" })] }),
          new Table({ rows: tableRows }),
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

function registerAdminRoutes() {
  regRoute("/admin/dashboard", pgAdminDash);
  regRoute("/admin/extensions", pgAdminExts);
  regRoute("/admin/rapports", pgAdminRaps);
  regRoute("/admin/bilans", pgAdminBilans);
  regRoute("/admin/convertis", pgAdminConvertis);
  regRoute("/admin/settings", pgAdminSettings);
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
  setActive("/admin/dashboard");
  const cfg = Store.getSet();
  const exts = Store.getExts();
  const st = Store.stats();
  const mo = Store.monthly(null, new Date().getFullYear());
  setTopbar("Tableau de Bord Global", "Vue d'ensemble du réseau", "Admin");

  const maxC = Math.max(1, ...exts.map((e) => Store.stats(e.id).cultes));

  render(`
    <div class="page-header">
      <div><h1>Vue Générale</h1><p>${cfg.nom || "Emerge in Christ"} · ${exts.length} extension(s)</p></div>
      <button class="btn btn-secondary btn-sm" onclick="navTo('/admin/extensions')">${icon("settings")} Gérer</button>
    </div>
    <div class="grid-4 mb-20">
      ${statCard("building", "Extensions", String(exts.length), "Sites actifs")}
      ${statCard("fileText", "Cultes", String(st.cultes), "Total réseau")}
      ${statCard("users", "Présence moy.", String(st.presence), "Par culte")}
      ${statCard("userCheck", "Convertis", String(st.nouveaux), "Total réseau")}
    </div>
    <div class="grid-2 mb-20">
      <div class="card"><div class="form-section-title mb-12">Présence mensuelle ${new Date().getFullYear()}</div><div class="chart-wrap"><canvas id="chP"></canvas></div></div>
      <div class="card"><div class="form-section-title mb-12">Offrandes mensuelles ${new Date().getFullYear()}</div><div class="chart-wrap"><canvas id="chO"></canvas></div></div>
    </div>
    <div class="form-section-title mb-12">Performance par Extension</div>
    <div class="grid-3">
      ${exts
        .map((ext) => {
          const s = Store.stats(ext.id);
          return `<div class="ext-card" style="--ext-color:${ext.couleur}">
            <div class="ext-card-name">${ext.nom}</div>
            <div class="ext-card-ville">${icon("mapPin")} ${ext.ville}, ${ext.pays}</div>
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
  chartBar("chP", lb, mo.map((m) => m.presence), "Présence", "rgba(139,92,246,.7)");
  chartBar("chO", lb, mo.map((m) => m.offrandes), "Offrandes", "rgba(245,158,11,.7)");
}

function pgAdminExts() {
  setActive("/admin/extensions");
  setTopbar("Extensions", "Gestion du réseau", "Admin");
  const exts = Store.getExts();
  render(`
    <div class="page-header">
      <div><h1>Extensions</h1><p>${exts.length} extension(s)</p></div>
      <button class="btn btn-primary" onclick="openExtForm(null)">${icon("plus")} Nouvelle Extension</button>
    </div>
    <div class="grid-auto">${exts.map(extCard).join("")}</div>
  `);
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
  setActive("/admin/settings");
  setTopbar("Paramètres", "Configuration", "Admin");
  const cfg = Store.getSet();

  render(`
    <div class="page-header">
      <div><h1>Paramètres</h1><p>Configuration globale</p></div>
    </div>
    <div class="grid-2 mb-20">
      <div class="card">
        <div class="form-section-title mb-12">Identité du réseau</div>
        <div class="form-row">
          <label>Nom de l'organisation</label>
          <input id="set-nom" value="${cfg.nom || ""}" />
        </div>
        <div class="form-row">
          <label>Mot de passe administrateur</label>
          <input id="set-admin-pw" type="password" value="${cfg.adminPw || ""}" />
        </div>
        <button class="btn btn-primary mt-12" onclick="saveSettings()">${icon("save")} Enregistrer</button>
      </div>
      <div class="card">
        <div class="form-section-title mb-12">Logo</div>
        <div class="form-row">
          <label>Charger un logo (PNG/JPG)</label>
          <input type="file" id="set-logo" accept="image/*" onchange="handleLogoUpload(this)" />
        </div>
        ${Store.getLogo() ? `<button class="btn btn-danger btn-sm mt-8" onclick="clearLogo()">${icon("trash")} Supprimer le logo</button>` : ""}
      </div>
    </div>
    <div class="card">
      <div class="form-section-title mb-12">Données</div>
      <div class="flex gap-12">
        <button class="btn btn-secondary" onclick="exportData()">${icon("save")} Exporter les données</button>
        <button class="btn btn-secondary" onclick="document.getElementById('import-file').click()">${icon("upload")} Importer les données</button>
        <input type="file" id="import-file" accept=".json" class="hidden" onchange="importData(this)" />
        <button class="btn btn-danger" onclick="resetData()">⚠ Réinitialiser tout</button>
      </div>
    </div>
  `);
}

function saveSettings() {
  const nom = (document.getElementById("set-nom") as HTMLInputElement).value.trim();
  const adminPw = (document.getElementById("set-admin-pw") as HTMLInputElement).value.trim();
  Store.saveSet({ nom, adminPw });
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
      <div class="card"><div class="form-section-title mb-12">Offrandes mensuelles ${new Date().getFullYear()}</div><div class="chart-wrap"><canvas id="></div></divchO"></canvas>
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

  const params = curParams();
  const rapId = params.rap;
  if (rapId && rapFormData) {
  } else {
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
      ventilation: { dixPctDime: 0, dixPctSocial: 0, reste: 0 },
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
    case 2:
      const tot = (r.offrandes?.ordinaires || 0) + (r.offrandes?.orateur || 0) + (r.offrandes?.dimes || 0) + (r.offrandes?.actionsGrace || 0);
      return `
        <div class="form-section-title">Offrandes (${sym})</div>
        <div class="form-row cols-2">
          <div><label>Offrandes ordinaires</label><input type="number" id="rf-ord" value="${r.offrandes?.ordinaires || 0}" min="0" onchange="updateOffTotals()" /></div>
          <div><label>Offrande orateur</label><input type="number" id="rf-ora" value="${r.offrandes?.orateur || 0}" min="0" onchange="updateOffTotals()" /></div>
        </div>
        <div class="form-row cols-2">
          <div><label>Dîmes</label><input type="number" id="rf-dim" value="${r.offrandes?.dimes || 0}" min="0" onchange="updateOffTotals()" /></div>
          <div><label>Actions de grâce</label><input type="number" id="rf-ag" value="${r.offrandes?.actionsGrace || 0}" min="0" onchange="updateOffTotals()" /></div>
        </div>
        <div class="total-box mt-12">
          <span class="total-box-label">Total offrandes</span>
          <span class="total-box-value" id="rf-off-total">${fmt(tot, sym)}</span>
        </div>
        <div class="form-section-title mt-20">Ventilation</div>
        <div class="calc-box">
          <div class="calc-row"><span>10% des dîmes</span><span id="rf-vent-dim">${fmt(r.ventilation?.dixPctDime || 0, sym)}</span></div>
          <div class="calc-row"><span>10% social (totale)</span><span id="rf-vent-soc">${fmt(r.ventilation?.dixPctSocial || 0, sym)}</span></div>
          <div class="calc-row"><span>Reste</span><span id="rf-vent-reste">${fmt(r.ventilation?.reste || 0, sym)}</span></div>
        </div>
        <div class="flex justify-between mt-16">
          <button class="btn btn-secondary" onclick="goToStep(1)">← Précédent</button>
          <button class="btn btn-primary" onclick="saveStep2()">Suivant →</button>
        </div>`;
    case 3:
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
    case 4:
      return `
        <div class="form-section-title">Nouveaux convertis</div>
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
  document.getElementById("rf-vent-dim")!.textContent = fmt(dim * 0.1, sym);
  document.getElementById("rf-vent-soc")!.textContent = fmt(tot * 0.1, sym);
  document.getElementById("rf-vent-reste")!.textContent = fmt(tot * 0.8, sym);
}

function saveStep2() {
  if (!rapFormData) return;
  const ord = parseInt((document.getElementById("rf-ord") as HTMLInputElement).value) || 0;
  const ora = parseInt((document.getElementById("rf-ora") as HTMLInputElement).value) || 0;
  const dim = parseInt((document.getElementById("rf-dim") as HTMLInputElement).value) || 0;
  const ag = parseInt((document.getElementById("rf-ag") as HTMLInputElement).value) || 0;
  const total = ord + ora + dim + ag;

  rapFormData.offrandes = { ordinaires: ord, orateur: ora, dimes: dim, actionsGrace: ag, total };
  rapFormData.ventilation = {
    dixPctDime: +(dim * 0.1).toFixed(2),
    dixPctSocial: +(total * 0.1).toFixed(2),
    reste: +(total * 0.8).toFixed(2),
  };
  rapStep = 3;
  const ses = Auth.ses();
  if (ses?.role === "extension") pgExtNew(ses.extId);
}

function updateDepTotal(_idx: number) {
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
  rapFormData.soldeFinal = (rapFormData.offrandes?.total || 0) - rapFormData.totalDepenses;
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
  Store.saveRap(rapFormData);
  toast("Rapport enregistré avec succès", "success");
  rapFormData = null;
  rapStep = 0;
  navTo("/ext/rapports");
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
  const st = Store.stats(extId);
  const yr = new Date().getFullYear();
  const mo = Store.monthly(extId, yr);

  setTopbar("Bilans", ext?.nom || "", "");

  render(`
    <div class="page-header">
      <div><h1>Bilans</h1><p>${yr}</p></div>
    </div>
    <div class="grid-3 mb-20">
      <div class="card" style="border-left:3px solid ${ext?.couleur}">
        <div class="calc-box">
          <div class="calc-row"><span>Cultes</span><span>${st.cultes}</span></div>
          <div class="calc-row"><span>Présence moy.</span><span>${st.presence}</span></div>
          <div class="calc-row"><span>Offrandes</span><span>${fmt(st.offrandes, ext?.symbole || "€")}</span></div>
          <div class="calc-row total-row"><span>Convertis</span><span>${st.nouveaux}</span></div>
        </div>
      </div>
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
}

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
      <button class="btn btn-danger" onclick="closeModal();Store.delExt('${id}');toast('Extension supprimée','success');pgAdminExts()">Confirmer</button>
    </div>`
  );
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
  Store.saveExt(ext);
  closeModal();
  toast(`Extension "${nom}" enregistrée`, "success");
  pgAdminExts();
};

window.adminRapFilter = function (sel: HTMLSelectElement, field: string) {
  const p = curParams();
  if (sel.value !== "") p[field] = sel.value;
  else delete p[field];
  navTo("/admin/rapports", p);
};

window.showRapModal = showRapModal;
window.doExportPDF = doExportPDF;
window.doExportDOCX = doExportDOCX;

export async function initApp() {
  // Firebase => localStorage (source de vérité distante)
  await syncFromFirebase((msg) => toast(msg, "error"));
  // Optionnel: seed de données de démo en local uniquement si DEMO_MODE=true
  seedIfNeeded();

  window.switchTab = function (tab: string) {
    document.querySelectorAll(".login-tab").forEach((t, i) => {
      t.classList.toggle("active", i === (tab === "extension" ? 0 : 1));
    });
    document.getElementById("panel-extension")!.classList.toggle("active", tab === "extension");
    document.getElementById("panel-admin")!.classList.toggle("active", tab === "admin");
  };

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

  const ses = Auth.ses();
  if (ses) {
    startApp();
    return;
  }

  populateExtSel();
  updateLogoUI();
}
