// @ts-check
import { dataKeys } from './core/columns.js';
import { assertPageSize, clampPage } from './core/paginate.js';
import { normalizeSort } from './core/sort.js';
import { changedGroupBy } from './core/group.js';
import { assertOptions } from './render/gridSetup.js';
import { createGridEvents } from './render/gridEvents.js';
import { wireGrid } from './render/gridWiring.js';
import { assertViewFlags } from './render/viewToggles.js';
import './spgrid.css';

/** @typedef {import('./types.js').SortState} SortState */
/** @typedef {import('./types.js').FilterState} FilterState */
/** @typedef {import('./types.js').GridEvents} GridEvents */

export class SPGrid {
  /** @type {import('./core/state.js').State<import('./types.js').GridState>} */ #state;
  /** @type {ReturnType<typeof createGridEvents>} */ #events;
  /** @type {import('./render/gridRenderer.js').GridRenderer} */ #renderer;
  /** @type {import('./render/filterControl.js').FilterControl} */ #filter;
  /** @type {import('./render/hiddenColumns.js').HiddenColumns} */ #hidden;
  /** @type {import('./render/columnOrder.js').ColumnOrder} */ #order;
  /** @type {import('./render/viewToggles.js').ViewSettingsControl} */ #view;
  /** @type {import('./render/selectionControl.js').SelectionControl} */ #selection;
  #reorderable;
  /** @type {import('./types.js').PageResult | null} Last rendered page; null while pagination is off. */
  #paging = null;
  /** @type {import('./types.js').Row[]} Rows currently shown (after filter, sort and paging), in display order. */
  #visible = [];
  /** @type {() => void} */ #destroy;
  /** @type {() => void} */ #reset;
  #destroyed = false;
  /** @type {ReturnType<typeof wireGrid>['exporter']} */ #export;

