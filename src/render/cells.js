// @ts-check
import { isActionColumn } from '../core/columns.js';
import { escapeHtml } from '../utils/escape.js';
import { isTyped, renderTypedCell } from './cellTypes.js';
import { ICONS, renderIcon } from './icons.js';

/** @typedef {import('../types.js').Column} Column */
/** @typedef {import('../types.js').ActionDef} ActionDef */
/** @typedef {import('../types.js').Row} Row */
/** @typedef {import('../types.js').IconName} IconName */

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
 * @param {Record<IconName, string>} icons
 * @returns {string} One <button> per visible action.
 */
function renderActions(actions, row, icons) {
  return actions
    .filter((a) => a && typeof a.name === 'string' && a.visible?.(row) !== false)
    .map((a) => {
      const name = a.icon;
      const icon =
        typeof name === 'string' && Object.hasOwn(icons, name)
          ? renderIcon(icons, name, 'dg-action-icon')
          : '';
      // With an icon the button is icon-only: the label is its accessible name and (unless `title` says otherwise) its tooltip.
      const iconOnly = icon !== '' && a.showLabel !== true;
      const cls = ['dg-action', iconOnly ? 'dg-action-icononly' : '', a.className]
        .filter(Boolean)
        .map(escapeHtml)
        .join(' ');
      const tip = a.title ?? (iconOnly ? a.label : '');
      const title = tip ? ` title="${escapeHtml(tip)}"` : '';
      const aria = iconOnly ? ` aria-label="${escapeHtml(a.label)}"` : '';
      const disabled = a.disabled?.(row) === true ? ' disabled' : '';
      return `<button type="button" class="${cls}" data-action="${escapeHtml(a.name)}"${aria}${title}${disabled}>${icon}${iconOnly ? '' : escapeHtml(a.label)}</button>`;
    })
    .join('');
}

/**
 * Inner HTML of one cell: action buttons, the column's `render()` output (trusted, inserted as is),
 * or the escaped value.
 *
 * @param {Column} column
 * @param {Row} row
 * @param {Record<IconName, string>} [icons]
 * @param {{ labels?: { yes: string, no: string }, locale?: string }} [ctx] Texts and locale for typed columns.
 * @returns {string}
 */
export function renderCell(column, row, icons = ICONS, ctx = {}) {
  if (isActionColumn(column)) return renderActions(column.actions ?? [], row, icons);
  if (typeof column.render === 'function') {
    return String(column.render(row[column.key], row) ?? '');
  }
  if (isTyped(column.type)) {
    const { labels = { yes: 'Yes', no: 'No' }, locale } = ctx;
    return renderTypedCell(column, row[column.key], { icons, labels, locale });
  }
  return escapeHtml(row[column.key]);
}
