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

/**
 * The fixed set of values of an enum column: its `options`, or the `badges` keys of a `badge` column.
 *
 * @param {Column | undefined} column
 * @returns {{ value: string, label: string }[] | null} null when the column is not an enum (or has no values).
 */
export function columnOptions(column) {
  if (!column || isActionColumn(column)) return null;
  /** @type {{ value: string, label: string }[]} */
  let list = [];
  if (Array.isArray(column.options)) {
    list = column.options.map((o) =>
      typeof o === 'string'
        ? { value: o, label: o }
        : { value: String(o.value), label: o.label ?? String(o.value) },
    );
  } else if (column.type === 'badge' && column.badges) {
    list = Object.entries(column.badges).map(([value, badge]) => ({
      value,
      label: badge.label ?? value,
    }));
  }
  return list.length > 0 ? list : null;
}

/**
 * How the search box looks for a column: a select of its values (`enum`), a from / to pair of days (`date`) or text.
 *
 * @param {Column | undefined} column
 * @returns {'enum' | 'date' | 'text'}
 */
export function searchKind(column) {
  if (columnOptions(column) !== null) return 'enum';
  return column?.type === 'date' && !isActionColumn(column) ? 'date' : 'text';
}
