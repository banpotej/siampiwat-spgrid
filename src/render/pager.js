// @ts-check
import { getPageWindow } from '../core/paginate.js';
import { escapeHtml } from '../utils/escape.js';

/** @typedef {import('../types.js').Labels} Labels */
/** @typedef {import('../types.js').PageResult} PageResult */

/**
 * @param {number[]} options
 * @param {number} pageSize
 * @returns {string}
 */
function renderPageSizeSelect(options, pageSize) {
  const sizes = [...new Set([...options, pageSize])].sort((a, b) => a - b);
  const items = sizes
    .map((n) => `<option value="${n}"${n === pageSize ? ' selected' : ''}>${n}</option>`)
    .join('');
  return `<select class="dg-page-size-select">${items}</select>`;
}

/**
 * Pager markup: summary, optional page size select and a <nav> with Prev,
 * page buttons and Next. Pure string building; all texts are escaped. The
 * buttons carry `data-page` / `data-action` for the delegated listener.
 *
 * @param {{ paging: PageResult, labels: Required<Labels>, pageSizeOptions: number[] }} model
 * @returns {string}
 */
export function renderPager({ paging, labels, pageSizeOptions }) {
  const { page, pageSize, totalRows, totalPages, rows } = paging;
  const from = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = totalRows === 0 ? 0 : from + rows.length - 1;

  const pages = getPageWindow(page, totalPages)
    .map((item) =>
      item === 'ellipsis'
        ? '<span class="dg-ellipsis" aria-hidden="true">…</span>'
        : `<button type="button" class="dg-page-btn" data-page="${item}"${item === page ? ' aria-current="page"' : ''}>${item}</button>`,
    )
    .join('');
  /** @param {'prev' | 'next'} action @param {boolean} disabled */
  const step = (action, disabled) =>
    `<button type="button" class="dg-page-btn" data-action="${action}"${disabled ? ' disabled' : ''}>${escapeHtml(labels[action])}</button>`;

  const select = pageSizeOptions.length
    ? `<label class="dg-page-size">${escapeHtml(labels.pageSize)} ${renderPageSizeSelect(pageSizeOptions, pageSize)}</label>`
    : '';
  return (
    `<div class="dg-summary">${escapeHtml(labels.summary(from, to, totalRows))}</div>${select}` +
    `<nav class="dg-pager" aria-label="${escapeHtml(labels.pagination)}" tabindex="-1">` +
    `${step('prev', page <= 1)}${pages}${step('next', page >= totalPages)}</nav>`
  );
}
