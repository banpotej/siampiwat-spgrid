// @ts-check
import { escapeHtml } from '../utils/escape.js';

/** @typedef {import('../types.js').Column} Column */
/** @typedef {import('../types.js').Row} Row */
/** @typedef {import('../types.js').SortState} SortState */

const ARIA_SORT = { asc: 'ascending', desc: 'descending' };

/**
 * @param {Column} column
 * @param {SortState} sort
 * @returns {string}
 */
function renderHeaderCell(column, sort) {
  const attrs = [`scope="col"`, `data-key="${escapeHtml(column.key)}"`];
  if (column.sortable) {
    attrs.push('class="dg-sortable"', 'tabindex="0"');
    if (sort && sort.key === column.key) attrs.push(`aria-sort="${ARIA_SORT[sort.direction]}"`);
  }
  return `<th ${attrs.join(' ')}>${escapeHtml(column.label ?? column.key)}</th>`;
}

/**
 * Build the table markup. Pure string building; every value is escaped.
 *
 * @param {Column[]} columns
 * @param {Row[]} rows Already in display order.
 * @param {SortState} sort
 * @param {string} emptyText Shown in a single full-width row when there are no rows.
 * @returns {string}
 */
export function renderTable(columns, rows, sort, emptyText) {
  const head = columns.map((c) => renderHeaderCell(c, sort)).join('');
  const body =
    rows.length === 0
      ? `<tr class="dg-empty"><td colspan="${Math.max(columns.length, 1)}">${escapeHtml(emptyText)}</td></tr>`
      : rows
          .map((row) => {
            const cells = columns.map((c) => `<td>${escapeHtml(row[c.key])}</td>`).join('');
            return `<tr>${cells}</tr>`;
          })
          .join('');
  return `<table class="dg-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}
