// @ts-check
import { isActionColumn } from '../core/columns.js';
import { escapeHtml } from '../utils/escape.js';
import { renderColumnPicker } from './columnPicker.js';
import { renderIcon } from './icons.js';
import { loadFreezeColumns } from './frozenColumns.js';
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
  return `<select class="spg-search-column" aria-label="${escapeHtml(label)}"><option value="">${escapeHtml(allLabel)}</option>${options}</select>`;
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
 *   searchable: boolean, searchLabel: string, clearLabel: string, searchButtonLabel: string | null, exportLabel: string | null, advancedLabel: string | null, viewLabel: string | null,
 *   resizable: boolean, wrapped: boolean, title: string | null, description: string | null, toggleLabel: string, refreshLabel: string | null, groupToggleLabel: string | null, summary: boolean,
 *   searchColumns: { key: string, label: string }[] | null, searchColumnLabel: string, allColumnsLabel: string, allValuesLabel: string, dateFromLabel: string, dateToLabel: string,
 *   settingsLabel: string | null, rowCount: boolean, showHeader: boolean,
 *   icons: Record<IconName, string>, striped: boolean, gridLines: import('../types.js').GridLines, lineStyle: import('../types.js').LineStyle, compact: boolean,
 *   stickyHeader: boolean, scroll: boolean, freezeColumns: number,
 * }} opts
 * @returns {string}
 */
