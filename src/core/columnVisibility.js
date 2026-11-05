// @ts-check
import { dataKeys, isActionColumn } from './columns.js';

/** @typedef {import('../types.js').Column} Column */

/**
 * The hidden keys in column order, without duplicates. Pure.
 *
 * @param {Column[]} columns
 * @param {string[]} keys Data column keys to hide.
 * @returns {string[]}
 * @throws {RangeError} a key is not a data column, or every data column would be hidden
 */
export function normalizeHidden(columns, keys) {
  const data = dataKeys(columns);
  for (const key of keys) {
    if (!data.includes(key)) throw new RangeError(`SPGrid: unknown column "${key}"`);
  }
  const hidden = data.filter((key) => keys.includes(key));
  if (data.length > 0 && hidden.length === data.length) {
    throw new RangeError('SPGrid: at least one column must stay visible');
  }
  return hidden;
}

/**
 * Like `normalizeHidden` for data that came from outside (storage): anything unusable is dropped
 * instead of thrown, so stale saved keys never break a grid.
 *
 * @param {Column[]} columns
 * @param {unknown} value
 * @returns {string[]}
 */
export function restoreHidden(columns, value) {
  if (!Array.isArray(value)) return [];
  const data = dataKeys(columns);
  try {
    return normalizeHidden(
      columns,
      value.filter((key) => data.includes(key)),
    );
  } catch {
    return [];
  }
}

/**
 * @param {Column[]} columns
 * @param {string[]} hidden
 * @returns {Column[]} The columns to show; action columns are never hidden.
 */
export const visibleColumns = (columns, hidden) =>
  hidden.length === 0
    ? columns
    : columns.filter((c) => isActionColumn(c) || !hidden.includes(c.key));