  /**
   * @param {HTMLElement} container
   * @param {import('./types.js').SPGridOptions} options
   */
  constructor(container, options) {
    assertOptions(container, options);
    this.#reorderable = options.reorderableColumns === true;
    this.#events = createGridEvents(options);
    const shown = { paging: () => this.#paging, visible: () => this.#visible };
    const parts = wireGrid(this, container, options, shown, this.#events);
    ({ state: this.#state, renderer: this.#renderer } = parts);
    ({ filter: this.#filter, hidden: this.#hidden, selection: this.#selection } = parts);
    ({ order: this.#order, view: this.#view, exporter: this.#export } = parts);
    ({ destroy: this.#destroy, reset: this.#reset } = parts);
    this.render();
  }

  /** @param {import('./types.js').Row[]} rows */
  setRows(rows) {
    this.#state.set({ rows, selected: this.#selection.pruned(rows) });
  }

  /** @returns {import('./types.js').Row[]} The selected rows (`selectable` option) in row order; the grid's own row objects. */
  getSelectedRows() {
    return this.#selection.rows();
  }

  /**
   * Select exactly these rows, matched by `rowKey` (else identity); fires `selectionChange` if that changes anything.
   * @param {import('./types.js').Row[]} rows
   * @throws {RangeError} no `selectable` option, or several rows in 'single' mode
   */
  setSelectedRows(rows) {
    if (!this.#destroyed) this.#selection.set(rows);
  }

  /** @returns {SortState} A copy of the current sort, or null when unsorted. */
  getSort() {
    const { sort } = this.#state.get();
    return sort && { ...sort };
  }

  /**
   * Resets to page 1.
   * @param {SortState} sort
   * @throws {TypeError | RangeError} direction is not 'asc' or 'desc', or key is not a column
   */
  setSort(sort) {
    if (this.#destroyed) return;
    const { columns, sort: current } = this.#state.get();
    const next = normalizeSort(sort, dataKeys(columns));
    if (current?.key === next?.key && current?.direction === next?.direction) return;
    this.#state.set({ sort: next, page: 1 });
  }

  /** @returns {FilterState | null} A copy of the current filter, or null when nothing is filtered. */
  getFilter() {
    return this.#filter.get();
  }

  /** @returns {string | null} Column the search box is limited to, or null for every column. */
  getSearchColumn() {
    return this.#filter.getSearchColumn();
  }

  /**
   * Limit the global search to one column (moves the select too); resets to page 1.
   * @param {string | null} key Data column key, or null for every column.
   * @throws {RangeError} key is not a data column
   */
  setSearchColumn(key) {
    if (!this.#destroyed) this.#filter.setSearchColumn(key);
  }

  /**
   * Also writes `search` into the search box (it covers `options.columns` or `getSearchColumn()`); resets to page 1.
   * @param {FilterState | null} filter `{ search, columnFilters }` or null to clear.
   * @throws {RangeError} a `columnFilters` key is not a column
   */
  setFilter(filter) {
    if (!this.#destroyed) this.#filter.set(filter);
  }

  /** @returns {import('./types.js').ConditionGroup | import('./types.js').Condition | null} A copy of the advanced filter, or null. */
  getAdvancedFilter() {
    return this.#filter.getConditions();
  }

  /**
   * Filter by conditions (field + operator + value, AND / OR) on top of the search and column filters; blank values
   * are dropped, `null` clears. Resets to page 1; also applies to `exportExcel()`.
   * @param {import('./types.js').ConditionGroup | import('./types.js').Condition | null} tree
   * @throws {RangeError | TypeError} unknown or action column, an operator the column does not take, a `logic` other than and / or, or a malformed condition
   */
  setAdvancedFilter(tree) {
    if (!this.#destroyed) this.#filter.setConditions(tree);
  }

  /** @returns {number} The page being shown (1 while pagination is off). */
  getPage() {
    return this.#paging?.page ?? 1;
  }

  /** @param {number} page 1-based, clamped into range; no-op while pagination is off. */
  setPage(page) {
    if (this.#destroyed || this.#state.get().pageSize === null) return;
    this.#state.set({ page: clampPage(page, this.#paging?.totalPages ?? 1) });
  }

  /** @returns {number | null} Rows per page, or null while pagination is off. */
  getPageSize() {
    return this.#state.get().pageSize;
  }

  /**
   * Turns pagination on if it was off; resets to page 1.
   * @param {number} pageSize
   * @throws {RangeError} not a positive integer
   */
  setPageSize(pageSize) {
    assertPageSize(pageSize);
    if (this.#destroyed || pageSize === this.#state.get().pageSize) return;
    this.#state.set({ pageSize, page: 1 });
  }

  /** @returns {string[]} Keys of the hidden columns, in column order. */
  getHiddenColumns() {
    return this.#hidden.get();
  }

  /**
   * Hide exactly these data columns (action columns always show); saved when `columnStorageKey` is set.
   * @param {string[]} keys
   * @throws {RangeError} a key is not a data column, or every data column would be hidden
   */
  setHiddenColumns(keys) {
    if (!this.#destroyed) this.#hidden.set(keys);
  }

  /** @returns {string[]} Keys of the columns the rows are grouped by, outermost first; empty while ungrouped. */
  getGroupBy() {
    return [...this.#state.get().groupBy];
  }

  /**
   * Group the rows by these data columns, outermost first (`[]` ungroups). Resets to page 1.
   * @param {string[]} keys
   * @throws {RangeError} a key is not a data column, or is repeated
   */
  setGroupBy(keys) {
    const next = !this.#destroyed && changedGroupBy(this.#state.get(), keys);
    if (next) this.#state.set({ groupBy: next, page: 1 });
  }

  /** @returns {'grid' | 'calendar'} What the grid shows now; always `'grid'` without the `calendar` option. */
  getView() {
    return this.#renderer.view;
  }

  /**
   * Switch between the table and the calendar like the `viewToggle` button; search, filters and sort stay.
   * @param {'grid' | 'calendar'} view
   * @throws {RangeError} unknown, or `'calendar'` without the `calendar` option
   */
  setView(view) {
    if (this.#destroyed || !this.#renderer.setView(view)) return;
    this.render();
    this.#events.emit('viewChange', view);
  }

  /** @returns {import('./calendarTypes.js').CalendarState | null} The open calendar view and day range; null without `calendar`. */
  getCalendarView() {
    return this.#renderer.calendar?.state ?? null;
  }

  /**
   * Open a calendar view and / or day (omitted parts stay); fires `calendarChange` if the range differs.
   * @param {{ view?: import('./calendarTypes.js').CalendarViewName, date?: Date | string | number }} next
   * @throws {RangeError} no `calendar` option, a `view` not in `calendar.views`, or an unreadable `date`
   */
  setCalendarView(next) {
    if (this.#destroyed) return;
    if (!this.#renderer.calendar)
      throw new RangeError('SPGrid: setCalendarView needs the calendar option');
    this.#renderer.calendar.set(next);
    this.render();
  }

  /** @returns {Required<import('./types.js').ViewSettings>} A copy of the look settings now in effect. */
  getViewSettings() {
    return this.#view.all();
  }

  /**
   * Change the look as the settings modal does (no `*Toggle` option needed); omitted settings stay; saved per `*StorageKey`.
   * @param {import('./types.js').ViewSettings} settings
   * @throws {TypeError} `striped` or `wrapped` is not a boolean
   * @throws {RangeError} `gridLines`, `lineStyle` or `freezeColumns` is not an allowed value
   */
  setViewSettings(settings) {
    assertViewFlags(settings);
    if (!this.#destroyed && this.#view.apply(settings)) this.render();
  }

  /** @returns {string[]} The key of every column (action columns too) in display order. */
  getColumnOrder() {
    return this.#order.get();
  }

  /**
   * Show the columns in this order, the rest after them; saved when `columnOrderStorageKey` is set.
   * @param {string[]} keys
   * @throws {RangeError} a key is not a column
   */
  setColumnOrder(keys) {
    if (!this.#destroyed) this.#order.set(keys);
  }

  /**
   * @template {keyof GridEvents} K
   * @param {K} event
   * @param {(payload: GridEvents[K]) => void} fn
   * @returns {() => void} Unsubscribe.
   */
  on(event, fn) {
    return this.#events.on(event, fn);
  }

  /**
   * Downloads the searched, filtered and sorted rows (every page) as .xlsx: data columns, raw values.
   * @param {import('./types.js').ExportOptions} [options]
   * @returns {Blob} The generated file.
   */
  exportExcel(options = {}) {
    return this.#export.exportFile(options);
  }

  /** Back to the starting view: no search, the `defaultSort` option, the `hiddenColumns` and `pageSize` options, page 1. */
  resetView() {
    if (!this.#destroyed) this.#reset();
  }

  render() {
    if (this.#destroyed) return;
    const state = this.#state.get();
    const { rows, paging } = this.#renderer.render(state, {
      columns: this.#hidden.visible(state.columns),
      hidden: this.#hidden.get(),
      filter: this.getFilter(),
      sort: { getSort: () => this.getSort(), setSort: (sort) => this.setSort(sort) },
      reorder: this.#reorderable ? this.#order.move.bind(this.#order) : null,
    });
    this.#paging = paging;
    this.#visible = rows;
  }

  destroy() {
    this.#destroyed = true;
    this.#destroy();
  }
}
