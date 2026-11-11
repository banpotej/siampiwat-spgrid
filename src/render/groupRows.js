// @ts-check
import { escapeHtml } from '../utils/escape.js';
import { renderCell } from './cells.js';
import { renderIcon } from './icons.js';

/** @typedef {import('../types.js').Column} Column */
/** @typedef {import('../types.js').IconName} IconName */
/** @typedef {import('../core/group.js').GroupHeader} GroupHeader */

/**
 * @typedef {object} GroupView How the rows are grouped.
 * @property {string[]} keys Group columns, outermost first.
 * @property {ReadonlySet<string>} collapsed Ids of the collapsed groups.
 * @property {Column[]} columns Every column (a group column may be hidden), to find the one a header shows.
 */

/**
 * The header row of a group: a button (chevron, the group's value as the column shows it, how many rows) that
 * collapses or expands the group. Its value is the column's cell for the group's first row, so a badge column
 * shows its badge. Escaped like any cell.
 *
 * @param {GroupHeader} header
 * @param {{ group: GroupView, span: number, icons: Record<IconName, string>, labels: { yes: string, no: string, groupCount: (count: number) => string }, locale?: string }} opts
 *   `span`: how many columns the row covers.
 * @returns {string}
 */
export function renderGroupHeader(header, { group, span, icons, labels, locale }) {
  const column = group.columns.find((c) => c.key === header.column);
  const value = column
    ? renderCell(column, header.first, icons, { labels, locale })
    : escapeHtml(header.first[header.column]);
  const open = !group.collapsed.has(header.id);
  return (
    `<tr class="spg-group-row" data-group-id="${escapeHtml(header.id)}" data-level="${header.level}" style="--spg-group-level:${header.level}">` +
    `<td colspan="${Math.max(span, 1)}"><button type="button" class="spg-group-toggle" aria-expanded="${open}">` +
    `${renderIcon(icons, 'chevron_right', 'spg-group-icon')}<span class="spg-group-value">${value}</span>` +
    ` <span class="spg-group-count">${escapeHtml(labels.groupCount(header.count))}</span></button></td></tr>`
  );
}
