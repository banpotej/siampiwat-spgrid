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

/**
 * Move the search box's column select to `key` and work out what the grid's state must change to limit the search
 * to it (page 1, and a cleared search when the kind of column changed).
 *
 * @param {ReturnType<typeof import('./toolbar.js').mountShell>} shell
 * @param {Pick<import('../types.js').GridState, 'columns' | 'searchColumn' | 'filter'>} state
 * @param {string | null} key Data column key, or null for every column.
 * @returns {Pick<import('../types.js').GridState, 'searchColumn' | 'page'> & { filter?: import('../types.js').FilterState | null } | null}
 *   The state to merge, or null when `key` is already the search column.
 * @throws {RangeError} key is not a data column
 */
export function searchColumnChange(shell, state, key) {
  if (key !== null && !dataKeys(state.columns).includes(key)) {
    throw new RangeError(`DataGrid: unknown column "${key}"`);
  }
  if (shell.searchColumn) shell.searchColumn.value = key ?? '';
  if (key === state.searchColumn) return null;
  const cleared = clearedSearch(state, key);
  if (shell.search && cleared !== undefined) shell.search.value = '';
  return { searchColumn: key, page: 1, ...(cleared !== undefined && { filter: cleared }) };
}
