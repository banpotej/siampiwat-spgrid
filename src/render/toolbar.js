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

/**
 * Build the shell inside `container` from the grid options and find the elements the grid keeps using.
 *
 * @param {HTMLElement} container
 * @param {import('../types.js').DataGridOptions} options
 * @param {{ search: string, clear: string }} labels
 * @param {Record<IconName, string>} icons
 */
export function mountShell(container, options, labels, icons) {
  const { maxHeight } = options;
  container.innerHTML = renderShell({
    searchable: options.searchable === true,
    searchLabel: labels.search,
    clearLabel: labels.clear,
    icons,
    striped: options.striped === true,
    compact: options.density === 'compact',
    stickyHeader: options.stickyHeader === true,
    scroll: maxHeight !== undefined,
  });
  /** @param {string} selector */
  const find = (selector) => /** @type {HTMLElement} */ (container.querySelector(selector));
  const host = find('div.dg-table-wrap');
  // Set through the CSSOM (not markup) so an odd value can never inject other styles.
  if (maxHeight !== undefined) {
    host.style.maxHeight = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight;
  }
  return {
    host,
    pagerHost: find('div.dg-pager-host'),
    status: find('div.dg-status'),
    toolbar: /** @type {HTMLElement | null} */ (container.querySelector('div.dg-toolbar')),
    search: /** @type {HTMLInputElement | null} */ (container.querySelector('input.dg-search')),
  };
}
