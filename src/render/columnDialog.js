// @ts-check
import { escapeHtml } from '../utils/escape.js';
import {
  fillGroupSelects,
  groupSelects,
  readGroupSelects,
  renderGroupSection,
  syncGroupSelects,
} from './groupSettings.js';
import { GRID_LINES, LINE_STYLES } from './viewToggles.js';

let seq = 0;

const FOCUSABLE = 'input:not(:disabled), select:not(:disabled), button:not(:disabled)';

/** @typedef {import('../types.js').SortState} SortState */
/** @typedef {import('./viewToggles.js').ViewFlags} ViewFlags */

/**
 * @typedef {object} ColumnSettings What the dialog edits.
 * @property {string[]} [hidden] Keys of the hidden columns; left out when the dialog lists no columns.
 * @property {SortState} [sort] The sort; left out when the grid has no sortable column.
 * @property {ViewFlags} [view] The look switches; a switch is shown only when its flag is given.
 * @property {string[]} [groupBy] The group columns, outermost first; the grouping section is shown only when this is given.
 * @property {number} [freezeMax] The most columns the frozen columns select offers (one less than the columns); needs `view.freezeColumns`.
 */

/**
 * @typedef {object} DialogLabels
 * @property {string} title
 * @property {string} apply
 * @property {string} cancel
 * @property {string} close aria-label of the round close button on the card's corner (same as Cancel).
 * @property {string} sortBy
 * @property {string} noSort
 * @property {string} sortDirection
 * @property {string} ascending
 * @property {string} descending
 * @property {string} columns Heading of the column list.
 * @property {string} selectAll Text of the button that checks every column.
 * @property {string} clearAll Text of the button that unchecks every column but the first.
 * @property {string} sort Heading of the sort selects.
 * @property {string} display Heading of the look switches.
 * @property {string} groupSection Heading of the group selects.
 * @property {string} groupBy Label of the first group select.
 * @property {string} thenBy Label of the selects for the inner levels.
 * @property {string} noGrouping Text of the empty option of those selects.
 * @property {string} stripedRows
 * @property {string} textWrap
 * @property {string} gridLines Label of the grid lines select.
 * @property {Record<import('../types.js').GridLines, string>} gridLinesOptions Text of each mode.
 * @property {string} lineStyle Label of the line style select.
 * @property {Record<import('../types.js').LineStyle, string>} lineStyleOptions Text of each style.
 * @property {string} freezeColumns Label of the frozen columns select.
 * @property {string} freezeColumnsNone Text of its 0 option (the others read as the number).
 * @property {string} reset Text of the reset button (shown when `onReset` is given).
 */

/**
 * Open the "settings" modal: one checkbox per data column (shown or hidden), when some column is sortable a
 * "sort by" column select with a direction select, switches for the look (striped rows, wrapped text) and an
 * optional reset button, each part only when there is something to show. Nothing changes until Apply; Esc, a
 * click on the backdrop and Cancel discard it. The last shown column's checkbox is disabled: a grid always
 * shows a column. The reset button closes the dialog (as Cancel) and calls `onReset`.
 *
 * @param {HTMLElement} root Element that carries the theme tokens (`.dg-root`); the dialog is added inside it.
 * @param {{ key: string, label: string, sortable?: boolean }[]} columns
 * @param {ColumnSettings} current
 * @param {DialogLabels} labels
 * @param {(settings: ColumnSettings | null) => void} onClose Called once, with the new settings on Apply and null otherwise.
 * @param {() => void} [onReset]
 * @param {{ key: string, label: string }[]} [groupColumns] The columns the group selects list; default `columns`.
 * @returns {() => void} Dismiss the dialog (as Cancel).
 */
