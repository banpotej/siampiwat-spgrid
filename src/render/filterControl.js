// @ts-check
import { dataKeys } from '../core/columns.js';
import { normalizeFilter, resolveFilter } from '../core/filter.js';
import { searchColumnChange, syncSearchBox } from './searchBox.js';

/** @typedef {import('../types.js').FilterState} FilterState */

/** Reads and writes the filter and the search column of a grid, and keeps the search box in step. */
export class FilterControl {
  /** @type {ReturnType<typeof import('./toolbar.js').mountShell>} */ #shell;
  /** @type {import('../core/state.js').State<import('../types.js').GridState>} */ #state;

  /**
   * @param {ReturnType<typeof import('./toolbar.js').mountShell>} shell
   * @param {import('../core/state.js').State<import('../types.js').GridState>} state
   */
  constructor(shell, state) {
    this.#shell = shell;
    this.#state = state;
  }

  /** @returns {FilterState | null} A copy of the current filter, or null when nothing is filtered. */
  get() {
    const { filter, searchColumn } = this.#state.get();
    const current = normalizeFilter(filter);
    return current?.search !== undefined && searchColumn ? { ...current, searchColumn } : current;
  }

  /** @returns {string | null} */
  getSearchColumn() {
    return this.#state.get().searchColumn;
  }

  /**
   * @param {string | null} key Data column key, or null to search every column.
   * @throws {RangeError} key is not a data column
   */
  setSearchColumn(key) {
    const change = searchColumnChange(this.#shell, this.#state.get(), key);
    if (!change) return;
    this.#state.set(change);
    this.#syncSearchBox();
  }

  /**
   * Also writes `search` into the search box.
   * @param {FilterState | null} filter
   * @throws {RangeError} a `columnFilters` key is not a column
   */
  set(filter) {
    this.apply(filter);
    if (this.#shell.search) {
      this.#shell.search.value = this.get()?.search ?? '';
      this.#syncSearchBox();
    }
  }

  /**
   * Changes the filter in the state only (the search box is left alone); resets to page 1.
   * @param {FilterState | null} filter
   */
  apply(filter) {
    const { columns, filter: current } = this.#state.get();
    const next = resolveFilter(current, filter, dataKeys(columns));
    if (next !== undefined) this.#state.set({ filter: next, page: 1 });
  }

  /** Swap the search box and the value select for the current search column, and mirror the search into them. */
  #syncSearchBox() {
    syncSearchBox(this.#shell, this.#state.get().columns, this.#state.get().searchColumn);
  }
}
