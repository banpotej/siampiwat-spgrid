// @ts-check
import { getPageWindow } from '../core/paginate.js';
import { escapeHtml } from '../utils/escape.js';
import { renderIcon } from './icons.js';

/** @typedef {import('../types.js').Labels} Labels */
/** @typedef {import('../types.js').PageResult} PageResult */
/** @typedef {import('../types.js').IconName} IconName */

/** @type {Record<'first' | 'prev' | 'next' | 'last', IconName>} */
const STEP_ICON = {
  first: 'first_page',
  prev: 'chevron_left',
  next: 'chevron_right',
  last: 'last_page',
};

/**
 * The "Showing 1–10 of 60" text with each number wrapped in <span class="spg-num"> so the figures stand out from the words.
 * Split before escaping, so an entity such as &#39; is never cut up.
 *
 * @param {string} text
 * @returns {string}
 */
const renderSummaryText = (text) =>
  text
    .split(/(\d[\d,.]*)/)
    .map((part, i) =>
      i % 2 ? `<span class="spg-num">${escapeHtml(part)}</span>` : escapeHtml(part),
    )
    .join('');

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
  return `<select class="spg-page-size-select">${items}</select>`;
}

/**
 * Pager markup: summary, optional page size select and a <nav> with First,
 * Prev, page buttons, Next and Last (icon buttons named by aria-label). Pure string building; all texts are escaped. The
 * buttons carry `data-page` / `data-action` for the delegated listener.
 *
 * @param {{ paging: PageResult, labels: Required<Labels>, pageSizeOptions: number[], icons: Record<IconName, string> }} model
 * @returns {string}
 */
export function renderPager({ paging, labels, pageSizeOptions, icons }) {
  const { page, pageSize, totalRows, totalPages, rows } = paging;
  const from = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = totalRows === 0 ? 0 : from + rows.length - 1;

  const pages = getPageWindow(page, totalPages)
    .map((item) =>
      item === 'ellipsis'
        ? '<span class="spg-ellipsis" aria-hidden="true">…</span>'
        : `<button type="button" class="spg-page-btn" data-page="${item}"${item === page ? ' aria-current="page"' : ''}>${item}</button>`,
    )
    .join('');
  /** @param {'first' | 'prev' | 'next' | 'last'} action @param {boolean} disabled */
  const step = (action, disabled) =>
    `<button type="button" class="spg-page-btn spg-step-btn" data-action="${action}" aria-label="${escapeHtml(labels[action])}"${disabled ? ' disabled' : ''}>${renderIcon(icons, STEP_ICON[action])}</button>`;

  const select = pageSizeOptions.length
    ? `<label class="spg-page-size">${escapeHtml(labels.pageSize)} ${renderPageSizeSelect(pageSizeOptions, pageSize)}</label>`
    : '';
  return (
    `<div class="spg-summary">${renderSummaryText(labels.summary(from, to, totalRows))}</div>${select}` +
    `<nav class="spg-pager" aria-label="${escapeHtml(labels.pagination)}" tabindex="-1">` +
    `${step('first', page <= 1)}${step('prev', page <= 1)}${pages}` +
    `${step('next', page >= totalPages)}${step('last', page >= totalPages)}</nav>`
  );
}
