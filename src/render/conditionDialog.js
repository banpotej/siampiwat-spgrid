// @ts-check
import { isActionColumn } from '../core/columns.js';
import { escapeHtml } from '../utils/escape.js';
import { describeCondition } from './conditionText.js';
import { createRow, readRow, refreshRow, removeButtonHtml } from './conditionRows.js';

let seq = 0;

const FOCUSABLE = 'input:not(:disabled), select:not(:disabled), button:not(:disabled)';

/** @typedef {import('../types.js').Column} Column */
/** @typedef {import('../types.js').Condition} Condition */
/** @typedef {import('../types.js').ConditionGroup} ConditionGroup */

/**
 * @typedef {import('./conditionRows.js').RowLabels & { advancedFilter: string, advMatch: string, advMatchAll: string,
 *   advMatchAny: string, advAdd: string, clearAll: string, apply: string, cancel: string, close: string,
 *   conditionAnd: string, conditionOr: string }} ConditionDialogLabels
 */

/**
 * Open the "advanced filter" modal: an all / any select and one row per condition (field, operator, value), with buttons to
 * add a row and to clear them. Nothing changes until Apply; Esc, a click on the backdrop and Cancel discard it. A nested group
 * (only possible through `setAdvancedFilter`) cannot be edited here: it shows as a line that can be removed, and stays otherwise.
 *
 * @param {HTMLElement} root Element that carries the theme tokens (`.spg-root`); the dialog is added inside it.
 * @param {Column[]} allColumns
 * @param {Condition | ConditionGroup | null} current
 * @param {ConditionDialogLabels} labels
 * @param {(tree: ConditionGroup | null | undefined) => void} onClose Called once: with the new filter on Apply (null when no
 *   condition is left) and with undefined when the dialog was dismissed.
 * @returns {() => void} Dismiss the dialog (as Cancel).
 */
export function openConditionDialog(root, allColumns, current, labels, onClose) {
  const id = `spg-adv-${++seq}`;
  const columns = allColumns.filter((c) => !isActionColumn(c));
  const group = !current
    ? { logic: /** @type {'and'} */ ('and'), conditions: [] }
    : 'conditions' in current
      ? current
      : { logic: /** @type {'and'} */ ('and'), conditions: [current] };
  const nested = group.conditions.filter((n) => 'conditions' in n);
  const overlay = document.createElement('div');
  overlay.className = 'spg-modal';
  /** @param {string} value @param {string} text */
  const logicOption = (value, text) =>
    `<option value="${value}"${group.logic === value ? ' selected' : ''}>${escapeHtml(text)}</option>`;
  overlay.innerHTML =
    `<div class="spg-modal-box spg-settings spg-adv-dialog" role="dialog" aria-modal="true" aria-labelledby="${id}">` +
    `<h2 class="spg-modal-title" id="${id}">${escapeHtml(labels.advancedFilter)}</h2>` +
    `<div class="spg-settings-body"><section>` +
    `<label class="spg-settings-field spg-adv-match"><span>${escapeHtml(labels.advMatch)}</span>` +
    `<select class="spg-adv-logic">${logicOption('and', labels.advMatchAll)}${logicOption('or', labels.advMatchAny)}</select></label>` +
    `</section><section><div class="spg-adv-rows"></div>` +
    `<div class="spg-settings-bulk"><button type="button" class="spg-settings-link spg-adv-add">+ ${escapeHtml(labels.advAdd)}</button>` +
    `<button type="button" class="spg-settings-link spg-adv-clear">${escapeHtml(labels.clearAll)}</button></div></section></div>` +
    `<div class="spg-modal-actions">` +
    `<button type="button" class="spg-modal-btn spg-modal-cancel">${escapeHtml(labels.cancel)}</button>` +
    `<button type="button" class="spg-modal-btn spg-modal-ok">${escapeHtml(labels.apply)}</button></div>` +
    `<button type="button" class="spg-modal-x" aria-label="${escapeHtml(labels.close)}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>` +
    `</div>`;
  const rows = /** @type {HTMLElement} */ (overlay.querySelector('.spg-adv-rows'));
  const logic = /** @type {HTMLSelectElement} */ (overlay.querySelector('.spg-adv-logic'));
  /** @type {(Condition | ConditionGroup)[]} Nested groups still in the filter, shown as lines. */
  const kept = [...nested];
  /** @param {Condition | null} [condition] */
  const addRow = (condition = null) => rows.append(createRow(columns, labels, condition));
  for (const node of group.conditions) if (!('conditions' in node)) addRow(node);
  kept.forEach((node, i) => {
    const line = document.createElement('div');
    line.className = 'spg-adv-row spg-adv-kept';
    line.dataset.kept = String(i);
    line.innerHTML =
      `<span class="spg-adv-kept-text">${escapeHtml(describeCondition(node, columns, labels))}</span>` +
      removeButtonHtml(labels);
    rows.append(line);
  });
  if (rows.children.length === 0) addRow();

  const opener = /** @type {HTMLElement | null} */ (document.activeElement);
  /** @param {boolean} apply */
  const close = (apply) => {
    if (!overlay.isConnected) return;
    const conditions = [
      ...[...rows.querySelectorAll('.spg-adv-row:not(.spg-adv-kept)')].map((row) =>
        readRow(/** @type {HTMLElement} */ (row)),
      ),
      ...[...rows.querySelectorAll('.spg-adv-kept')].map((line) => {
        return kept[Number(/** @type {HTMLElement} */ (line).dataset.kept)];
      }),
    ];
    overlay.remove();
    opener?.focus?.();
    onClose(
      apply
        ? conditions.length === 0
          ? null
          : { logic: logic.value === 'or' ? 'or' : 'and', conditions }
        : undefined,
    );
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
  overlay.addEventListener('change', (event) => {
    const row = event.target instanceof Element ? event.target.closest('.spg-adv-row') : null;
    if (row instanceof HTMLElement) refreshRow(row, event.target, columns, labels);
  });
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) return close(false);
    const remove = event.target instanceof Element ? event.target.closest('.spg-adv-remove') : null;
    remove?.closest('.spg-adv-row')?.remove();
  });
  overlay.querySelector('.spg-adv-add')?.addEventListener('click', () => addRow());
  overlay.querySelector('.spg-adv-clear')?.addEventListener('click', () => {
    rows.innerHTML = '';
    addRow();
  });
  overlay.querySelector('.spg-modal-cancel')?.addEventListener('click', () => close(false));
  overlay.querySelector('.spg-modal-x')?.addEventListener('click', () => close(false));
  overlay.querySelector('.spg-modal-ok')?.addEventListener('click', () => close(true));
  root.append(overlay);
  /** @type {HTMLElement | undefined} */ (overlay.querySelector(FOCUSABLE) ?? undefined)?.focus();
  return () => close(false);
}