export function openColumnDialog(
  root,
  columns,
  current,
  labels,
  onClose,
  onReset,
  groupColumns = columns,
) {
  const id = `dg-settings-${++seq}`;
  /** @param {string} label A multi-line header ("ไทย\nEnglish") reads as one line. */
  const flat = (label) => label.replace(/\s*\n\s*/g, ' / ');
  const rows = columns
    .map(({ key, label }) => {
      const name = flat(label);
      return `<label class="dg-columns-item"><input type="checkbox" data-key="${escapeHtml(key)}"><span>${escapeHtml(name)}</span></label>`;
    })
    .join('');
  /** @param {string} text */
  const heading = (text) => `<h3 class="dg-settings-heading">${escapeHtml(text)}</h3>`;
  const columnSection =
    columns.length === 0
      ? ''
      : `<section>${heading(labels.columns)}<div class="dg-settings-list">${rows}</div>` +
        `<div class="dg-settings-bulk"><button type="button" class="dg-settings-link" data-bulk="all">${escapeHtml(labels.selectAll)}</button>` +
        `<button type="button" class="dg-settings-link" data-bulk="none">${escapeHtml(labels.clearAll)}</button></div></section>`;
  /** @param {'striped' | 'wrapped'} flag @param {string} text */
  const switchRow = (flag, text) =>
    current.view?.[flag] === undefined
      ? ''
      : `<label class="dg-settings-switch"><span>${escapeHtml(text)}</span><input type="checkbox" role="switch" data-flag="${flag}"></label>`;
  /** @param {'gridLines' | 'lineStyle' | 'freezeColumns'} name @param {string} text @param {readonly string[]} values @param {Record<string, string>} texts */
  const choiceRow = (name, text, values, texts) =>
    current.view?.[name] === undefined
      ? ''
      : `<label class="dg-settings-field"><span>${escapeHtml(text)}</span><select data-choice="${name}">${values.map((value) => `<option value="${value}">${escapeHtml(texts[value])}</option>`).join('')}</select></label>`;
  // 0 .. the most columns that can be frozen (the current count too, when it was set higher from code).
  const freezeValues = Array.from(
    { length: Math.max(current.freezeMax ?? 0, current.view?.freezeColumns ?? 0) + 1 },
    (_, i) => String(i),
  );
  const freezeTexts = Object.fromEntries(
    freezeValues.map((value) => [value, value === '0' ? labels.freezeColumnsNone : value]),
  );
  const viewRows =
    switchRow('striped', labels.stripedRows) +
    switchRow('wrapped', labels.textWrap) +
    choiceRow('gridLines', labels.gridLines, GRID_LINES, labels.gridLinesOptions) +
    choiceRow('lineStyle', labels.lineStyle, LINE_STYLES, labels.lineStyleOptions) +
    choiceRow('freezeColumns', labels.freezeColumns, freezeValues, freezeTexts);
  const viewSection = viewRows ? `<section>${heading(labels.display)}${viewRows}</section>` : '';
  const sortable = columns.filter((c) => c.sortable === true);
  /** @param {string} text @param {string} control */
  const field = (text, control) =>
    `<label class="dg-settings-field"><span>${escapeHtml(text)}</span>${control}</label>`;
  const sortKeyOptions =
    `<option value="">${escapeHtml(labels.noSort)}</option>` +
    sortable
      .map((c) => `<option value="${escapeHtml(c.key)}">${escapeHtml(flat(c.label))}</option>`)
      .join('');
  const sortSection =
    sortable.length === 0
      ? ''
      : `<section>${heading(labels.sort)}<div class="dg-settings-sort">` +
        field(labels.sortBy, `<select class="dg-settings-sort-key">${sortKeyOptions}</select>`) +
        field(
          labels.sortDirection,
          `<select class="dg-settings-sort-dir"><option value="asc">${escapeHtml(labels.ascending)}</option><option value="desc">${escapeHtml(labels.descending)}</option></select>`,
        ) +
        `</div></section>`;
  const groupSection =
    current.groupBy === undefined
      ? ''
      : renderGroupSection(
          groupColumns.map((c) => ({ key: c.key, label: flat(c.label) })),
          current.groupBy,
          labels,
        );
  const overlay = document.createElement('div');
  overlay.className = 'dg-modal';
  overlay.innerHTML =
    `<div class="dg-modal-box dg-settings" role="dialog" aria-modal="true" aria-labelledby="${id}">` +
    `<h2 class="dg-modal-title" id="${id}">${escapeHtml(labels.title)}</h2>` +
    `<div class="dg-settings-body">${columnSection}${sortSection}${groupSection}${viewSection}</div>` +
    `<div class="dg-modal-actions">` +
    (onReset
      ? `<button type="button" class="dg-modal-btn dg-settings-reset">${escapeHtml(labels.reset)}</button>`
      : '') +
    `<button type="button" class="dg-modal-btn dg-modal-cancel">${escapeHtml(labels.cancel)}</button>` +
    `<button type="button" class="dg-modal-btn dg-modal-ok">${escapeHtml(labels.apply)}</button>` +
    `</div>` +
    `<button type="button" class="dg-modal-x" aria-label="${escapeHtml(labels.close)}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>` +
    `</div>`;

  const boxes = [...overlay.querySelectorAll('.dg-columns-item input')].map(
    (el) => /** @type {HTMLInputElement} */ (el),
  );
  for (const box of boxes) box.checked = !(current.hidden ?? []).includes(box.dataset.key ?? '');
  const switches = [...overlay.querySelectorAll('input[data-flag]')].map(
    (el) => /** @type {HTMLInputElement} */ (el),
  );
  for (const input of switches) {
    input.checked =
      current.view?.[/** @type {'striped' | 'wrapped'} */ (input.dataset.flag)] === true;
  }
  const choices = [...overlay.querySelectorAll('select[data-choice]')].map(
    (el) => /** @type {HTMLSelectElement} */ (el),
  );
  for (const select of choices) {
    const name = /** @type {'gridLines' | 'lineStyle' | 'freezeColumns'} */ (select.dataset.choice);
    select.value = String(current.view?.[name] ?? (name === 'freezeColumns' ? 0 : 'default'));
  }
  const sortKey = /** @type {HTMLSelectElement | null} */ (
    overlay.querySelector('.dg-settings-sort-key')
  );
  const sortDir = /** @type {HTMLSelectElement | null} */ (
    overlay.querySelector('.dg-settings-sort-dir')
  );
  if (sortKey && sortDir) {
    // A sort on a column that is not sortable (set from code) cannot be shown, so it shows as no sorting.
    const inList = sortable.some((c) => c.key === current.sort?.key);
    sortKey.value = inList ? (current.sort?.key ?? '') : '';
    sortDir.value = current.sort?.direction ?? 'asc';
  }
  const groups = groupSelects(overlay);
  fillGroupSelects(groups, current.groupBy ?? []);
  const syncLast = () => {
    const shown = boxes.filter((box) => box.checked);
    for (const box of boxes) box.disabled = shown.length === 1 && box.checked;
  };
  const syncSort = () => {
    if (sortKey && sortDir) sortDir.disabled = sortKey.value === '';
  };
  syncLast();
  syncSort();

  const opener = /** @type {HTMLElement | null} */ (document.activeElement);
  /** @param {boolean} apply */
  const close = (apply) => {
    if (!overlay.isConnected) return;
    /** @type {ColumnSettings} */
    const result = {};
    if (boxes.length > 0) {
      result.hidden = boxes.filter((box) => !box.checked).map((box) => box.dataset.key ?? '');
    }
    if (switches.length > 0 || choices.length > 0) {
      result.view = Object.fromEntries([
        ...switches.map((input) => [input.dataset.flag, input.checked]),
        ...choices.map((select) => [
          select.dataset.choice,
          select.dataset.choice === 'freezeColumns' ? Number(select.value) : select.value,
        ]),
      ]);
    }
    if (groups.length > 0) result.groupBy = readGroupSelects(groups);
    if (sortKey && sortDir) {
      result.sort =
        sortKey.value === ''
          ? null
          : { key: sortKey.value, direction: sortDir.value === 'desc' ? 'desc' : 'asc' };
    }
    overlay.remove();
    opener?.focus?.();
    onClose(apply ? result : null);
  };
  /** @param {KeyboardEvent} event */
  const onKey = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close(false);
    } else if (event.key === 'Tab') {
      // Keep focus inside the dialog.
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
  overlay.addEventListener('change', () => {
    syncLast();
    syncSort();
    syncGroupSelects(groups);
  });
  for (const button of overlay.querySelectorAll('[data-bulk]')) {
    button.addEventListener('click', () => {
      const all = /** @type {HTMLElement} */ (button).dataset.bulk === 'all';
      // Clear all keeps the first column: a grid always shows one.
      boxes.forEach((box, i) => (box.checked = all || i === 0));
      syncLast();
    });
  }
  overlay.addEventListener('click', (event) => event.target === overlay && close(false));
  overlay.querySelector('.dg-modal-cancel')?.addEventListener('click', () => close(false));
  overlay.querySelector('.dg-modal-x')?.addEventListener('click', () => close(false));
  overlay.querySelector('.dg-modal-ok')?.addEventListener('click', () => close(true));
  overlay.querySelector('.dg-settings-reset')?.addEventListener('click', () => {
    close(false);
    onReset?.();
  });
  root.append(overlay);
  /** @type {HTMLElement | undefined} */ (overlay.querySelector(FOCUSABLE) ?? undefined)?.focus();
  return () => close(false);
}
