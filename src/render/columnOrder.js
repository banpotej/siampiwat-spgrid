// @ts-check
import { moveKey, normalizeOrder, orderColumns, restoreOrder } from '../core/columnOrder.js';
import { readJson, writeJson } from '../utils/storage.js';

/** @typedef {import('../types.js').Column} Column */

const PREFIX = 'datagrid:columnOrder:';

/**
 * The order the columns are shown in: validates changes and remembers them in localStorage (when a storage
 * key is given). Every change method returns whether the order actually changed.
 */
export class ColumnOrder {
  #columns;
  #storageKey;
  /** @type {string[]} */ #keys;

  /** @param {Pick<import('../types.js').DataGridOptions, 'columns' | 'columnOrderStorageKey'>} options */
  constructor({ columns, columnOrderStorageKey: storageKey }) {
    this.#columns = columns;
    this.#storageKey = storageKey;
    const saved = storageKey === undefined ? undefined : readJson(PREFIX + storageKey);
    this.#keys = restoreOrder(columns, saved);
  }

  /** @returns {string[]} A copy of the column keys, in display order. */
  get() {
    return [...this.#keys];
  }

  /** @returns {Column[]} The columns, in display order. */
  columns() {
    return orderColumns(this.#columns, this.#keys);
  }

  /**
   * @param {string[]} keys Columns left out follow in their original order.
   * @returns {boolean}
   * @throws {RangeError} a key is not a column
   */
  set(keys) {
    return this.#apply(normalizeOrder(this.#columns, keys));
  }

  /**
   * @param {string} key
   * @param {string} target
   * @param {boolean} after
   * @returns {boolean}
   */
  move(key, target, after) {
    return this.#apply(moveKey(this.#keys, key, target, after));
  }

  /** Back to the order of `options.columns` (what was saved is overwritten). */
  reset() {
    return this.set([]);
  }

  /** @param {string[]} next */
  #apply(next) {
    if (next.join('\n') === this.#keys.join('\n')) return false;
    this.#keys = next;
    if (this.#storageKey !== undefined) writeJson(PREFIX + this.#storageKey, next);
    return true;
  }
}
