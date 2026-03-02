/**
 * Minimal modal (presentation layer).
 *
 * Uses the existing DOM root #modal-root.
 */
export function openModal(html: string, large: boolean = false) {
  const root = document.getElementById("modal-root");
  if (!root) return;

  // Note: closeModal() is expected to exist globally for the inline handler.
  root.innerHTML = `
    <div class="modal-backdrop" onclick="if(event.target===this)closeModal()">
       <div class="modal${large ? " modal-lg" : ""}">${html}</div>
     </div>`;
}

export function closeModal() {
  const root = document.getElementById("modal-root");
  if (!root) return;
  root.innerHTML = "";
}

