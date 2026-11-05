// @ts-check
import { createEmitter } from '../core/emitter.js';
import { saveGroupBy } from './groupByStore.js';
import { savePageSize } from './pageSizeStore.js';
import { saveSort } from './sortStore.js';

/** @typedef {import('../types.js').SPGridOptions} SPGridOptions */
/** @typedef {import('../types.js').GridState} GridState */
/** @typedef {import('../types.js').PageResult} PageResult */

/**
 * The grid's event emitter with the `on*` callbacks of `options` already subscribed, and the page size
 * saved on every change when `pageSizeStorageKey` is set (likewise the sort with `sortStorageKey`).
 *
 * @param {SPGridOptions} options
 */
export function createGridEvents(options) {
  const events = createEmitter(
    /** @type {const} */ ([
      'sortChange',
      'filterChange',
      'pageChange',
      'action',
      'cellClick',
      'rowActivate',
      'columnsChange',
      'columnOrderChange',
      'groupByChange',
      'refresh',
    ]),
  );
  if (options.onSortChange) events.on('sortChange', options.onSortChange);
  if (options.onFilterChange) events.on('filterChange', options.onFilterChange);
  if (options.onPageChange) events.on('pageChange', options.onPageChange);
  if (options.onAction) events.on('action', options.onAction);
  if (options.onRowActivate) events.on('rowActivate', options.onRowActivate);
  if (options.onRefresh) events.on('refresh', options.onRefresh);
  if (options.onColumnsChange) events.on('columnsChange', options.onColumnsChange);
  if (options.onColumnOrderChange) events.on('columnOrderChange', options.onColumnOrderChange);
  if (options.onGroupByChange) events.on('groupByChange', options.onGroupByChange);
  events.on('groupByChange', (keys) => saveGroupBy(options.groupByStorageKey, keys));
  events.on('pageChange', ({ pageSize }) => savePageSize(options.pageSizeStorageKey, pageSize));
  events.on('sortChange', (sort) => saveSort(options.sortStorageKey, sort));
  return events;
}

/**
 * Emit `sortChange`, `filterChange`, `groupByChange` and `pageChange` for what differs between two states.
 *
 * @param {ReturnType<typeof createGridEvents>} events
 * @param {{ getSort: () => GridState['sort'], getFilter: () => import('../types.js').FilterState | null }} grid
 *   Source of the public sort and filter values to report.
 * @param {{ state: GridState, prev: GridState, before: PageResult | null, after: PageResult | null }} change
 *   `before` / `after` are the rendered pages around the change.
 */
export function emitChanges(events, grid, { state, prev, before, after }) {
  if (state.sort !== prev.sort) events.emit('sortChange', grid.getSort());
  if (state.groupBy !== prev.groupBy) events.emit('groupByChange', [...state.groupBy]);
  const columnChanged = state.searchColumn !== prev.searchColumn && state.filter?.search;
  if (state.filter !== prev.filter || columnChanged) events.emit('filterChange', grid.getFilter());
  if (after && (after.page !== before?.page || after.pageSize !== before?.pageSize)) {
    events.emit('pageChange', { page: after.page, pageSize: after.pageSize });
  }
}
