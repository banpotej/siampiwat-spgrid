// @ts-check
import { createEmitter } from './core/emitter.js';
import { filterRows, isSameFilter, normalizeFilter } from './core/filter.js';
import { sortRows } from './core/sort.js';
import { createState } from './core/state.js';
import { bindHeaderEvents } from './render/headerEvents.js';
import { bindSearchEvents } from './render/searchEvents.js';
import { renderShell } from './render/toolbar.js';
import { renderTable } from './render/table.js';
import './datagrid.css';

/** @typedef {import('./types.js').DataGridOptions} DataGridOptions */
/** @typedef {import('./types.js').Row} Row */
/** @typedef {import('./types.js').SortState} SortState */
/** @typedef {import('./types.js').FilterState} FilterState */
/** @typedef {import('./types.js').GridState} GridState */

const DEFAULT_DEBOUNCE = 200;

export class DataGrid {
  /** @type {HTMLElement} */
  #container;
  /** @type {HTMLElement} Where the table is (re)rendered; the rest of the shell is static. */
  #host;
  /** @type {HTMLElement} */
  #status;
  /** @type {HTMLInputElement | null} */
  #search;
  #unbindSearch = () => {};
  /** @type {import('./core/state.js').State<GridState>} */
  #state;
  /** @type {() => void} */
  #unsubscribe;
  #events = createEmitter(/** @type {const} */ (['sortChange', 'filterChange']));
  #locale;
  #labels;
  #unbindHeader = () => {};
  #destroyed = false;

  /**
   * @param {HTMLElement} container
   * @param {DataGridOptions} options
   */
  constructor(container, options) {
    if (!(container instanceof HTMLElement)) {
      throw new TypeError('DataGrid: container must be an HTMLElement');
    }
    this.#container = container;
    this.#locale = options.locale;
    this.#labels = { search: 'Search', empty: 'No data', ...options.labels };
    if (options.onSortChange) this.#events.on('sortChange', options.onSortChange);
    if (options.onFilterChange) this.#events.on('filterChange', options.onFilterChange);

    container.innerHTML = renderShell({
      searchable: options.searchable === true,
      searchLabel: this.#labels.search,
    });
    this.#host = /** @type {HTMLElement} */ (container.querySelector('div.dg-table-wrap'));
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

    this.#state = createState(
      /** @type {GridState} */ ({
        columns: options.columns,
        rows: options.rows ?? [],
        sort: null,
        filter: null,
      }),
    );
    this.#unsubscribe = this.#state.subscribe((state, prev) => {
      this.render();
      if (state.sort !== prev.sort) this.#events.emit('sortChange', this.getSort());
      if (state.filter !== prev.filter) this.#events.emit('filterChange', this.getFilter());
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
   * @param {SortState} sort
   * @throws {TypeError} direction is not 'asc' or 'desc'
   * @throws {RangeError} key is not a column
   */
  setSort(sort) {
    if (this.#destroyed) return;
    let next = null;
    if (sort) {
      if (sort.direction !== 'asc' && sort.direction !== 'desc') {
        throw new TypeError(`DataGrid: invalid sort direction "${sort.direction}"`);
      }
      if (!this.#state.get().columns.some((c) => c.key === sort.key)) {
        throw new RangeError(`DataGrid: unknown column "${sort.key}"`);
      }
      next = { key: sort.key, direction: sort.direction };
    }
    const current = this.#state.get().sort;
    if (current?.key === next?.key && current?.direction === next?.direction) return;
    this.#state.set({ sort: next });
  }

  /** @returns {FilterState | null} A copy of the current filter, or null when nothing is filtered. */
  getFilter() {
    return normalizeFilter(this.#state.get().filter);
  }

  /**
   * Also writes `search` into the search box; global search only covers `options.columns`.
   * @param {FilterState | null} filter `{ search, columnFilters }` or null to clear.
   * @throws {RangeError} a `columnFilters` key is not a column
   */
  setFilter(filter) {
    if (this.#destroyed) return;
    this.#applyFilter(filter);
    if (this.#search) this.#search.value = this.getFilter()?.search ?? '';
  }

  /**
   * @overload
   * @param {'sortChange'} event
   * @param {(sort: SortState) => void} fn
   * @returns {() => void} Unsubscribe.
   */
  /**
   * @overload
   * @param {'filterChange'} event
   * @param {(filter: FilterState | null) => void} fn
   * @returns {() => void} Unsubscribe.
   */
  /**
   * @param {'sortChange' | 'filterChange'} event
   * @param {(payload: any) => void} fn
   * @returns {() => void}
   */
  on(event, fn) {
    return this.#events.on(event, fn);
  }

  render() {
    if (this.#destroyed) return;
    const { columns, rows, sort, filter } = this.#state.get();
    this.#unbindHeader();
    const options = { locale: this.#locale };
    const searchColumns = columns.map((c) => c.key);
    const visible = sortRows(
      filterRows(rows, { ...filter, columns: searchColumns }, options),
      sort,
      options,
    );
    this.#host.innerHTML = renderTable(columns, visible, sort, this.#labels.empty);
    this.#status.textContent = visible.length === 0 ? this.#labels.empty : '';
    this.#unbindHeader = bindHeaderEvents(this.#host, {
      getSort: () => this.getSort(),
      setSort: (sort) => this.setSort(sort),
    });
  }

  destroy() {
    this.#destroyed = true;
    this.#unbindSearch();
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
    this.#state.set({ filter: next });
  }
}
