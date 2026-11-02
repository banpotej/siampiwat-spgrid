// @ts-check
import { isActionColumn } from '../core/columns.js';
import { escapeHtml } from '../utils/escape.js';
import { renderColumnPicker } from './columnPicker.js';
import { renderIcon } from './icons.js';
import { renderSearchAlternatives } from './searchValue.js';
import {
  createViewSettings,
  gridLinesClass,
  lineStyleClass,
  loadFlag,
  loadGridLines,
  loadLineStyle,
  STRIPED_PREFIX,
  TEXT_WRAP_PREFIX,
} from './viewToggles.js';

/** @typedef {import('../types.js').IconName} IconName */

/**
 * @param {{ key: string, label: string }[]} columns
 * @param {string} label aria-label of the select
 * @param {string} allLabel
 * @returns {string}
 */
const renderColumnSelect = (columns, label, allLabel) => {
  const options = columns
    .map(({ key, label: text }) => {
      // A multi-line header ("ไทย\nEnglish") reads as one line inside an <option>.
      const flat = text.replace(/\s*\n\s*/g, ' / ');
      return `<option value="${escapeHtml(key)}">${escapeHtml(flat)}</option>`;
    })
    .join('');
  return `<select class="dg-search-column" aria-label="${escapeHtml(label)}"><option value="">${escapeHtml(allLabel)}</option>${options}</select>`;
};

/**
 * @param {import('../types.js').Column[]} columns
 * @returns {{ key: string, label: string, sortable: boolean }[]} The data columns (not the action ones) with their text.
 */
const dataColumns = (columns) =>
  columns
    .filter((c) => !isActionColumn(c))
    .map((c) => ({ key: c.key, label: c.label ?? c.key, sortable: c.sortable === true }));

/**
 * An icon-only toolbar button named by `label` (aria-label and tooltip); '' when `label` is null.
 *
 * @param {string} className
 * @param {string | null} label
 * @param {IconName} icon
 * @param {Record<IconName, string>} icons
 * @returns {string}
 */
const toolButton = (className, label, icon, icons) =>
  label === null
    ? ''
    : `<button type="button" class="${className}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">${renderIcon(icons, icon)}</button>`;

/**
 * The static part of the grid: a root element carrying the look modifiers,
 * the search input group (optional), the host the table is rendered into, the pager
 * host and a polite live region. Built once so typing and paging never lose
 * focus or caret; only the hosts' content is updated.
 *
 * @param {{
 *   searchable: boolean, searchLabel: string, clearLabel: string, searchButtonLabel: string | null, exportLabel: string | null,
 *   resizable: boolean, wrapped: boolean, title: string | null, description: string | null, toggleLabel: string, refreshLabel: string | null, summary: boolean,
 *   searchColumns: { key: string, label: string }[] | null, searchColumnLabel: string, allColumnsLabel: string, allValuesLabel: string, dateFromLabel: string, dateToLabel: string,
 *   settingsLabel: string | null,
 *   icons: Record<IconName, string>, striped: boolean, gridLines: import('../types.js').GridLines, lineStyle: import('../types.js').LineStyle, compact: boolean,
 *   stickyHeader: boolean, scroll: boolean,
 * }} opts
 * @returns {string}
 */
