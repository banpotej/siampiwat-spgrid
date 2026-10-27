// @ts-check
import { createEmitter } from './core/emitter.js';
import { isSameFilter, normalizeFilter } from './core/filter.js';
import { assertPageSize, clampPage } from './core/paginate.js';
import { normalizeSort } from './core/sort.js';
import { createState } from './core/state.js';
import { computeView } from './core/view.js';
import { bindHeaderEvents } from './render/headerEvents.js';
import { resolveLabels } from './render/labels.js';
import { renderPager } from './render/pager.js';
import { bindPagerEvents } from './render/pagerEvents.js';
import { bindSearchEvents } from './render/searchEvents.js';
import { renderTable } from './render/table.js';
import { renderShell } from './render/toolbar.js';
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
  /** @type {HTMLElement} */
  #container;
  /** @type {HTMLElement} Where the table is (re)rendered; the rest of the shell is static. */
  #host;
  /** @type {HTMLElement} Pager content is swapped here; the element itself persists. */
  #pagerHost;
  /** @type {HTMLElement} */
  #status;
  /** @type {HTMLInputElement | null} */
  #search;
  /** @type {import('./core/state.js').State<GridState>} */
  #state;
  /** @type {() => void} */
  #unsubscribe;
  #events = createEmitter(/** @type {const} */ (['sortChange', 'filterChange', 'pageChange']));
  #locale;
  #labels;
  #pageSizeOptions;
  /** @type {PageResult | null} Last rendered page; null while pagination is off. */
  #paging = null;
  #pagerHtml = '';
  #unbindSearch = () => {};
  #unbindPager = () => {};
  #unbindHeader = () => {};
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
    this.#labels = resolveLabels(options.labels);
    this.#pageSizeOptions = options.pageSizeOptions ?? [];
    if (options.onSortChange) this.#events.on('sortChange', options.onSortChange);
    if (options.onFilterChange) this.#events.on('filterChange', options.onFilterChange);
    if (options.onPageChange) this.#events.on('pageChange', options.onPageChange);

    container.innerHTML = renderShell({
      searchable: options.searchable === true,
      searchLabel: this.#labels.search,
    });
    this.#host = /** @type {HTMLElement} */ (container.querySelector('div.dg-table-wrap'));
    this.#pagerHost = /** @type {HTMLElement} */ (container.querySelector('div.dg-pager-host'));
    this.#status = /** @type {HTMLElement} */ (container.querySelector('div.dg-status'));
    this.#search = /** @type {HTMLInputElement | null} */ (
      container.querySelector('input.dg-search')
    );
    const toolbar = /** @type {HTMLElement | null} */ (container.querySelector('div.dg-toolbar'));
    if (toolbar && this.#search) {
      this.#unbindSearch = bindSearchEvents(toolbar, this.#search, {
        debounce: options.searchDebounce ?? DEFAULT_DEBOUNCE,
        onSearch: (search) =>
          this.#applyFilter({ search, columnFilters: this.#state.get().filter?.columnFilters }),
      });
    }
    this.#unbindPager = bindPagerEvents(this.#pagerHost, {
      getPage: () => this.getPage(),
      setPage: (page) => this.setPage(page),
      setPageSize: (size) => this.setPageSize(size),
    });

    this.#state = createState(
      /** @type {GridState} */ ({
        columns: options.columns,
        rows: options.rows ?? [],
        sort: null,
        filter: null,
        page: 1,
        pageSize: options.pageSize ?? null,
      }),
    );
    this.#unsubscribe = this.#state.subscribe((state, prev) => {
      const before = this.#paging;
      this.render();
      const after = this.#paging;
      if (state.sort !== prev.sort) this.#events.emit('sortChange', this.getSort());
      if (state.filter !== prev.filter) this.#events.emit('filterChange', this.getFilter());
      if (after && (after.page !== before?.page || after.pageSize !== before?.pageSize)) {
        this.#events.emit('pageChange', { page: after.page, pageSize: after.pageSize });
      }
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
    const next = normalizeSort(
      sort,
      columns.map((c) => c.key),
    );
    if (current?.key === next?.key && current?.direction === next?.direction) return;
    this.#state.set({ sort: next, page: 1 });
  }

  /** @returns {FilterState | null} A copy of the current filter, or null when nothing is filtered. */
  getFilter() {
    return normalizeFilter(this.#state.get().filter);
  }

  /**
   * Also writes `search` into the search box; global search only covers `options.columns`.
   * Resets to page 1.
   * @param {FilterState | null} filter `{ search, columnFilters }` or null to clear.
   * @throws {RangeError} a `columnFilters` key is not a column
   */
  setFilter(filter) {
    if (this.#destroyed) return;
    this.#applyFilter(filter);
    if (this.#search) this.#search.value = this.getFilter()?.search ?? '';
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

  /**
   * @template {keyof GridEvents} K
   * @param {K} event
   * @param {(payload: GridEvents[K]) => void} fn
   * @returns {() => void} Unsubscribe.
   */
  on(event, fn) {
    return this.#events.on(event, fn);
  }

  render() {
    if (this.#destroyed) return;
    const state = this.#state.get();
    this.#unbindHeader();
    const { rows, paging } = computeView(state, { locale: this.#locale });
    this.#paging = paging;
    this.#host.innerHTML = renderTable(state.columns, rows, state.sort, this.#labels.empty);
    this.#status.textContent = rows.length === 0 ? this.#labels.empty : '';
    this.#unbindHeader = bindHeaderEvents(this.#host, {
      getSort: () => this.getSort(),
      setSort: (sort) => this.setSort(sort),
    });
    // Only touch the pager when it changed, so focus on it survives unrelated renders.
    const pagerHtml = paging
      ? renderPager({ paging, labels: this.#labels, pageSizeOptions: this.#pageSizeOptions })
      : '';
    if (pagerHtml !== this.#pagerHtml) this.#pagerHost.innerHTML = this.#pagerHtml = pagerHtml;
  }

  destroy() {
    this.#destroyed = true;
    this.#unbindSearch();
    this.#unbindPager();
    this.#unsubscribe();
    this.#unbindHeader();
    this.#events.clear();
    this.#container.innerHTML = '';
  }

  /** @param {FilterState | null} filter */
  #applyFilter(filter) {
    const next = normalizeFilter(filter);
    const { columns, filter: current } = this.#state.get();
    for (const key of Object.keys(next?.columnFilters ?? {})) {
      if (!columns.some((c) => c.key === key)) {
        throw new RangeError(`DataGrid: unknown column "${key}"`);
      }
    }
    if (isSameFilter(current, next)) return;
    this.#state.set({ filter: next, page: 1 });
  }
}
