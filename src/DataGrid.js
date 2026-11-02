// @ts-check
import { columnOptions, dataKeys, searchKind } from './core/columns.js';
import { normalizeFilter, removeFilterPart, resolveFilter } from './core/filter.js';
import { assertPageSize, clampPage } from './core/paginate.js';
import { normalizeSort } from './core/sort.js';
import { createState } from './core/state.js';
import { bindControls } from './render/controls.js';
import { askConfirm } from './render/confirm.js';
import { createGridEvents, emitChanges } from './render/gridEvents.js';
import { GridRenderer } from './render/gridRenderer.js';
import { ColumnOrder } from './render/columnOrder.js';
import { HiddenColumns } from './render/hiddenColumns.js';
import { loadPageSize } from './render/pageSizeStore.js';
import { loadSort } from './render/sortStore.js';
import { exportExcel } from './render/exportExcel.js';
import { resolveIcons } from './render/icons.js';
import { resolveLabels } from './render/labels.js';
import { syncClearButton } from './render/searchEvents.js';
import { syncSearchValue } from './render/searchValue.js';
import { mountShell } from './render/toolbar.js';
import './datagrid.css';

/** @typedef {import('./types.js').DataGridOptions} DataGridOptions */
/** @typedef {import('./types.js').Row} Row */
/** @typedef {import('./types.js').SortState} SortState */
/** @typedef {import('./types.js').FilterState} FilterState */
/** @typedef {import('./types.js').GridState} GridState */
/** @typedef {import('./types.js').GridEvents} GridEvents */
/** @typedef {import('./types.js').PageResult} PageResult */

const DEFAULT_DEBOUNCE = 200;

export class DataGrid {
  /** @type {HTMLElement} */ #container;
  /** @type {ReturnType<typeof mountShell>} The static shell; only `host` and `pagerHost` content is re-rendered. */
  #shell;
  /** @type {import('./core/state.js').State<GridState>} */ #state;
  /** @type {() => void} */ #unsubscribe;
  /** @type {ReturnType<typeof createGridEvents>} */ #events;
  #locale;
  /** @type {GridRenderer} */ #renderer;
  /** @type {number | null} The `pageSize` option, which `resetView()` goes back to. */
  #initialPageSize;
  /** @type {SortState} The `defaultSort` option, which `resetView()` goes back to. */
  #initialSort;
  /** @type {HiddenColumns} */ #hidden;
  /** @type {ColumnOrder} */ #order;
  #reorderable;
  /** @type {PageResult | null} Last rendered page; null while pagination is off. */
  #paging = null;
  /** @type {Row[]} Rows currently shown (after filter, sort and paging), in display order. */
  #visible = [];
  #unbindControls = () => {};
  #destroyed = false;