export function renderShell({
  searchable,
  searchLabel,
  clearLabel,
  searchButtonLabel,
  exportLabel,
  refreshLabel,
  resizable,
  wrapped,
  title,
  description,
  toggleLabel,
  summary,
  searchColumns,
  searchColumnLabel,
  allColumnsLabel,
  allValuesLabel,
  dateFromLabel,
  dateToLabel,
  settingsLabel,
  icons,
  striped,
  gridLines,
  lineStyle,
  compact,
  stickyHeader,
  scroll,
}) {
  const buttons =
    searchButtonLabel === null
      ? ''
      : `<button type="button" class="dg-search-submit" aria-label="${escapeHtml(searchButtonLabel)}" title="${escapeHtml(searchButtonLabel)}">${renderIcon(icons, 'search')}</button>` +
        `<button type="button" class="dg-search-reset" aria-label="${escapeHtml(clearLabel)}" title="${escapeHtml(clearLabel)}">${renderIcon(icons, 'close')}</button>`;
  // Right of the search box: [Refresh] [Export] [Settings], each only when turned on.
  const tools =
    toolButton('dg-tool-btn dg-refresh', refreshLabel, 'refresh', icons) +
    toolButton('dg-export', exportLabel, 'download', icons);
  // One input group: [column select] [search box] [Search] [Clear search] [tools], joined edge to edge.
  // Without a search box the tools stand alone in the toolbar.
  const pickerButton = settingsLabel ? renderColumnPicker(settingsLabel, icons) : '';
  const group = searchable
    ? `<div class="dg-input-group">` +
      `${searchColumns ? renderColumnSelect(searchColumns, searchColumnLabel, allColumnsLabel) : ''}` +
      `<div class="dg-search-field">${renderIcon(icons, 'search', 'dg-search-icon')}` +
      `<input type="search" class="dg-search" aria-label="${escapeHtml(searchLabel)}" placeholder="${escapeHtml(searchLabel)}…">` +
      `${searchColumns ? renderSearchAlternatives({ label: searchLabel, all: allValuesLabel, from: dateFromLabel, to: dateToLabel }) : ''}` +
      `<button type="button" class="dg-search-clear" aria-label="${escapeHtml(clearLabel)}" hidden>${renderIcon(icons, 'close')}</button></div>` +
      `${buttons}${tools}${pickerButton}</div>`
    : tools + pickerButton;
  // The grid name sits at the start (left) edge of the toolbar, the filter bar at the end.
  // A description can be hidden or shown again with the toggle next to the name.
  const toggle = description
    ? `<button type="button" class="dg-desc-toggle" aria-expanded="true" aria-label="${escapeHtml(toggleLabel)}" title="${escapeHtml(toggleLabel)}">${renderIcon(icons, 'chevron_right')}</button>`
    : '';
  const heading =
    title || description
      ? `<div class="dg-heading">${title ? `<h2 class="dg-title">${escapeHtml(title)}</h2>` : ''}${toggle}</div>`
      : '';
  const desc = description ? `<div class="dg-desc">${escapeHtml(description)}</div>` : '';
  const toolbar = group || heading ? `<div class="dg-toolbar">${heading}${group}</div>` : '';
  const root = [
    'dg-root',
    compact ? 'dg-compact' : '',
    striped ? 'dg-striped' : '',
    wrapped ? '' : 'dg-nowrap',
    resizable ? 'dg-resizable' : '',
    gridLinesClass(gridLines),
    lineStyleClass(lineStyle),
    stickyHeader ? 'dg-sticky' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const wrap = `dg-table-wrap${scroll ? ' dg-scroll' : ''}`;
  return `<div class="${root}">${toolbar}${desc}${summary ? '<div class="dg-summary" aria-live="polite" hidden></div>' : ''}<div class="${wrap}"></div><div class="dg-pager-host"></div><div class="dg-status" role="status" aria-live="polite"></div></div>`;
}

/**
 * Build the shell inside `container` from the grid options and find the elements the grid keeps using.
 *
 * @param {HTMLElement} container
 * @param {import('../types.js').DataGridOptions} options
 * @param {{ search: string, clear: string, searchButton: string, exportExcel: string, searchColumn: string, allColumns: string, allValues: string, dateFrom: string, dateTo: string, columns: string, refresh: string, toggleDescription: string }} labels
 * @param {Record<IconName, string>} icons
 */
export function mountShell(container, options, labels, icons) {
  const { maxHeight } = options;
  const pickerColumns = options.columnPicker === true ? dataColumns(options.columns) : null;
  // The Settings button opens the modal; it has something to offer when any of these options is on.
  const hasSettings =
    pickerColumns !== null ||
    options.resetButton === true ||
    options.stripedToggle === true ||
    options.textWrapToggle === true ||
    options.gridLinesToggle === true ||
    options.lineStyleToggle === true ||
    options.groupByToggle === true;
  container.innerHTML = renderShell({
    searchable: options.searchable === true,
    searchLabel: labels.search,
    clearLabel: labels.clear,
    searchButtonLabel: options.searchButton === true ? labels.searchButton : null,
    exportLabel: options.exportButton === true ? labels.exportExcel : null,
    refreshLabel: options.refreshButton === true ? labels.refresh : null,
    title: options.title ?? null,
    description: options.description ?? null,
    toggleLabel: labels.toggleDescription,
    summary: options.filterSummary === true,
    searchColumns:
      options.searchable === true && options.searchColumnSelect === true
        ? dataColumns(options.columns)
        : null,
    searchColumnLabel: labels.searchColumn,
    allColumnsLabel: labels.allColumns,
    allValuesLabel: labels.allValues,
    dateFromLabel: labels.dateFrom,
    dateToLabel: labels.dateTo,
    settingsLabel: hasSettings ? labels.columns : null,
    icons,
    striped: loadFlag(STRIPED_PREFIX, options.stripedStorageKey, options.striped === true),
    wrapped: loadFlag(TEXT_WRAP_PREFIX, options.textWrapStorageKey, options.textWrap !== false),
    resizable: options.resizableColumns === true,
    gridLines: loadGridLines(
      options.gridLinesStorageKey,
      options.gridLines ?? (options.bordered === true ? 'both' : 'default'),
    ),
    lineStyle: loadLineStyle(options.lineStyleStorageKey, options.lineStyle ?? 'default'),
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
  const toggle = container.querySelector('button.dg-desc-toggle');
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    container.querySelector('.dg-desc')?.toggleAttribute('hidden', !open);
  });
  return {
    host,
    pagerHost: find('div.dg-pager-host'),
    status: find('div.dg-status'),
    pickerColumns,
    groupColumns: options.groupByToggle === true ? dataColumns(options.columns) : null,
    view: createViewSettings(container.querySelector('.dg-root'), options),
    toolbar: /** @type {HTMLElement | null} */ (container.querySelector('div.dg-toolbar')),
    columnPicker: /** @type {HTMLElement | null} */ (
      container.querySelector('div.dg-toolbar:has(.dg-columns-btn)')
    ),
    summary: /** @type {HTMLElement | null} */ (container.querySelector('div.dg-summary')),
    refreshButton: /** @type {HTMLButtonElement | null} */ (
      container.querySelector('button.dg-refresh')
    ),
    exportButton: /** @type {HTMLButtonElement | null} */ (
      container.querySelector('button.dg-export')
    ),
    search: /** @type {HTMLInputElement | null} */ (container.querySelector('input.dg-search')),
    searchColumn: /** @type {HTMLSelectElement | null} */ (
      container.querySelector('select.dg-search-column')
    ),
    searchValue: /** @type {HTMLSelectElement | null} */ (
      container.querySelector('select.dg-search-value')
    ),
    searchRange: /** @type {HTMLElement | null} */ (container.querySelector('.dg-search-range')),
  };
}
