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
 *   conditionAnd: string, conditionOr: string, filterSummary: (shown: number, total: number) => string }} ConditionDialogLabels
 */

/**
 * Open the "advanced filter" modal: an all / any switch, one card per condition (field, operator, value) joined by "and" /
 * "or", a button to add one, and a live count of the rows the draft would leave. Nothing changes until Apply; Esc, a click on
 * the backdrop and Cancel discard it. Enter in a value box applies. A nested group (only possible through
 * `setAdvancedFilter`) cannot be edited here: it shows as a line that can be removed, and stays otherwise.
 *
 * @param {HTMLElement} root Element that carries the theme tokens (`.spg-root`); the dialog is added inside it.
 * @param {Column[]} allColumns
 * @param {Condition | ConditionGroup | null} current
 * @param {ConditionDialogLabels} labels
 * @param {(tree: ConditionGroup | null) => { shown: number, total: number } | null} preview Rows the draft would leave (null:
 *   no count to show).
 * @param {(tree: ConditionGroup | null | undefined) => void} onClose Called once: with the new filter on Apply (null when no
 *   condition is left) and with undefined when the dialog was dismissed.
 * @returns {() => void} Dismiss the dialog (as Cancel).
 */
export function openConditionDialog(root, allColumns, current, labels, preview, onClose) {
  const id = `spg-adv-${++seq}`;
  const columns = allColumns.filter((c) => !isActionColumn(c));
  const group = !current
    ? { logic: /** @type {'and'} */ ('and'), conditions: [] }
    : 'conditions' in current
      ? current
      : { logic: /** @type {'and'} */ ('and'), conditions: [current] };
  const overlay = document.createElement('div');
  overlay.className = 'spg-modal';
  /** @param {'and' | 'or'} value @param {string} text */
  const logicOption = (value, text) =>
    `<label><input type="radio" class="spg-adv-logic" name="${id}-logic" value="${value}"${group.logic === value ? ' checked' : ''}><span>${escapeHtml(text)}</span></label>`;
  overlay.innerHTML =
    `<div class="spg-modal-box spg-settings spg-adv-dialog" role="dialog" aria-modal="true" aria-labelledby="${id}">` +
    `<h2 class="spg-modal-title" id="${id}">${escapeHtml(labels.advancedFilter)}</h2>` +
    `<div class="spg-settings-body"><section class="spg-adv-top">` +
    `<span class="spg-adv-match" id="${id}-match">${escapeHtml(labels.advMatch)}</span>` +
    `<div class="spg-adv-segment" role="radiogroup" aria-labelledby="${id}-match">${logicOption('and', labels.advMatchAll)}${logicOption('or', labels.advMatchAny)}</div>` +
    `</section><section>` +
    `<div class="spg-adv-head" aria-hidden="true"><span>${escapeHtml(labels.advField)}</span><span>${escapeHtml(labels.advOperator)}</span><span>${escapeHtml(labels.advValue)}</span><span></span></div>` +
    `<div class="spg-adv-rows"></div>` +
    `<button type="button" class="spg-adv-add"><span aria-hidden="true">+</span> ${escapeHtml(labels.advAdd)}</button>` +
    `<p class="spg-adv-result" aria-live="polite"></p></section></div>` +
    `<div class="spg-modal-actions">` +
    `<button type="button" class="spg-modal-btn spg-adv-clear">${escapeHtml(labels.clearAll)}</button>` +
    `<button type="button" class="spg-modal-btn spg-modal-cancel">${escapeHtml(labels.cancel)}</button>` +
    `<button type="button" class="spg-modal-btn spg-modal-ok">${escapeHtml(labels.apply)}</button></div>` +
    `<button type="button" class="spg-modal-x" aria-label="${escapeHtml(labels.close)}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>` +
    `</div>`;
  const rows = /** @type {HTMLElement} */ (overlay.querySelector('.spg-adv-rows'));
  const result = /** @type {HTMLElement} */ (overlay.querySelector('.spg-adv-result'));
  /** @type {(Condition | ConditionGroup)[]} Nested groups still in the filter, shown as lines. */
  const kept = group.conditions.filter((n) => 'conditions' in n);
  const logic = () =>
    /** @type {HTMLInputElement | null} */ (overlay.querySelector('.spg-adv-logic:checked'))
      ?.value === 'or'
      ? 'or'
      : 'and';

  /** The draft: every row as it reads now, nested groups as they were. @returns {ConditionGroup | null} */
  const draft = () => {
    const conditions = [...rows.children].map((el) =>
      el instanceof HTMLElement && el.classList.contains('spg-adv-kept')
        ? kept[Number(el.dataset.kept)]
        : readRow(/** @type {HTMLElement} */ (el)),
    );
    return conditions.length === 0 ? null : { logic: logic(), conditions };
  };
  /** Put "and" / "or" on every card but the first, and refresh the count of rows the draft leaves. */
  const sync = () => {
    const word = logic() === 'or' ? labels.conditionOr : labels.conditionAnd;
    [...rows.children].forEach((el, i) => {
      if (!(el instanceof HTMLElement)) return;
      if (i === 0) delete el.dataset.join;
      else el.dataset.join = word;
    });
    let found = null;
    try {
      found = preview(draft());
    } catch {
      // A half-edited draft the filter cannot read: no count.
    }
    result.textContent = found ? labels.filterSummary(found.shown, found.total) : '';
    result.toggleAttribute('data-empty', found?.shown === 0);
  };
  /** @param {Condition | null} [condition] */
  const addRow = (condition = null) => {
    const row = createRow(columns, labels, condition);
    rows.append(row);
    return row;
  };
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
  sync();

  const opener = /** @type {HTMLElement | null} */ (document.activeElement);
  /** @param {boolean} apply */
  const close = (apply) => {
    if (!overlay.isConnected) return;
    const tree = draft();
    overlay.remove();
    opener?.focus?.();
    onClose(apply ? tree : undefined);
  };
  /** @param {KeyboardEvent} event */
  const onKey = (event) => {
    const target = event.target;
    if (event.key === 'Escape') {
      event.preventDefault();
      close(false);
    } else if (
      event.key === 'Enter' &&
      target instanceof HTMLInputElement &&
      !['checkbox', 'radio'].includes(target.type)
    ) {
      event.preventDefault();
      close(true);
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
    sync();
  });
  overlay.addEventListener('input', sync);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) return close(false);
    const remove = event.target instanceof Element ? event.target.closest('.spg-adv-remove') : null;
    if (!remove) return;
    remove.closest('.spg-adv-row')?.remove();
    sync();
  });
  overlay.querySelector('.spg-adv-add')?.addEventListener('click', () => {
    const row = addRow();
    sync();
    row.querySelector('select')?.focus();
    row.scrollIntoView?.({ block: 'nearest' });
  });
  overlay.querySelector('.spg-adv-clear')?.addEventListener('click', () => {
    rows.innerHTML = '';
    addRow();
    sync();
  });
  overlay.querySelector('.spg-modal-cancel')?.addEventListener('click', () => close(false));
  overlay.querySelector('.spg-modal-x')?.addEventListener('click', () => close(false));
  overlay.querySelector('.spg-modal-ok')?.addEventListener('click', () => close(true));
  root.append(overlay);
  /** @type {HTMLElement | undefined} */ (
    overlay.querySelector('.spg-adv-field') ?? undefined
  )?.focus();
  return () => close(false);
}
