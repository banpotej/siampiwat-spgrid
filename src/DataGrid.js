// @ts-check
import { createState } from './core/state.js';
import { nextDirection, sortRows } from './core/sort.js';
import { renderTable } from './render/table.js';
import './datagrid.css';

/** @typedef {import('./types.js').DataGridOptions} DataGridOptions */
/** @typedef {import('./types.js').Row} Row */
/** @typedef {import('./types.js').SortState} SortState */
/** @typedef {{ columns: DataGridOptions['columns'], rows: Row[], sort: SortState }} GridState */

export class DataGrid {
  /** @type {HTMLElement} */
  #container;
  /** @type {import('./core/state.js').State<GridState>} */
  #state;
  /** @type {() => void} */
  #unsubscribe;
  /** @type {string | undefined} */
  #locale;
  /** @type {Set<(sort: SortState) => void>} */
  #sortListeners = new Set();
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
    if (options.onSortChange) this.#sortListeners.add(options.onSortChange);
    this.#state = createState(
      /** @type {GridState} */ ({ columns: options.columns, rows: options.rows ?? [], sort: null }),
    );
    this.#unsubscribe = this.#state.subscribe((state, prev) => {
      this.render();
      if (state.sort !== prev.sort) this.#emitSort(state.sort);
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

  /**
   * @param {'sortChange'} event
   * @param {(sort: SortState) => void} fn
   * @returns {() => void} Unsubscribe.
   */
  on(event, fn) {
    if (event !== 'sortChange') throw new RangeError(`DataGrid: unknown event "${event}"`);
    this.#sortListeners.add(fn);
    return () => {
      this.#sortListeners.delete(fn);
    };
  }

  render() {
    if (this.#destroyed) return;
    const { columns, rows, sort } = this.#state.get();
    this.#unbindHeader();
    const visible = sortRows(rows, sort, { locale: this.#locale });
    this.#container.innerHTML = renderTable(columns, visible, sort);
    this.#bindHeader();
  }

  destroy() {
    this.#destroyed = true;
    this.#unsubscribe();
    this.#unbindHeader();
    this.#sortListeners.clear();
    this.#container.innerHTML = '';
  }

  /** @param {SortState} sort */
  #emitSort(sort) {
    const payload = sort && { ...sort };
    for (const fn of [...this.#sortListeners]) fn(payload);
  }

  // The table is rebuilt on every render, so the one delegated listener
  // pair is re-attached to the fresh <thead> rather than to each <th>.
  #bindHeader() {
    this.#thead = this.#container.querySelector('thead');
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
      const cells = this.#container.querySelectorAll('th.dg-sortable');
      for (const cell of cells) {
        if (cell instanceof HTMLElement && cell.dataset.key === key) cell.focus();
      }
    }
  };
}
