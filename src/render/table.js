// @ts-check
import { escapeHtml } from '../utils/escape.js';
import { renderIcon } from './icons.js';

/** @typedef {import('../types.js').Column} Column */
/** @typedef {import('../types.js').Row} Row */
/** @typedef {import('../types.js').SortState} SortState */
/** @typedef {import('../types.js').IconName} IconName */

const ARIA_SORT = { asc: 'ascending', desc: 'descending' };
/** @type {Record<'asc' | 'desc', IconName>} */
const SORT_ICON = { asc: 'arrow_upward', desc: 'arrow_downward' };
const ALIGNS = ['left', 'center', 'right'];

/**
 * Alignment class for a column; only the known values ever reach the markup.
 * @param {Column} column
 * @returns {string}
 */
const alignClass = (column) =>
  column.align && ALIGNS.includes(column.align) ? `dg-align-${column.align}` : '';

/**
 * @param {Column} column
 * @param {SortState} sort
 * @param {Record<IconName, string>} icons
 * @returns {string}
 */
function renderHeaderCell(column, sort, icons) {
  const classes = [alignClass(column)];
  const attrs = [`scope="col"`, `data-key="${escapeHtml(column.key)}"`];
  let icon = '';
  if (column.sortable) {
    classes.push('dg-sortable');
    attrs.push('tabindex="0"');
    const direction = sort && sort.key === column.key ? sort.direction : null;
    if (direction) attrs.push(`aria-sort="${ARIA_SORT[direction]}"`);
    icon = renderIcon(icons, direction ? SORT_ICON[direction] : 'unfold_more', 'dg-sort-icon');
  }
  const cls = classes.filter(Boolean).join(' ');
  if (cls) attrs.push(`class="${cls}"`);
  const label = `<span class="dg-th-label">${escapeHtml(column.label ?? column.key)}</span>`;
  return `<th ${attrs.join(' ')}><span class="dg-th">${label}${icon}</span></th>`;
}

/**
 * Build the table markup. Pure string building; every value is escaped.
 *
 * @param {Column[]} columns
 * @param {Row[]} rows Already in display order.
 * @param {SortState} sort
 * @param {string} emptyText Shown in a single full-width row when there are no rows.
 * @param {Record<IconName, string>} icons
 * @returns {string}
 */
export function renderTable(columns, rows, sort, emptyText, icons) {
  const head = columns.map((c) => renderHeaderCell(c, sort, icons)).join('');
  const body =
    rows.length === 0
      ? `<tr class="dg-empty"><td colspan="${Math.max(columns.length, 1)}"><div class="dg-empty-content">${renderIcon(icons, 'inbox')}<span>${escapeHtml(emptyText)}</span></div></td></tr>`
      : rows
          .map((row) => {
            const cells = columns
              .map((c) => {
                const cls = alignClass(c);
                return `<td${cls ? ` class="${cls}"` : ''}>${escapeHtml(row[c.key])}</td>`;
              })
              .join('');
            return `<tr>${cells}</tr>`;
          })
          .join('');
  return `<table class="dg-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}
