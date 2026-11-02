// @ts-check
import { normalizeHidden, visibleColumns } from '../core/columnVisibility.js';
import { syncColumnPicker } from './columnPicker.js';
import { loadHidden, saveHidden } from './columnStore.js';
import { syncSearchColumns } from './searchEvents.js';

/** @typedef {import('../types.js').Column} Column */

/**
 * Which columns the user has hidden: validates changes, remembers them in localStorage (when a
 * storage key is given) and keeps the picker's checkboxes and the search column select in step. A hidden
 * column is left out of the global search and the select, but is still sorted and exported.
 */
export class HiddenColumns {
  /** @type {string[]} */ #keys;
  #columns;
  #storageKey;
  #shell;
  #onChange;
  /** @type {string[]} */ #initial;

  /**
   * @param {Pick<import('../types.js').DataGridOptions, 'columns' | 'hiddenColumns' | 'columnStorageKey'>} options
   *   `hiddenColumns` is used when nothing usable is saved under `columnStorageKey`.
   * @param {{ columnPicker: HTMLElement | null, searchColumn: HTMLSelectElement | null }} shell
   * @param {(hidden: string[]) => void} onChange Called with the new hidden keys after each change.
   * @throws {RangeError} `hiddenColumns` names a column that does not exist, or hides every column
   */
  constructor({ columns, hiddenColumns = [], columnStorageKey: storageKey }, shell, onChange) {
    this.#columns = columns;
    this.#storageKey = storageKey;
    this.#shell = shell;
    this.#onChange = onChange;
    this.#initial = normalizeHidden(columns, hiddenColumns);
    this.#keys = loadHidden(storageKey, columns, this.#initial);
    this.#sync();
  }

  /** @returns {string[]} A copy of the hidden keys, in column order. */
  get() {
    return [...this.#keys];
  }

  /**
   * @param {string[]} keys
   * @throws {RangeError} a key is not a data column, or every data column would be hidden
   */
  set(keys) {
    const next = normalizeHidden(this.#columns, keys);
    if (JSON.stringify(next) === JSON.stringify(this.#keys)) return;
    this.#keys = next;
    saveHidden(this.#storageKey, next);
    this.#sync();
    this.#onChange(this.get());
  }

  /** Back to the `hiddenColumns` the grid was created with (what was saved is overwritten). */
  reset() {
    this.set(this.#initial);
  }

  /** Bring the picker's checkboxes and the search column select in step with the hidden keys. */
  #sync() {
    syncColumnPicker(this.#shell.columnPicker, this.#keys);
    syncSearchColumns(this.#shell.searchColumn, this.#keys);
  }

  /**
   * @param {Column[]} columns
   * @returns {Column[]} The columns to render.
   */
  visible(columns) {
    return visibleColumns(columns, this.#keys);
  }
}
