// @ts-check
import { dataKeys } from './columns.js';
import { filterRows } from './filter.js';
import { paginate } from './paginate.js';
import { sortRows } from './sort.js';

/** @typedef {import('../types.js').GridState} GridState */
/** @typedef {import('../types.js').Row} Row */
/** @typedef {import('../types.js').PageResult} PageResult */

/**
 * The rows a grid shows for `state`: filter -> sort -> paginate. Pure.
 * Global search only looks at the keys of the data columns (not action columns). `paging` is null
 * (and `rows` is everything) while pagination is off (`pageSize` null).
 *
 * @param {Pick<GridState, 'columns' | 'rows' | 'sort' | 'filter' | 'page' | 'pageSize'>} state
 * @param {{ locale?: string }} [options]
 * @returns {{ rows: Row[], paging: PageResult | null }}
 */
export function computeView(state, options = {}) {
  const { columns, rows, sort, filter, page, pageSize } = state;
  const searchColumns = dataKeys(columns);
  const filtered = filterRows(rows, { ...filter, columns: searchColumns }, options);
  const sorted = sortRows(filtered, sort, options);
  if (pageSize === null) return { rows: sorted, paging: null };
  const paging = paginate(sorted, { page, pageSize });
  return { rows: paging.rows, paging };
}
