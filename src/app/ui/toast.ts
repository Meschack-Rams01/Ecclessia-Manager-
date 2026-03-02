export type ToastType = "success" | "error";

/**
 * Minimal UI toast (presentation layer).
 *
 * Intentionally DOM-based for the current vanilla UI.
 */
export function toast(msg: string, type: ToastType = "success") {
  const w = document.getElementById("toast-wrap");
  if (!w) return;
  const el = document.createElement("div");
  el.className = `toast t-${type}`;
  el.innerHTML = `<span>${type === "success" ? "✓" : "✕"}</span><span>${msg}</span>`;
  w.appendChild(el);
  setTimeout(() => {
    el.style.animation = "toastOut .3s ease forwards";
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

