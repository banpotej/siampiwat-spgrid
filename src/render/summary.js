// @ts-check
import { escapeHtml } from '../utils/escape.js';
import { searchKind } from '../core/columns.js';
import { renderIcon } from './icons.js';

/** @typedef {import('../types.js').Column} Column */
/** @typedef {import('../types.js').FilterState} FilterState */
/** @typedef {import('../types.js').IconName} IconName */

/**
 * @param {Column[]} columns
 * @param {string} key
 * @returns {string} The column's label on one line (a multi-line header reads "ไทย / English"), or the key.
 */
const columnLabel = (columns, key) =>
  (columns.find((c) => c.key === key)?.label ?? key).replace(/\s*\n\s*/g, ' / ');

/**
 * The filter summary: how many rows the filter left, and one removable chip per active part of it
 * (the search text, with its column when limited to one, and each column filter). Escaped.
 *
 * @param {{ filter: FilterState | null, columns: Column[], shown: number, total: number,
 *   labels: { search: string, filterSummary: (shown: number, total: number) => string,
 *     removeFilter: (text: string) => string },
 *   icons: Record<IconName, string> }} opts `shown`: rows matching; `total`: rows before filtering.
 * @returns {string} '' when nothing is filtered.
 */
export function renderSummary({ filter, columns, shown, total, labels, icons }) {
  /** @type {{ text: string, attrs: string }[]} */
  const chips = [];
  if (filter?.search) {
    const where = filter.searchColumn ? columnLabel(columns, filter.searchColumn) : labels.search;
    // A date range is stored as 'FROM..TO'; it reads better as 'FROM – TO'.
    const isRange = searchKind(columns.find((c) => c.key === filter.searchColumn)) === 'date';
    const what = isRange ? filter.search.replace('..', ' – ') : filter.search;
    chips.push({ text: `${where}: "${what}"`, attrs: 'data-remove="search"' });
  }
  for (const [key, text] of Object.entries(filter?.columnFilters ?? {})) {
    chips.push({
      text: `${columnLabel(columns, key)}: "${text}"`,
      attrs: `data-remove="column" data-key="${escapeHtml(key)}"`,
    });
  }
  if (chips.length === 0) return '';
  const items = chips
    .map(({ text, attrs }) => {
      const name = escapeHtml(labels.removeFilter(text));
      return (
        `<li class="dg-chip"><span class="dg-chip-text">${escapeHtml(text)}</span>` +
        `<button type="button" class="dg-chip-remove" ${attrs} aria-label="${name}" title="${name}">${renderIcon(icons, 'close')}</button></li>`
      );
    })
    .join('');
  return `<span class="dg-summary-count">${escapeHtml(labels.filterSummary(shown, total))}</span><ul class="dg-chips">${items}</ul>`;
}

/**
 * Bind the summary's delegated click: the remove button of a chip reports which part to drop.
 *
 * @param {HTMLElement} host
 * @param {(part: { type: 'search' } | { type: 'column', key: string }) => void} onRemove
 * @returns {() => void} Unbind.
 */
export function bindSummaryEvents(host, onRemove) {
  /** @param {Event} e */
  const onClick = (e) => {
    const button = e.target instanceof Element ? e.target.closest('.dg-chip-remove') : null;
    if (!(button instanceof HTMLElement) || !host.contains(button)) return;
    onRemove(
      button.dataset.remove === 'column'
        ? { type: 'column', key: button.dataset.key ?? '' }
        : { type: 'search' },
    );
  };
  host.addEventListener('click', onClick);
  return () => host.removeEventListener('click', onClick);
}
