import type { Extension } from "../../constants";

type Deps = {
  setActive: (path: string) => void;
  setTopbar: (title: string, sub?: string, badge?: string) => void;
  render: (html: string) => void;
  icon: (name: string) => string;
  getExts: () => Extension[];
  extCard: (ext: Extension) => string;
};

/**
 * Admin > Extensions page (extracted from the former god-file).
 *
 * Keeping it dependency-injected allows progressive refactor without breaking UX.
 */
export function pgAdminExtsPage(deps: Deps) {
  deps.setActive("/admin/extensions");
  deps.setTopbar("Extensions", "Gestion du réseau", "Admin");
  const exts = deps.getExts();

  deps.render(`
    <div class="page-header">
      <div><h1>Extensions</h1><p>${exts.length} extension(s)</p></div>
      <button class="btn btn-primary" onclick="openExtForm(null)">${deps.icon("plus")} Nouvelle Extension</button>
    </div>
    <div class="grid-auto">${exts.map(deps.extCard).join("")}</div>
  `);
}

