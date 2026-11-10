// @ts-check
import { escapeHtml } from '../utils/escape.js';
import { searchKind } from '../core/columns.js';
import { columnLabel, describeCondition } from './conditionText.js';
import { renderIcon } from './icons.js';

/** @typedef {import('../types.js').Column} Column */
/** @typedef {import('../types.js').FilterState} FilterState */
/** @typedef {import('../types.js').IconName} IconName */

/**
 * The filter summary: how many rows the filter left, and one removable chip per active part of it
 * (the search text, with its column when limited to one, each column filter, and the advanced filter: one chip for each
 * condition of an AND group, one chip for anything else). Escaped.
 *
 * @param {{ filter: FilterState | null, columns: Column[], shown: number, total: number,
 *   labels: { search: string, filterSummary: (shown: number, total: number) => string,
 *     removeFilter: (text: string) => string,
 *     conditionOperator: (op: import('../types.js').ConditionOperator) => string,
 *     conditionAnd: string, conditionOr: string },
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
  const tree = filter?.conditions;
  if (tree) {
    const parts =
      'conditions' in tree && tree.logic === 'and'
        ? tree.conditions.map((node, i) => ({
            node,
            attrs: `data-remove="condition" data-index="${i}"`,
          }))
        : [{ node: tree, attrs: 'data-remove="conditions"' }];
    for (const { node, attrs } of parts) {
      chips.push({ text: describeCondition(node, columns, labels), attrs });
    }
  }
  if (chips.length === 0) return '';
  const items = chips
    .map(({ text, attrs }) => {
      const name = escapeHtml(labels.removeFilter(text));
      return (
        `<li class="spg-chip"><span class="spg-chip-text">${escapeHtml(text)}</span>` +
        `<button type="button" class="spg-chip-remove" ${attrs} aria-label="${name}" title="${name}">${renderIcon(icons, 'close')}</button></li>`
      );
    })
    .join('');
  return `<span class="spg-summary-count">${escapeHtml(labels.filterSummary(shown, total))}</span><ul class="spg-chips">${items}</ul>`;
}

/**
 * Bind the summary's delegated click: the remove button of a chip reports which part to drop.
 *
 * @param {HTMLElement} host
 * @param {(part: { type: 'search' } | { type: 'column', key: string } | { type: 'condition', index: number }
 *   | { type: 'conditions' }) => void} onRemove
 * @returns {() => void} Unbind.
 */
export function bindSummaryEvents(host, onRemove) {
  /** @param {Event} e */
  const onClick = (e) => {
    const button = e.target instanceof Element ? e.target.closest('.spg-chip-remove') : null;
    if (!(button instanceof HTMLElement) || !host.contains(button)) return;
    const { remove, key, index } = button.dataset;
    if (remove === 'column') onRemove({ type: 'column', key: key ?? '' });
    else if (remove === 'condition') onRemove({ type: 'condition', index: Number(index) });
    else onRemove({ type: remove === 'conditions' ? 'conditions' : 'search' });
  };
  host.addEventListener('click', onClick);
  return () => host.removeEventListener('click', onClick);
}
