// @ts-check
import { dataKeys } from './columns.js';
import { sortRows } from './sort.js';

/** @typedef {import('../types.js').Row} Row */
/** @typedef {import('../types.js').Column} Column */

/**
 * @typedef {object} GroupHeader
 * @property {'group'} type
 * @property {number} level 0 for the outermost group.
 * @property {string} column Key of the column this level groups by.
 * @property {string} id Identifies the group (its path of values); stable across renders.
 * @property {Row} first The group's first row; its cell for `column` is what the header shows.
 * @property {number} count Rows of the group in the list.
 * @property {Row[]} rows The rows of the group in the list, in order.
 */

/**
 * @typedef {object} GroupRow
 * @property {'row'} type
 * @property {Row} row
 * @property {number} index Position of `row` in the list given to `groupItems`.
 */

/**
 * @param {Column[]} columns
 * @param {unknown} keys
 * @returns {string[]} A copy of `keys`.
 * @throws {TypeError} `keys` is not an array of strings
 * @throws {RangeError} a key is not a data column, or is repeated
 */
export function normalizeGroupBy(columns, keys) {
  if (!Array.isArray(keys) || keys.some((key) => typeof key !== 'string')) {
    throw new TypeError('SPGrid: groupBy must be an array of column keys');
  }
  const data = dataKeys(columns);
  for (const key of keys) {
    if (!data.includes(key)) throw new RangeError(`SPGrid: unknown column "${key}"`);
  }
  if (new Set(keys).size !== keys.length) throw new RangeError('SPGrid: repeated groupBy column');
  return [...keys];
}

/**
 * @param {{ columns: Column[], groupBy: string[] }} state
 * @param {unknown} keys New group columns.
 * @returns {string[] | null} `keys` checked and copied, or null when they are what the state already has.
 * @throws {TypeError} `keys` is not an array of strings
 * @throws {RangeError} a key is not a data column, or is repeated
 */
export function changedGroupBy({ columns, groupBy }, keys) {
  const next = normalizeGroupBy(columns, keys);
  return JSON.stringify(next) === JSON.stringify(groupBy) ? null : next;
}

/**
 * Put the rows in group order: by the first group column, then the second, and so on; rows of one group keep
 * the order they had (the user's sort). A group column the sort is on follows the sort's direction, others go
 * ascending. Pure: returns a new array.
 *
 * @param {Row[]} rows Already sorted.
 * @param {string[]} keys Group columns, outermost first.
 * @param {import('../types.js').SortState} sort
 * @param {{ locale?: string }} [options]
 * @returns {Row[]}
 */
export function groupOrder(rows, keys, sort, options) {
  let out = rows;
  // sortRows is stable: sorting by the innermost column first and the outermost last leaves the rows grouped.
  for (const key of [...keys].reverse()) {
    const direction = sort?.key === key ? sort.direction : 'asc';
    out = sortRows(out, { key, direction }, options);
  }
  return out;
}

/** @param {unknown} value @returns {string} Equal for values that group together (blank values, dates by time). */
const groupValue = (value) =>
  value === null || value === undefined || (typeof value === 'number' && Number.isNaN(value))
    ? 'blank'
    : `${typeof value}:${value instanceof Date ? value.getTime() : String(value)}`;

/**
 * Walk rows that are in group order and list a header before the first row of each group, outer groups first.
 * A group whose id is in `collapsed` hides everything inside it (its rows and its inner groups). Pure.
 *
 * @param {Row[]} rows In group order (see `groupOrder`).
 * @param {string[]} keys Group columns, outermost first; none gives just the rows.
 * @param {ReadonlySet<string>} [collapsed] Ids of the collapsed groups.
 * @returns {(GroupHeader | GroupRow)[]}
 */
export function groupItems(rows, keys, collapsed = new Set()) {
  /** @type {(GroupHeader | GroupRow)[]} */
  const items = [];
  /** @type {GroupHeader[]} */
  const open = [];
  /** Level of the outermost collapsed group around the current row; Infinity when none. */
  let hiddenFrom = Infinity;
  rows.forEach((row, index) => {
    let path = '';
    let level = 0;
    // Find the first level whose group differs from the open one; from there on new groups start.
    for (; level < keys.length; level += 1) {
      path += `${JSON.stringify(keys[level])}=${JSON.stringify(groupValue(row[keys[level]]))};`;
      if (open[level]?.id !== path) break;
    }
    for (let l = level; l < keys.length; l += 1) {
      if (l > level)
        path += `${JSON.stringify(keys[l])}=${JSON.stringify(groupValue(row[keys[l]]))};`;
      /** @type {GroupHeader} */
      const header = {
        type: 'group',
        level: l,
        column: keys[l],
        id: path,
        first: row,
        count: 0,
        rows: [],
      };
      open[l] = header;
      if (l <= hiddenFrom) {
        hiddenFrom = collapsed.has(path) ? l : Infinity;
        items.push(header);
      }
    }
    open.length = keys.length;
    for (const header of open) {
      header.count += 1;
      header.rows.push(row);
    }
    if (hiddenFrom === Infinity) items.push({ type: 'row', row, index });
  });
  return items;
}
