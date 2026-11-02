// @ts-check

/** @typedef {import('../types.js').Column} Column */

/**
 * The key of every column in display order. Pure.
 *
 * @param {Column[]} columns Columns in their original order.
 * @param {string[]} keys The wanted order. Columns it leaves out follow, in their original order.
 * @returns {string[]}
 * @throws {RangeError} a key is not a column
 */
export function normalizeOrder(columns, keys) {
  const all = columns.map((c) => c.key);
  for (const key of keys) {
    if (!all.includes(key)) throw new RangeError(`DataGrid: unknown column "${key}"`);
  }
  const listed = keys.filter((key, i) => keys.indexOf(key) === i);
  return [...listed, ...all.filter((key) => !listed.includes(key))];
}

/**
 * Like `normalizeOrder` for data that came from outside (storage): anything unusable is dropped instead of
 * thrown, so a stale saved order never breaks a grid.
 *
 * @param {Column[]} columns
 * @param {unknown} value
 * @returns {string[]}
 */
export function restoreOrder(columns, value) {
  const all = columns.map((c) => c.key);
  const keys = Array.isArray(value) ? value.filter((key) => all.includes(key)) : [];
  return normalizeOrder(columns, keys);
}

/**
 * Move `key` next to `target`.
 *
 * @param {string[]} order
 * @param {string} key
 * @param {string} target
 * @param {boolean} after Place it after `target` (otherwise before).
 * @returns {string[]} A new array; the same order when either key is unknown or they are the same.
 */
export function moveKey(order, key, target, after) {
  if (key === target || !order.includes(key) || !order.includes(target)) return order;
  const rest = order.filter((k) => k !== key);
  rest.splice(rest.indexOf(target) + (after ? 1 : 0), 0, key);
  return rest;
}

/**
 * @param {Column[]} columns
 * @param {string[]} order Every column key, as returned by `normalizeOrder`.
 * @returns {Column[]} The columns in that order.
 */
export const orderColumns = (columns, order) =>
  order.flatMap((key) => columns.filter((c) => c.key === key));
