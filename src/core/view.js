// @ts-check
import { dataKeys, searchKind } from './columns.js';
import { filterRows } from './filter.js';
import { groupOrder } from './group.js';
import { paginate } from './paginate.js';
import { sortRows } from './sort.js';

/** @typedef {import('../types.js').GridState} GridState */
/** @typedef {import('../types.js').Row} Row */
/** @typedef {import('../types.js').PageResult} PageResult */

/**
 * The rows a grid shows for `state`: filter -> sort -> group -> paginate. Pure.
 * Global search only looks at the keys of the data columns that are not in `options.hidden` (not action columns),
 * or just `searchColumn` (an enum column's search matches whole values, a date column's is a day range). `paging` is null
 * (and `rows` is everything) while pagination is off (`pageSize` null).
 *
 * @param {Pick<GridState, 'columns' | 'rows' | 'sort' | 'filter' | 'page' | 'pageSize'> & { searchColumn?: string | null, groupBy?: string[] }} state
 *   `groupBy`: group columns (outermost first): the sorted rows are put in group order before paging.
 * @param {{ locale?: string, hidden?: string[] }} [options] `hidden`: keys of hidden columns, left out of the global search.
 * @returns {{ rows: Row[], paging: PageResult | null, total: number }} `total`: rows left after filtering, before paging.
 */
export function computeView(state, options = {}) {
  const { columns, rows, sort, filter, page, pageSize, searchColumn, groupBy = [] } = state;
  const { hidden = [] } = options;
  const searchColumns = searchColumn
    ? [searchColumn]
    : dataKeys(columns).filter((key) => !hidden.includes(key));
  // A search limited to an enum column picks one of its values (the whole cell); on a date column it is a day range.
  const kind = searchColumn ? searchKind(columns.find((c) => c.key === searchColumn)) : 'text';
  const filtered = filterRows(
    rows,
    { ...filter, columns: searchColumns, exact: kind === 'enum', range: kind === 'date' },
    options,
  );
  const sorted = groupOrder(sortRows(filtered, sort, options), groupBy, sort, options);
  if (pageSize === null) return { rows: sorted, paging: null, total: sorted.length };
  const paging = paginate(sorted, { page, pageSize });
  return { rows: paging.rows, paging, total: paging.totalRows };
}
