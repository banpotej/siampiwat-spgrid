// @ts-check

/** @typedef {import('../types.js').Row} Row */

/** @typedef {'single' | 'multiple'} SelectMode */

/**
 * @param {unknown} value The `selectable` option.
 * @returns {SelectMode | null} How many rows may be selected; null while selection is off.
 * @throws {RangeError} not a boolean, 'single' or 'multiple'
 */
export function normalizeSelectable(value) {
  if (value === undefined || value === false) return null;
  if (value === true || value === 'multiple') return 'multiple';
  if (value === 'single') return 'single';
  throw new RangeError(`SPGrid: selectable must be a boolean, 'single' or 'multiple'`);
}

/**
 * What identifies a row in the selection: its `rowKey` value, or the row object itself when there is no `rowKey` (or
 * the row has no value there).
 *
 * @param {Row} row
 * @param {string} [rowKey]
 * @returns {unknown}
 */
export function selectionKey(row, rowKey) {
  const key = rowKey === undefined ? undefined : row[rowKey];
  return key === undefined || key === null ? row : key;
}

/**
 * @param {Row[]} rows
 * @param {ReadonlySet<unknown>} selected
 * @param {string} [rowKey]
 * @returns {Row[]} The selected rows, in the order of `rows`.
 */
export function selectedRows(rows, selected, rowKey) {
  return selected.size === 0 ? [] : rows.filter((row) => selected.has(selectionKey(row, rowKey)));
}

/**
 * Drop what is no longer among `rows`. Pure.
 *
 * @param {ReadonlySet<unknown>} selected
 * @param {Row[]} rows
 * @param {string} [rowKey]
 * @returns {ReadonlySet<unknown>} `selected` itself when nothing was dropped, else a new set.
 */
export function pruneSelection(selected, rows, rowKey) {
  if (selected.size === 0) return selected;
  const next = new Set(selectedRows(rows, selected, rowKey).map((r) => selectionKey(r, rowKey)));
  return next.size === selected.size ? selected : next;
}

/**
 * Select or deselect `rows`. In 'single' mode selecting replaces the selection with the last row given. Pure.
 *
 * @param {ReadonlySet<unknown>} selected
 * @param {Row[]} rows
 * @param {{ on: boolean, mode: SelectMode, rowKey?: string }} change
 * @returns {ReadonlySet<unknown>} `selected` itself when nothing changed, else a new set.
 */
export function changeSelection(selected, rows, { on, mode, rowKey }) {
  const keys = rows.map((row) => selectionKey(row, rowKey));
  const next = new Set(mode === 'single' && on ? [] : selected);
  for (const key of mode === 'single' && on ? keys.slice(-1) : keys) {
    if (on) next.add(key);
    else next.delete(key);
  }
  const same = next.size === selected.size && [...next].every((key) => selected.has(key));
  return same ? selected : next;
}

/**
 * @param {Row[]} rows The rows on the page.
 * @param {ReadonlySet<unknown>} selected
 * @param {string} [rowKey]
 * @returns {'none' | 'some' | 'all'} How much of `rows` is selected (`none` for no rows).
 */
export function selectionState(rows, selected, rowKey) {
  const count = rows.filter((row) => selected.has(selectionKey(row, rowKey))).length;
  if (count === 0) return 'none';
  return count === rows.length ? 'all' : 'some';
}
