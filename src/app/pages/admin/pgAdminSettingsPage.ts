type Deps = {
  setActive: (path: string) => void;
  setTopbar: (title: string, sub?: string, badge?: string) => void;
  render: (html: string) => void;
  icon: (name: string) => string;
  getCfg: () => { nom?: string; adminPw?: string; socialPct?: number };
  getLogo: () => string | null;
};

export function pgAdminSettingsPage(deps: Deps) {
  deps.setActive("/admin/settings");
  deps.setTopbar("Paramètres", "Configuration", "Admin");
  const cfg = deps.getCfg();
  const socialPct = cfg.socialPct ?? 10;
  deps.render(`
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
        <button class="btn btn-primary mt-12" onclick="saveSettings()">${deps.icon("save")} Enregistrer</button>
      </div>
      <div class="card">
        <div class="form-section-title mb-12">Logo</div>
        <div class="form-row">
          <label>Charger un logo (PNG/JPG)</label>
          <input type="file" id="set-logo" accept="image/*" onchange="handleLogoUpload(this)" />
        </div>
        ${deps.getLogo() ? `<button class="btn btn-danger btn-sm mt-8" onclick="clearLogo()">${deps.icon("trash")} Supprimer le logo</button>` : ""}
      </div>
    </div>
    <div class="card mb-20">
      <div class="form-section-title mb-12">Paramètres financiers</div>
      <div class="form-row">
        <label>Pourcentage du prélèvement social (%)</label>
        <input id="set-social-pct" type="number" min="0" max="100" value="${socialPct}" />
        <small style="color: var(--text2)">Ce pourcentage sera appliqué aux offrandes pour le prélèvement social. Laissez vide pour 10% par défaut.</small>
      </div>
      <button class="btn btn-primary mt-12" onclick="saveSettings()">${deps.icon("save")} Enregistrer</button>
    </div>
    <div class="card">
      <div class="form-section-title mb-12">Données</div>
      <div class="flex gap-12">
        <button class="btn btn-secondary" onclick="exportData()">${deps.icon("save")} Exporter les données</button>
        <button class="btn btn-secondary" onclick="document.getElementById('import-file').click()">${deps.icon("upload")} Importer les données</button>
        <input type="file" id="import-file" accept=".json" class="hidden" onchange="importData(this)" />
        <button class="btn btn-danger" onclick="resetData()">⚠ Réinitialiser tout</button>
      </div>
    </div>
  `);
}

