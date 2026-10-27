// @ts-check
import { createEmitter } from './core/emitter.js';
import { filterRows, isSameFilter, normalizeFilter } from './core/filter.js';
import { nextDirection, sortRows } from './core/sort.js';
import { createState } from './core/state.js';
import { renderShell } from './render/toolbar.js';
import { renderTable } from './render/table.js';
import './datagrid.css';

/** @typedef {import('./types.js').DataGridOptions} DataGridOptions */
/** @typedef {import('./types.js').Row} Row */
/** @typedef {import('./types.js').SortState} SortState */
/** @typedef {import('./types.js').FilterState} FilterState */
/**
 * @typedef {{
 *   columns: DataGridOptions['columns'],
 *   rows: Row[],
 *   sort: SortState,
 *   filter: FilterState | null,
 * }} GridState
 */

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
  /** @type {HTMLElement | null} */
  #toolbar;
  /** @type {import('./core/state.js').State<GridState>} */
  #state;
  /** @type {() => void} */
  #unsubscribe;
  #events = createEmitter(/** @type {const} */ (['sortChange', 'filterChange']));
  #locale;
  #debounce;
  #labels;
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  #timer;
  /** @type {HTMLElement | null} */
  #thead = null;
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
    this.#debounce = options.searchDebounce ?? DEFAULT_DEBOUNCE;
    this.#labels = { search: 'Search', empty: 'No data', ...options.labels };
    if (options.onSortChange) this.#events.on('sortChange', options.onSortChange);
    if (options.onFilterChange) this.#events.on('filterChange', options.onFilterChange);

    container.innerHTML = renderShell({
      searchable: options.searchable === true,
      searchLabel: this.#labels.search,
    });
    this.#host = /** @type {HTMLElement} */ (container.querySelector('.dg-table-wrap'));
    this.#status = /** @type {HTMLElement} */ (container.querySelector('.dg-status'));
    this.#toolbar = container.querySelector('.dg-toolbar');
    this.#search = container.querySelector('.dg-search');
    this.#toolbar?.addEventListener('input', this.#onInput);

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
   * Also writes `search` into the search box. Global search only looks at the
   * keys of `options.columns`.
   *
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
    this.#bindHeader();
  }

  destroy() {
    this.#destroyed = true;
    clearTimeout(this.#timer);
    this.#timer = undefined;
    this.#unsubscribe();
    this.#unbindHeader();
    this.#toolbar?.removeEventListener('input', this.#onInput);
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

  // One delegated listener on the static toolbar; the table is never touched
  // while the user types, only after the debounce.
  /** @param {Event} e */
  #onInput = (e) => {
    if (this.#destroyed || e.target !== this.#search) return;
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => {
      this.#timer = undefined;
      const columnFilters = this.#state.get().filter?.columnFilters;
      this.#applyFilter({ search: this.#search?.value, columnFilters });
    }, this.#debounce);
  };

  // The table is rebuilt on every render, so the one delegated listener
  // pair is re-attached to the fresh <thead> rather than to each <th>.
  #bindHeader() {
    this.#thead = this.#host.querySelector('thead');
    this.#thead?.addEventListener('click', this.#onHeader);
    this.#thead?.addEventListener('keydown', this.#onHeader);
  }

  #unbindHeader() {
    this.#thead?.removeEventListener('click', this.#onHeader);
    this.#thead?.removeEventListener('keydown', this.#onHeader);
    this.#thead = null;
  }

  /** @param {Event} e */
  #onHeader = (e) => {
    if (e instanceof KeyboardEvent && e.key !== 'Enter' && e.key !== ' ') return;
    const th = e.target instanceof Element ? e.target.closest('th.dg-sortable') : null;
    const key = th instanceof HTMLElement ? th.dataset.key : undefined;
    if (!th || key === undefined) return;
    if (e instanceof KeyboardEvent) e.preventDefault(); // Space must not scroll the page

    const hadFocus = document.activeElement === th;
    const { sort } = this.#state.get();
    const direction = nextDirection(sort?.key === key ? sort.direction : null);
    this.setSort(direction && { key, direction });

    // Re-rendering replaced the header; give keyboard users their place back.
    if (hadFocus) {
      for (const cell of this.#host.querySelectorAll('th.dg-sortable')) {
        if (cell instanceof HTMLElement && cell.dataset.key === key) cell.focus();
      }
    }
  };
}
