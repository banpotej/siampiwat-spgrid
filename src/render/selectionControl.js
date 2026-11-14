// @ts-check
import { changeSelection, pruneSelection, selectedRows, selectionKey } from '../core/selection.js';

/** @typedef {import('../types.js').Row} Row */

/** Reads and writes which rows of a grid are selected (`selectable` option); the keys live in the grid's state. */
export class SelectionControl {
  /** @type {import('../core/state.js').State<import('../types.js').GridState>} */ #state;
  #mode;
  #rowKey;

  /**
   * @param {import('../core/state.js').State<import('../types.js').GridState>} state
   * @param {import('../core/selection.js').SelectMode | null} mode Null: selection is off.
   * @param {string} [rowKey] The `rowKey` option; without it rows are told apart by identity.
   */
  constructor(state, mode, rowKey) {
    this.#state = state;
    this.#mode = mode;
    this.#rowKey = rowKey;
  }

  /** @returns {Row[]} The selected rows (the grid's own row objects), in the order of the rows set; [] when off. */
  rows() {
    const { rows, selected } = this.#state.get();
    return selectedRows(rows, selected, this.#rowKey);
  }

  /**
   * Select exactly these rows. A row is matched to the grid's rows by `rowKey` (so `{ id: 3 }` will do), or by identity
   * without one; rows the grid does not have are ignored.
   *
   * @param {Row[]} rows
   * @throws {RangeError} selection is off, or more than one row is given in 'single' mode
   */
  set(rows) {
    if (!this.#mode) throw new RangeError('SPGrid: setSelectedRows needs the selectable option');
    const { rows: all, selected } = this.#state.get();
    const wanted = new Set(rows.map((row) => selectionKey(row, this.#rowKey)));
    const next = new Set(
      all.map((row) => selectionKey(row, this.#rowKey)).filter((key) => wanted.has(key)),
    );
    if (this.#mode === 'single' && next.size > 1) {
      throw new RangeError("SPGrid: selectable 'single' takes at most one row");
    }
    if (next.size !== selected.size || [...next].some((key) => !selected.has(key))) {
      this.#state.set({ selected: next });
    }
  }

  /**
   * Select (`on`) or deselect rows, as a click on their checkboxes does.
   * @param {Row[]} rows
   * @param {boolean} on
   */
  change(rows, on) {
    if (!this.#mode) return;
    const { selected } = this.#state.get();
    const next = changeSelection(selected, rows, { on, mode: this.#mode, rowKey: this.#rowKey });
    this.#state.set({ selected: next });
  }

  /**
   * @param {Row[]} rows The rows about to replace the grid's rows.
   * @returns {ReadonlySet<unknown>} The selection with the rows that are gone dropped.
   */
  pruned(rows) {
    return pruneSelection(this.#state.get().selected, rows, this.#rowKey);
  }
}
