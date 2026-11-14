// @ts-check
import { selectionKey, selectionState } from '../core/selection.js';
import { escapeHtml } from '../utils/escape.js';

/** Width of the checkbox column (px) while the columns are pinned to pixel widths by resizing. */
export const SELECT_WIDTH = 44;

/**
 * @typedef {object} SelectView How the table draws the selection column.
 * @property {import('../core/selection.js').SelectMode} mode
 * @property {ReadonlySet<unknown>} selected
 * @property {string} [rowKey]
 * @property {'none' | 'some' | 'all'} page How much of the rows on the page is selected (the header checkbox).
 * @property {{ selectRow: string, selectAllRows: string, selectColumn: string }} labels
 */

/**
 * @param {import('../core/selection.js').SelectMode} mode
 * @param {ReadonlySet<unknown>} selected
 * @param {import('../types.js').Row[]} rows The rows on the page.
 * @param {string | undefined} rowKey
 * @param {SelectView['labels']} labels
 * @returns {SelectView}
 */
export function selectView(mode, selected, rows, rowKey, labels) {
  return { mode, selected, rowKey, page: selectionState(rows, selected, rowKey), labels };
}

/**
 * @param {SelectView} view
 * @param {boolean} pinned Columns have pixel widths: give the cell one too.
 * @returns {string} The header cell: a "select all rows on this page" checkbox ('multiple'), or just a name ('single').
 */
export function renderSelectHead({ mode, page, labels }, pinned) {
  const style = pinned ? ` style="width:${SELECT_WIDTH}px"` : '';
  const content =
    mode === 'multiple'
      ? `<input type="checkbox" class="spg-select-all" aria-label="${escapeHtml(labels.selectAllRows)}"${page === 'all' ? ' checked' : ''}>`
      : `<span class="spg-select-name">${escapeHtml(labels.selectColumn)}</span>`;
  return `<th scope="col" class="spg-select-col"${style}>${content}</th>`;
}

/**
 * @param {import('../types.js').Row} row
 * @param {SelectView} view
 * @returns {string} The row's checkbox cell. The box is not a Tab stop: the row is, and Space on it selects.
 */
export function renderSelectCell(row, { selected, rowKey, labels }) {
  const checked = selected.has(selectionKey(row, rowKey)) ? ' checked' : '';
  return `<td class="spg-select-cell"><input type="checkbox" class="spg-select" tabindex="-1" aria-label="${escapeHtml(labels.selectRow)}"${checked}></td>`;
}

/**
 * @param {import('../types.js').Row} row
 * @param {SelectView} view
 * @returns {string} Attributes for the row's `<tr>`: `aria-selected` and the `is-selected` class while selected.
 */
export function selectRowAttrs(row, { selected, rowKey }) {
  return selected.has(selectionKey(row, rowKey))
    ? ' aria-selected="true" class="is-selected"'
    : ' aria-selected="false"';
}

/**
 * After the table is drawn: the header checkbox is half-checked while only some rows of the page are selected (a state
 * markup cannot express).
 *
 * @param {HTMLElement} host
 * @param {'none' | 'some' | 'all'} page
 */
export function syncSelectAll(host, page) {
  const box = host.querySelector('input.spg-select-all');
  if (box instanceof HTMLInputElement) box.indeterminate = page === 'some';
}