  /**
   * @param {HTMLElement} container
   * @param {DataGridOptions} options
   * @throws {RangeError} `pageSize` or an entry of `pageSizeOptions` is not a positive integer
   */
  constructor(container, options) {
    if (!(container instanceof HTMLElement)) {
      throw new TypeError('DataGrid: container must be an HTMLElement');
    }
    if (options.pageSize !== undefined) assertPageSize(options.pageSize);
    options.pageSizeOptions?.forEach(assertPageSize);
    this.#container = container;
    this.#locale = options.locale;
    this.#order = new ColumnOrder(options);
    this.#reorderable = options.reorderableColumns === true;
    this.#initialPageSize = options.pageSize ?? null;
    const sortKeys = dataKeys(options.columns);
    this.#initialSort = normalizeSort(options.defaultSort ?? null, sortKeys);
    const labels = resolveLabels(options.labels);
    const icons = resolveIcons(options.icons);
    this.#events = createGridEvents(options);
    const shell = (this.#shell = mountShell(container, options, labels, icons));
    this.#renderer = new GridRenderer({
      shell,
      labels,
      icons,
      rowKey: options.rowKey,
      locale: options.locale,
      pageSizeOptions: options.pageSizeOptions,
      highlight: options.highlightSearch !== false,
      resizable: options.resizableColumns === true,
      widthStorageKey: options.columnWidthStorageKey,
    });
    this.#hidden = new HiddenColumns(options, shell, (keys) => {
      // A search limited to a column that just got hidden goes back to every visible column.
      if (keys.includes(this.getSearchColumn() ?? '')) this.setSearchColumn(null);
      this.render();
      this.#events.emit('columnsChange', keys);
    });
    this.#unbindControls = bindControls(shell, {
      debounce: options.searchDebounce ?? DEFAULT_DEBOUNCE,
      submit: options.searchButton === true,
      onSearch: (search) =>
        this.#applyFilter({ search, columnFilters: this.#state.get().filter?.columnFilters }),
      onColumn: (key) => this.setSearchColumn(key),
      onExport: () => this.exportExcel(),
      onRefresh: () => this.#events.emit('refresh', undefined),
      onRemoveFilter: (part) => {
        this.setFilter(removeFilterPart(this.getFilter(), part));
        if (part.type === 'search') this.setSearchColumn(null);
      },
      columnPicker: {
        columns: shell.pickerColumns ?? [],
        labels: {
          title: labels.columnSettings,
          apply: labels.apply,
          cancel: labels.cancel,
          sortBy: labels.sortBy,
          noSort: labels.noSort,
          sortDirection: labels.sortDirection,
          ascending: labels.ascending,
          descending: labels.descending,
          columns: labels.columnsSection,
          sort: labels.sortSection,
          display: labels.displaySection,
          stripedRows: labels.stripedRows,
          textWrap: labels.textWrap,
          reset: labels.resetView,
        },
        getState: () => ({
          ...(shell.pickerColumns && { hidden: this.getHiddenColumns(), sort: this.getSort() }),
          view: shell.view?.get(),
        }),
        onApply: ({ hidden, sort, view }) => {
          if (view) shell.view?.apply(view);
          if (hidden !== undefined) this.setHiddenColumns(hidden);
          if (sort !== undefined) this.setSort(sort);
        },
        onReset:
          options.resetButton === true
            ? () =>
                askConfirm(options.confirmReset, labels.confirmReset, {
                  root: shell.host.closest('.dg-root'),
                  title: labels.resetView,
                  ok: labels.confirmOk,
                  cancel: labels.cancel,
                }).then((ok) => ok && this.resetView())
            : undefined,
      },
      pager: this,
      actions: {
        getRows: () => this.#visible,
        getColumns: () => this.#state.get().columns,
        rowKey: options.rowKey,
        emit: (event, payload) => this.#events.emit(event, payload),
      },
    });
    this.#state = createState(
      /** @type {GridState} */ ({
        columns: this.#order.columns(),
        rows: options.rows ?? [],
        sort: loadSort(options.sortStorageKey, sortKeys, this.#initialSort),
        filter: null,
        page: 1,
        pageSize: loadPageSize(options.pageSizeStorageKey, options.pageSize) ?? null,
        searchColumn: null,
      }),
    );
    this.#unsubscribe = this.#state.subscribe((state, prev) => {
      const before = this.#paging;
      this.render();
      const after = this.#paging;
      emitChanges(this.#events, this, { state, prev, before, after });
      // Remember a page that was clamped into range, so it does not spring back later.
      if (after && after.page !== state.page) this.#state.set({ page: after.page });
    });
    this.render();
  }

  /** @param {Row[]} rows */
  setRows(rows) {
    this.#state.set({ rows });
  }

  /** @returns {SortState} A copy of the current sort, or null when unsorted. */
  getSort() {
    const { sort } = this.#state.get();
    return sort && { ...sort };
  }

  /**
   * Resets to page 1.
   * @param {SortState} sort
   * @throws {TypeError} direction is not 'asc' or 'desc'
   * @throws {RangeError} key is not a column
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
    const { filter, searchColumn } = this.#state.get();
    const current = normalizeFilter(filter);
    return current?.search !== undefined && searchColumn ? { ...current, searchColumn } : current;
  }

  /** @returns {string | null} Column the search box is limited to, or null for every column. */
  getSearchColumn() {
    return this.#state.get().searchColumn;
  }

  /**
   * Limit the global search to one column (also moves the select, if rendered). Resets to page 1.
   * @param {string | null} key Data column key, or null to search every column.
   * @throws {RangeError} key is not a data column
   */
  setSearchColumn(key) {
    if (this.#destroyed) return;
    const { columns, searchColumn, filter } = this.#state.get();
    if (key !== null && !dataKeys(columns).includes(key)) {
      throw new RangeError(`DataGrid: unknown column "${key}"`);
    }
    if (this.#shell.searchColumn) this.#shell.searchColumn.value = key ?? '';
    if (key === searchColumn) return;
    // Text typed for one kind of column means nothing for another (a substring, an enum value, a day range): start over.
    const swaps = this.#searchKind(key) !== this.#searchKind(searchColumn);
    const cleared = swaps
      ? resolveFilter(
          filter,
          { search: null, columnFilters: filter?.columnFilters },
          dataKeys(columns),
        )
      : undefined;
    this.#state.set({
      searchColumn: key,
      page: 1,
      ...(cleared !== undefined && { filter: cleared }),
    });
    if (this.#shell.search && cleared !== undefined) this.#shell.search.value = '';
    this.#syncSearchBox();
  }

  /** @param {string | null} key @returns {'enum' | 'date' | 'text'} How the search box looks for this column. */
  #searchKind(key) {
    return searchKind(this.#state.get().columns.find((c) => c.key === key));
  }

  /** @param {string | null} key @returns {{ value: string, label: string }[] | null} Values of an enum column. */
  #enumOptions(key) {
    return columnOptions(this.#state.get().columns.find((c) => c.key === key));
  }

  /** Swap the search box and the value select for the current search column, and mirror the search into them. */
  #syncSearchBox() {
    const { search, searchValue, searchRange } = this.#shell;
    const key = this.#state.get().searchColumn;
    syncSearchValue(
      { input: search, select: searchValue, range: searchRange },
      this.#searchKind(key),
      this.#enumOptions(key),
    );
    if (search) syncClearButton(search);
  }

  /**
   * Also writes `search` into the search box; global search only covers `options.columns` (or `getSearchColumn()`).
   * Resets to page 1.
   * @param {FilterState | null} filter `{ search, columnFilters }` or null to clear.
   * @throws {RangeError} a `columnFilters` key is not a column
   */
  setFilter(filter) {
    if (this.#destroyed) return;
    this.#applyFilter(filter);
    if (this.#shell.search) {
      this.#shell.search.value = this.getFilter()?.search ?? '';
      this.#syncSearchBox();
    }
  }

  /** @returns {number} The page being shown (1 while pagination is off). */
  getPage() {
    return this.#paging?.page ?? 1;
  }

  /**
   * Clamped into range. No-op while pagination is off.
   * @param {number} page 1-based
   */
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

  /** @returns {string[]} The key of every column (action columns too) in display order. */
  getColumnOrder() {
    return this.#order.get();
  }

  /**
   * Show the columns in this order; columns left out follow in their original order. Saved when
   * `columnOrderStorageKey` is set.
   * @param {string[]} keys
   * @throws {RangeError} a key is not a column
   */
  setColumnOrder(keys) {
    if (!this.#destroyed) this.#reorder(() => this.#order.set(keys));
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
    return exportExcel(this.#state.get(), { ...this.#viewOptions, ...options });
  }

  /** Back to the starting view: no search, the `defaultSort` option, the `hiddenColumns` and `pageSize` options, page 1. */
  resetView() {
    if (this.#destroyed) return;
    this.setFilter(null);
    this.setSearchColumn(null);
    this.#state.set({ sort: this.#initialSort, pageSize: this.#initialPageSize, page: 1 });
    this.#hidden.reset();
    this.#reorder(() => this.#order.reset());
  }

  render() {
    if (this.#destroyed) return;
    const state = this.#state.get();
    const { rows, paging } = this.#renderer.render(state, {
      columns: this.#hidden.visible(state.columns),
      hidden: this.#hidden.get(),
      filter: this.getFilter(),
      sort: { getSort: () => this.getSort(), setSort: (sort) => this.setSort(sort) },
      reorder: this.#reorderable
        ? (key, target, after) => this.#reorder(() => this.#order.move(key, target, after))
        : null,
    });
    this.#paging = paging;
    this.#visible = rows;
  }

  destroy() {
    this.#destroyed = true;
    this.#unbindControls();
    this.#unsubscribe();
    this.#renderer.destroy();
    this.#events.clear();
    this.#container.innerHTML = '';
  }

  /** Locale and hidden columns: what the view and the export both depend on besides the state. */
  get #viewOptions() {
    return { locale: this.#locale, hidden: this.#hidden.get() };
  }

  /** @param {() => boolean} change Changes the order; true when it did. */
  #reorder(change) {
    if (!change()) return;
    this.#state.set({ columns: this.#order.columns() });
    this.#events.emit('columnOrderChange', this.#order.get());
  }

  /** @param {FilterState | null} filter */
  #applyFilter(filter) {
    const { columns, filter: current } = this.#state.get();
    const next = resolveFilter(current, filter, dataKeys(columns));
    if (next !== undefined) this.#state.set({ filter: next, page: 1 });
  }
}
