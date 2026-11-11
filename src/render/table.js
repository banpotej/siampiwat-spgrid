// @ts-check
import { isActionColumn } from '../core/columns.js';
import { groupItems } from '../core/group.js';
import { escapeHtml } from '../utils/escape.js';
import { renderCell, renderLabel, widthAttr } from './cells.js';
import { renderGroupHeader } from './groupRows.js';
import { renderIcon } from './icons.js';

/** @typedef {import('../types.js').Column} Column */
/** @typedef {import('../types.js').Row} Row */
/** @typedef {import('../types.js').SortState} SortState */
/** @typedef {import('../types.js').IconName} IconName */
/** @typedef {{ enabled: boolean, widths: Map<string, number> | null, label: (name: string) => string }} ResizeView Column resizing: whether to draw the handles, the pinned pixel widths (null until the first resize) and the handle's accessible name. */

/** Width given to a column that was not there when the others were pinned (it was hidden at the time). */
const FALLBACK_WIDTH = 120;

const ARIA_SORT = { asc: 'ascending', desc: 'descending' };
/** @type {Record<'asc' | 'desc', IconName>} */
const SORT_ICON = { asc: 'arrow_upward', desc: 'arrow_downward' };
const ALIGNS = ['left', 'center', 'right'];
/** @type {Record<string, 'right' | 'center'>} Where typed columns sit unless `align` says otherwise. */
const DEFAULT_ALIGN = { number: 'right', boolean: 'center' };

/**
 * Alignment class for a column; only the known values ever reach the markup.
 * @param {Column} column
 * @returns {string}
 */
const alignClass = (column) => {
  const align = column.align ?? DEFAULT_ALIGN[column.type ?? 'text'];
  return align && ALIGNS.includes(align) ? `spg-align-${align}` : '';
};

/**
 * @param {Column} column
 * @param {SortState} sort
 * @param {Record<IconName, string>} icons
 * @param {ResizeView} resize
 * @param {boolean} reorder Make the cell draggable (and focusable, for Alt+arrow).
 * @returns {string}
 */
function renderHeaderCell(column, sort, icons, resize, reorder) {
  const classes = [alignClass(column), isActionColumn(column) ? 'spg-action-col' : ''];
  const attrs = [`scope="col"`, `data-key="${escapeHtml(column.key)}"`];
  if (column.ariaLabel) attrs.push(`aria-label="${escapeHtml(column.ariaLabel)}"`);
  let icon = '';
  if (reorder) attrs.push('draggable="true"');
  const sortable = column.sortable === true && !isActionColumn(column);
  if (sortable) {
    classes.push('spg-sortable');
    const direction = sort && sort.key === column.key ? sort.direction : null;
    if (direction) attrs.push(`aria-sort="${ARIA_SORT[direction]}"`);
    icon = renderIcon(icons, direction ? SORT_ICON[direction] : 'unfold_more', 'spg-sort-icon');
  }
  if (sortable || reorder) attrs.push('tabindex="0"');
  const cls = classes.filter(Boolean).join(' ');
  if (cls) attrs.push(`class="${cls}"`);
  // An action column has no header text unless it is given one; `key` is only an identifier there.
  const text = column.label ?? (isActionColumn(column) ? '' : column.key);
  const label = `<span class="spg-th-label">${renderLabel(text)}</span>`;
  const width = resize.widths
    ? ` style="width:${resize.widths.get(column.key) ?? FALLBACK_WIDTH}px"`
    : widthAttr(column);
  const handle =
    resize.enabled && !isActionColumn(column)
      ? `<span class="spg-resize" role="separator" aria-orientation="vertical" tabindex="0" aria-label="${escapeHtml(resize.label(String(text).replace(/\s*\n\s*/g, ' ')))}"></span>`
      : '';
  return `<th ${attrs.join(' ')}${width}><span class="spg-th">${label}${icon}</span>${handle}</th>`;
}

/**
 * Build the table markup. Pure string building; every value is escaped.
 *
 * @param {Column[]} columns
 * @param {Row[]} rows Already in display order.
 * @param {SortState} sort
 * @param {{ empty: string, yes: string, no: string, groupCount: (count: number, group: import('../labelTypes.js').GroupInfo) => string }} labels `empty` is shown in a full-width row when there are no rows.
 * @param {Record<IconName, string>} icons
 * @param {string} [rowKey] Field to expose as `data-row-id`.
 * @param {string} [locale] For formatting `date` and `number` cells.
 * @param {ResizeView} [resize]
 * @param {boolean} [reorder] Header cells can be dragged to reorder the columns.
 * @param {import('./groupRows.js').GroupView} [group] Put a collapsible header row before each group of `rows`.
 * @returns {string}
 */
export function renderTable(
  columns,
  rows,
  sort,
  labels,
  icons,
  rowKey,
  locale,
  resize = { enabled: false, widths: null, label: String },
  reorder = false,
  group = { keys: [], collapsed: new Set(), columns },
) {
  const head = columns.map((c) => renderHeaderCell(c, sort, icons, resize, reorder)).join('');
  const body =
    rows.length === 0
      ? `<tr class="spg-empty"><td colspan="${Math.max(columns.length, 1)}"><div class="spg-empty-content">${renderIcon(icons, 'inbox')}<span>${escapeHtml(labels.empty)}</span></div></td></tr>`
      : groupItems(rows, group.keys, group.collapsed)
          .map((item) => {
            if (item.type === 'group') {
              return renderGroupHeader(item, {
                group,
                span: columns.length,
                icons,
                labels,
                locale,
              });
            }
            const { row, index } = item;
            const cells = columns
              .map((c) => {
                const cls = [alignClass(c), isActionColumn(c) ? 'spg-action-cell' : '']
                  .filter(Boolean)
                  .join(' ');
                return `<td${cls ? ` class="${cls}"` : ''}>${renderCell(c, row, icons, { labels, locale })}</td>`;
              })
              .join('');
            const id = rowKey !== undefined ? row[rowKey] : undefined;
            const idAttr =
              id === undefined || id === null ? '' : ` data-row-id="${escapeHtml(id)}"`;
            return `<tr data-row-index="${index}"${idAttr}>${cells}</tr>`;
          })
          .join('');
  const { widths } = resize;
  const total = widths
    ? columns.reduce((sum, c) => sum + (widths.get(c.key) ?? FALLBACK_WIDTH), 0)
    : 0;
  const tableAttrs = widths
    ? ` class="spg-table spg-fixed" style="width:${total}px"`
    : ' class="spg-table"';
  return `<table${tableAttrs}><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}