export function renderShell({
  searchable,
  searchLabel,
  clearLabel,
  searchButtonLabel,
  exportLabel,
  advancedLabel,
  viewLabel,
  refreshLabel,
  groupToggleLabel,
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
  rowCount,
  showHeader,
  icons,
  striped,
  gridLines,
  lineStyle,
  compact,
  stickyHeader,
  scroll,
  freezeColumns,
}) {
  const buttons =
    searchButtonLabel === null
      ? ''
      : `<button type="button" class="spg-search-submit" aria-label="${escapeHtml(searchButtonLabel)}" title="${escapeHtml(searchButtonLabel)}">${renderIcon(icons, 'search')}</button>` +
        `<button type="button" class="spg-search-reset" aria-label="${escapeHtml(clearLabel)}" title="${escapeHtml(clearLabel)}">${renderIcon(icons, 'close')}</button>`;
  // Right of the search box: [Refresh] [Export] [Settings], each only when turned on.
  const tools =
    toolButton('spg-tool-btn spg-view-toggle', viewLabel, 'calendar_today', icons) +
    toolButton('spg-tool-btn spg-refresh', refreshLabel, 'refresh', icons) +
    toolButton('spg-tool-btn spg-group-all', groupToggleLabel, 'unfold_less', icons) +
    toolButton('spg-tool-btn spg-advfilter', advancedLabel, 'filter_list', icons) +
    toolButton('spg-export', exportLabel, 'download', icons);
  // One input group: [column select] [search box] [Search] [Clear search] [tools], joined edge to edge.
  // Without a search box the tools stand alone in the toolbar.
  const pickerButton = settingsLabel ? renderColumnPicker(settingsLabel, icons) : '';
  const group = searchable
    ? `<div class="spg-input-group">` +
      `${searchColumns ? renderColumnSelect(searchColumns, searchColumnLabel, allColumnsLabel) : ''}` +
      `<div class="spg-search-field">${renderIcon(icons, 'search', 'spg-search-icon')}` +
      `<input type="search" class="spg-search" aria-label="${escapeHtml(searchLabel)}" placeholder="${escapeHtml(searchLabel)}…">` +
      `${searchColumns ? renderSearchAlternatives({ label: searchLabel, all: allValuesLabel, from: dateFromLabel, to: dateToLabel }) : ''}` +
      `<button type="button" class="spg-search-clear" aria-label="${escapeHtml(clearLabel)}" hidden>${renderIcon(icons, 'close')}</button></div>` +
      `${buttons}${tools}${pickerButton}</div>`
    : tools + pickerButton;
  // The grid name sits at the start (left) edge of the toolbar, the filter bar at the end.
  // A description can be hidden or shown again with the toggle next to the name.
  const toggle = description
    ? `<button type="button" class="spg-desc-toggle" aria-expanded="true" aria-label="${escapeHtml(toggleLabel)}" title="${escapeHtml(toggleLabel)}">${renderIcon(icons, 'chevron_right')}</button>`
    : '';
  const heading =
    title || description
      ? `<div class="spg-heading">${title ? `<h2 class="spg-title">${escapeHtml(title)}</h2>` : ''}${toggle}</div>`
      : '';
  const desc = description ? `<div class="spg-desc">${escapeHtml(description)}</div>` : '';
  // The row counter (text filled in on every render) closes the toolbar at its end edge.
  const count = rowCount ? '<span class="spg-count" aria-live="polite"></span>' : '';
  const toolbar =
    group || heading || count ? `<div class="spg-toolbar">${heading}${group}${count}</div>` : '';
  const root = [
    'spg-root',
    compact ? 'spg-compact' : '',
    striped ? 'spg-striped' : '',
    wrapped ? '' : 'spg-nowrap',
    resizable ? 'spg-resizable' : '',
    showHeader ? '' : 'spg-no-head',
    gridLinesClass(gridLines),
    lineStyleClass(lineStyle),
    stickyHeader ? 'spg-sticky' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const wrap = `spg-table-wrap${scroll ? ' spg-scroll' : ''}`;
  const freeze = freezeColumns > 0 ? ` data-freeze="${freezeColumns}"` : '';
  return `<div class="${root}"${freeze}>${toolbar}${desc}${summary ? '<div class="spg-summary" aria-live="polite" hidden></div>' : ''}<div class="${wrap}"></div><div class="spg-pager-host"></div><div class="spg-status" role="status" aria-live="polite"></div></div>`;
}

/**
 * Build the shell inside `container` from the grid options and find the elements the grid keeps using.
 *
 * @param {HTMLElement} container
 * @param {import('../types.js').SPGridOptions} options
 * @param {{ search: string, clear: string, searchButton: string, exportExcel: string, advancedFilter: string, searchColumn: string, allColumns: string, allValues: string, dateFrom: string, dateTo: string, columns: string, refresh: string, collapseAllGroups: string, toggleDescription: string, viewCalendar: string }} labels
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
    options.freezeColumnsToggle === true ||
    options.groupByToggle === true;
  container.innerHTML = renderShell({
    searchable: options.searchable === true,
    searchLabel: labels.search,
    clearLabel: labels.clear,
    searchButtonLabel: options.searchButton === true ? labels.searchButton : null,
    exportLabel: options.exportButton === true ? labels.exportExcel : null,
    advancedLabel: options.advancedFilter === true ? labels.advancedFilter : null,
    viewLabel: options.viewToggle === true ? labels.viewCalendar : null,
    refreshLabel: options.refreshButton === true ? labels.refresh : null,
    groupToggleLabel: options.groupToggleAllButton === true ? labels.collapseAllGroups : null,
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
    rowCount: options.rowCount === true,
    showHeader: options.showHeader !== false,
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
    freezeColumns: loadFreezeColumns(options.freezeColumnsStorageKey, options.freezeColumns ?? 0),
  });
  /** @param {string} selector */
  const find = (selector) => /** @type {HTMLElement} */ (container.querySelector(selector));
  const host = find('div.spg-table-wrap');
  // Set through the CSSOM (not markup) so an odd value can never inject other styles.
  if (maxHeight !== undefined) {
    host.style.maxHeight = typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight;
  }
  const toggle = container.querySelector('button.spg-desc-toggle');
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    container.querySelector('.spg-desc')?.toggleAttribute('hidden', !open);
  });
  return {
    host,
    pagerHost: find('div.spg-pager-host'),
    status: find('div.spg-status'),
    pickerColumns,
    groupColumns: options.groupByToggle === true ? dataColumns(options.columns) : null,
    view: createViewSettings(container.querySelector('.spg-root'), options),
    toolbar: /** @type {HTMLElement | null} */ (container.querySelector('div.spg-toolbar')),
    count: container.querySelector('span.spg-count'),
    columnPicker: /** @type {HTMLElement | null} */ (
      container.querySelector('div.spg-toolbar:has(.spg-columns-btn)')
    ),
    summary: /** @type {HTMLElement | null} */ (container.querySelector('div.spg-summary')),
    viewButton: /** @type {HTMLButtonElement | null} */ (
      container.querySelector('button.spg-view-toggle')
    ),
    refreshButton: /** @type {HTMLButtonElement | null} */ (
      container.querySelector('button.spg-refresh')
    ),
    groupToggleButton: /** @type {HTMLButtonElement | null} */ (
      container.querySelector('button.spg-group-all')
    ),
    advancedButton: /** @type {HTMLButtonElement | null} */ (
      container.querySelector('button.spg-advfilter')
    ),
    exportButton: /** @type {HTMLButtonElement | null} */ (
      container.querySelector('button.spg-export')
    ),
    search: /** @type {HTMLInputElement | null} */ (container.querySelector('input.spg-search')),
    searchColumn: /** @type {HTMLSelectElement | null} */ (
      container.querySelector('select.spg-search-column')
    ),
    searchValue: /** @type {HTMLSelectElement | null} */ (
      container.querySelector('select.spg-search-value')
    ),
    searchRange: /** @type {HTMLElement | null} */ (container.querySelector('.spg-search-range')),
  };
}
