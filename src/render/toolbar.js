// @ts-check
import { escapeHtml } from '../utils/escape.js';

/**
 * The static part of the grid: search box (optional), the host the table is
 * rendered into, the pager host and a polite live region. Built once so typing
 * and paging never lose focus or caret; only the hosts' content is updated.
 *
 * @param {{ searchable: boolean, searchLabel: string }} opts
 * @returns {string}
 */
export function renderShell({ searchable, searchLabel }) {
  const toolbar = searchable
    ? `<div class="dg-toolbar"><input type="search" class="dg-search" aria-label="${escapeHtml(searchLabel)}"></div>`
    : '';
  return `${toolbar}<div class="dg-table-wrap"></div><div class="dg-pager-host"></div><div class="dg-status" role="status" aria-live="polite"></div>`;
}
