// @ts-check
import { escapeHtml } from '../utils/escape.js';

let seq = 0;

const FOCUSABLE = 'input:not(:disabled), button:not(:disabled)';

/**
 * @typedef {object} ExportDialogLabels
 * @property {string} title
 * @property {string} ok Text of the confirm button (the Export button's text).
 * @property {string} cancel
 * @property {string} close aria-label of the round close button on the card's corner (same as Cancel).
 * @property {string} selectAll
 * @property {string} clearAll
 * @property {string} search Label of the search box.
 * @property {(count: number) => string} rowCount Text of the line under the search box.
 */

/**
 * @typedef {object} ExportSearch The rows part of the dialog.
 * @property {string} value Text the box starts with (the grid's search text).
 * @property {(search: string | undefined) => number} count Rows an export would write; `undefined`: with the grid's own filter.
 */

/**
 * @typedef {object} ExportChoice
 * @property {string[]} columns Ticked column keys.
 * @property {string} [search] The box's text, only when the user changed it from `ExportSearch.value`.
 */

/**
 * Open the "fields to export" modal: a search box that narrows the rows (with the number of rows left), and one
 * checkbox per data column, all ticked. Export is disabled while nothing is ticked. Esc, a click on the backdrop and
 * Cancel dismiss it.
 *
 * @param {HTMLElement} root Element that carries the theme tokens (`.spg-root`); the dialog is added inside it.
 * @param {{ key: string, label: string }[]} columns
 * @param {ExportDialogLabels} labels
 * @param {ExportSearch} rowSearch
 * @param {(choice: ExportChoice | null) => void} onClose Called once, with the choice on Export and null otherwise.
 * @returns {() => void} Dismiss the dialog (as Cancel).
 */
export function openExportDialog(root, columns, labels, rowSearch, onClose) {
  const id = `spg-export-${++seq}`;
  const rows = columns
    .map(
      ({ key, label }) =>
        `<label class="spg-columns-item"><input type="checkbox" data-key="${escapeHtml(key)}" checked><span>${escapeHtml(label.replace(/\s*\n\s*/g, ' / '))}</span></label>`,
    )
    .join('');
  const overlay = document.createElement('div');
  overlay.className = 'spg-modal';
  overlay.innerHTML =
    `<div class="spg-modal-box spg-settings" role="dialog" aria-modal="true" aria-labelledby="${id}">` +
    `<h2 class="spg-modal-title" id="${id}">${escapeHtml(labels.title)}</h2>` +
    `<div class="spg-settings-body"><section>` +
    `<label class="spg-settings-field"><span>${escapeHtml(labels.search)}</span><input type="search" class="spg-export-search" autocomplete="off"></label>` +
    `<p class="spg-export-count" aria-live="polite"></p></section><section>` +
    `<div class="spg-settings-list">${rows}</div>` +
    `<div class="spg-settings-bulk"><button type="button" class="spg-settings-link" data-bulk="all">${escapeHtml(labels.selectAll)}</button>` +
    `<button type="button" class="spg-settings-link" data-bulk="none">${escapeHtml(labels.clearAll)}</button></div></section></div>` +
    `<div class="spg-modal-actions">` +
    `<button type="button" class="spg-modal-btn spg-modal-cancel">${escapeHtml(labels.cancel)}</button>` +
    `<button type="button" class="spg-modal-btn spg-modal-ok">${escapeHtml(labels.ok)}</button>` +
    `</div>` +
    `<button type="button" class="spg-modal-x" aria-label="${escapeHtml(labels.close)}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>` +
    `</div>`;
  const boxes = [...overlay.querySelectorAll('.spg-columns-item input')].map(
    (el) => /** @type {HTMLInputElement} */ (el),
  );
  const okBtn = /** @type {HTMLButtonElement} */ (overlay.querySelector('.spg-modal-ok'));
  const syncOk = () => (okBtn.disabled = !boxes.some((box) => box.checked));
  const input = /** @type {HTMLInputElement} */ (overlay.querySelector('.spg-export-search'));
  const countLine = /** @type {HTMLElement} */ (overlay.querySelector('.spg-export-count'));
  input.value = rowSearch.value;
  const changed = () => (input.value === rowSearch.value ? undefined : input.value);
  const syncCount = () => (countLine.textContent = labels.rowCount(rowSearch.count(changed())));
  syncCount();

  const opener = /** @type {HTMLElement | null} */ (document.activeElement);
  /** @param {boolean} exportNow */
  const close = (exportNow) => {
    if (!overlay.isConnected) return;
    const keys = boxes.filter((box) => box.checked).map((box) => box.dataset.key ?? '');
    overlay.remove();
    opener?.focus?.();
    const search = changed();
    onClose(exportNow ? { columns: keys, ...(search !== undefined && { search }) } : null);
  };
  /** @param {KeyboardEvent} event */
  const onKey = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close(false);
    } else if (event.key === 'Tab') {
      const items = [...overlay.querySelectorAll(FOCUSABLE)];
      const first = /** @type {HTMLElement} */ (items[0]);
      const last = /** @type {HTMLElement} */ (items[items.length - 1]);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };
  overlay.addEventListener('keydown', onKey);
  overlay.addEventListener('change', syncOk);
  input.addEventListener('input', syncCount);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !okBtn.disabled) {
      event.preventDefault();
      close(true);
    }
  });
  for (const button of overlay.querySelectorAll('[data-bulk]')) {
    button.addEventListener('click', () => {
      const all = /** @type {HTMLElement} */ (button).dataset.bulk === 'all';
      for (const box of boxes) box.checked = all;
      syncOk();
    });
  }
  overlay.addEventListener('click', (event) => event.target === overlay && close(false));
  overlay.querySelector('.spg-modal-cancel')?.addEventListener('click', () => close(false));
  overlay.querySelector('.spg-modal-x')?.addEventListener('click', () => close(false));
  okBtn.addEventListener('click', () => close(true));
  root.append(overlay);
  /** @type {HTMLElement | undefined} */ (overlay.querySelector(FOCUSABLE) ?? undefined)?.focus();
  return () => close(false);
}
