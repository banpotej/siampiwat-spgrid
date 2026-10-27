// @ts-check
import { isActionColumn } from '../core/columns.js';
import { escapeHtml } from '../utils/escape.js';

/** @typedef {import('../types.js').Column} Column */
/** @typedef {import('../types.js').ActionDef} ActionDef */
/** @typedef {import('../types.js').Row} Row */

/** A plain CSS length or calc(): no `;`, `:`, quotes or `\` that could start another declaration. */
const SAFE_WIDTH = /^[\w.%()+\-*/, ]+$/;

/**
 * Each line of a label escaped, joined with <br> (for bilingual two-line headers).
 *
 * @param {string} label
 * @returns {string}
 */
export const renderLabel = (label) =>
  String(label)
    .split(/\r?\n/)
    .map((line) => escapeHtml(line))
    .join('<br>');

/**
 * @param {Column} column
 * @returns {string} `style` attribute (with a leading space) or ''.
 */
export const widthAttr = (column) =>
  typeof column.width === 'string' && SAFE_WIDTH.test(column.width)
    ? ` style="width:${escapeHtml(column.width)}"`
    : '';

/**
 * @param {ActionDef[]} actions
 * @param {Row} row
 * @returns {string} One <button> per visible action.
 */
function renderActions(actions, row) {
  return actions
    .filter((a) => a && typeof a.name === 'string' && a.visible?.(row) !== false)
    .map((a) => {
      const cls = ['dg-action', a.className].filter(Boolean).map(escapeHtml).join(' ');
      const title = a.title ? ` title="${escapeHtml(a.title)}"` : '';
      const disabled = a.disabled?.(row) === true ? ' disabled' : '';
      return `<button type="button" class="${cls}" data-action="${escapeHtml(a.name)}"${title}${disabled}>${escapeHtml(a.label)}</button>`;
    })
    .join('');
}

/**
 * Inner HTML of one cell: action buttons, the column's `render()` output (trusted, inserted as is),
 * or the escaped value.
 *
 * @param {Column} column
 * @param {Row} row
 * @returns {string}
 */
export function renderCell(column, row) {
  if (isActionColumn(column)) return renderActions(column.actions ?? [], row);
  if (typeof column.render === 'function') {
    return String(column.render(row[column.key], row) ?? '');
  }
  return escapeHtml(row[column.key]);
}
