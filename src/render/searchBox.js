// @ts-check
import { columnOptions, dataKeys, searchKind } from '../core/columns.js';
import { resolveFilter } from '../core/filter.js';
import { syncClearButton } from './searchEvents.js';
import { syncSearchValue } from './searchValue.js';

/**
 * Swap the search box, the value select and the date range for the current search column, and mirror the
 * search into them.
 *
 * @param {ReturnType<typeof import('./toolbar.js').mountShell>} shell
 * @param {import('../types.js').Column[]} columns
 * @param {string | null} key The search column, or null for every column.
 */
export function syncSearchBox(shell, columns, key) {
  const { search, searchValue, searchRange } = shell;
  const column = columns.find((c) => c.key === key);
  syncSearchValue(
    { input: search, select: searchValue, range: searchRange },
    searchKind(column),
    columnOptions(column),
  );
  if (search) syncClearButton(search);
}

/**
 * Text typed for one kind of column means nothing for another (a substring, an enum value, a day range), so a
 * change of kind starts the search over.
 *
 * @param {Pick<import('../types.js').GridState, 'columns' | 'searchColumn' | 'filter'>} state
 * @param {string | null} key The new search column.
 * @returns {import('../types.js').FilterState | null | undefined} The filter without its search, or undefined to keep it.
 */
export function clearedSearch({ columns, searchColumn, filter }, key) {
  const kind = (/** @type {string | null} */ k) => searchKind(columns.find((c) => c.key === k));
  if (kind(key) === kind(searchColumn)) return undefined;
  return resolveFilter(
    filter,
    { search: null, columnFilters: filter?.columnFilters },
    dataKeys(columns),
  );
}
