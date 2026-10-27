// @ts-check

/** @typedef {import('../types.js').Column} Column */

/**
 * @param {Column} column
 * @returns {boolean} True for an action column (its `key` is only an identifier).
 */
export const isActionColumn = (column) => Array.isArray(column.actions);

/**
 * Keys of the columns that show row data: the only ones that can be sorted, searched or filtered.
 *
 * @param {Column[]} columns
 * @returns {string[]}
 */
export const dataKeys = (columns) => columns.filter((c) => !isActionColumn(c)).map((c) => c.key);
