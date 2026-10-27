// @ts-check
import { escapeHtml } from '../utils/escape.js';
import { renderIcon } from './icons.js';

/** @typedef {import('../types.js').IconName} IconName */

/**
 * The static part of the grid: a root element carrying the look modifiers,
 * the search field (optional), the host the table is rendered into, the pager
 * host and a polite live region. Built once so typing and paging never lose
 * focus or caret; only the hosts' content is updated.
 *
 * @param {{
 *   searchable: boolean, searchLabel: string, clearLabel: string,
 *   icons: Record<IconName, string>, striped: boolean, compact: boolean,
 *   stickyHeader: boolean, scroll: boolean,
 * }} opts
 * @returns {string}
 */
export function renderShell({
  searchable,
  searchLabel,
  clearLabel,
  icons,
  striped,
  compact,
  stickyHeader,
  scroll,
}) {
  const toolbar = searchable
    ? `<div class="dg-toolbar"><div class="dg-search-field">${renderIcon(icons, 'search', 'dg-search-icon')}` +
      `<input type="search" class="dg-search" aria-label="${escapeHtml(searchLabel)}">` +
      `<button type="button" class="dg-search-clear" aria-label="${escapeHtml(clearLabel)}" hidden>${renderIcon(icons, 'close')}</button></div></div>`
    : '';
  const root = [
    'dg-root',
    compact ? 'dg-compact' : '',
    striped ? 'dg-striped' : '',
    stickyHeader ? 'dg-sticky' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const wrap = `dg-table-wrap${scroll ? ' dg-scroll' : ''}`;
  return `<div class="${root}">${toolbar}<div class="${wrap}"></div><div class="dg-pager-host"></div><div class="dg-status" role="status" aria-live="polite"></div></div>`;
}
