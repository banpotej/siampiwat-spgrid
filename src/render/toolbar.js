// @ts-check
import { escapeHtml } from '../utils/escape.js';

/**
 * The static part of the grid: search box (optional), the host the table is
 * rendered into, and a polite live region. Built once so typing never loses
 * focus or caret; only the table host is re-rendered afterwards.
 *
 * @param {{ searchable: boolean, searchLabel: string }} opts
 * @returns {string}
 */
export function renderShell({ searchable, searchLabel }) {
  const toolbar = searchable
    ? `<div class="dg-toolbar"><input type="search" class="dg-search" aria-label="${escapeHtml(searchLabel)}"></div>`
    : '';
  return `${toolbar}<div class="dg-table-wrap"></div><div class="dg-status" role="status" aria-live="polite"></div>`;
}
