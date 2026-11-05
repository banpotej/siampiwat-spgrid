// @ts-check
import { dataKeys } from '../core/columns.js';
import { normalizeGroupBy } from '../core/group.js';
import { assertPageSize } from '../core/paginate.js';
import { normalizeSort } from '../core/sort.js';
import { isFreezeCount } from './frozenColumns.js';
import { GridRenderer } from './gridRenderer.js';
import { loadGroupBy } from './groupByStore.js';
import { resolveIcons } from './icons.js';
import { resolveLabels } from './labels.js';
import { loadPageSize } from './pageSizeStore.js';
import { loadSort } from './sortStore.js';
import { GRID_LINES, LINE_STYLES } from './viewToggles.js';
import { mountShell } from './toolbar.js';

/**
 * @param {unknown} container
 * @param {import('../types.js').SPGridOptions} options
 * @throws {TypeError} `container` is not an HTMLElement
 * @throws {RangeError} `pageSize` or an entry of `pageSizeOptions` is not a positive integer,, `gridLines` / `lineStyle` is unknown, or `freezeColumns` is not a whole number
 */
export function assertOptions(container, options) {
  if (!(container instanceof HTMLElement)) {
    throw new TypeError('SPGrid: container must be an HTMLElement');
  }
  if (options.pageSize !== undefined) assertPageSize(options.pageSize);
  options.pageSizeOptions?.forEach(assertPageSize);
  if (options.gridLines !== undefined && !GRID_LINES.includes(options.gridLines)) {
    throw new RangeError(`SPGrid: unknown gridLines "${options.gridLines}"`);
  }
  if (options.lineStyle !== undefined && !LINE_STYLES.includes(options.lineStyle)) {
    throw new RangeError(`SPGrid: unknown lineStyle "${options.lineStyle}"`);
  }
  if (options.freezeColumns !== undefined && !isFreezeCount(options.freezeColumns)) {
    throw new RangeError(`SPGrid: freezeColumns must be a whole number, 0 or more`);
  }
}

/**
 * Mount the static shell in `container` and make the renderer that fills it.
 *
 * @param {HTMLElement} container
 * @param {import('../types.js').SPGridOptions} options
 */
export function mountParts(container, options) {
  const labels = resolveLabels(options.labels);
  const icons = resolveIcons(options.icons);
  const shell = mountShell(container, options, labels, icons);
  const renderer = new GridRenderer({
    shell,
    labels,
    icons,
    rowKey: options.rowKey,
    locale: options.locale,
    pageSizeOptions: options.pageSizeOptions,
    highlight: options.highlightSearch !== false,
    resizable: options.resizableColumns === true,
    widthStorageKey: options.columnWidthStorageKey,
    activatable: options.onRowActivate !== undefined,
  });
  return { labels, shell, renderer };
}

/**
 * What `resetView()` goes back to: the `pageSize`, `defaultSort` and `groupBy` options.
 *
 * @param {import('../types.js').SPGridOptions} options
 * @returns {{ pageSize: number | null, sort: import('../types.js').SortState, groupBy: string[] }}
 * @throws {TypeError} `defaultSort` has a bad direction, or `groupBy` is not an array of keys
 * @throws {RangeError} `defaultSort` or `groupBy` names a column that is not a data column, or `groupBy` repeats one
 */
export function initialView(options) {
  return {
    pageSize: options.pageSize ?? null,
    sort: normalizeSort(options.defaultSort ?? null, dataKeys(options.columns)),
    groupBy: normalizeGroupBy(options.columns, options.groupBy ?? []),
  };
}

/**
 * The state a new grid starts with: the saved sort, group columns and page size (if any) over the options.
 *
 * @param {import('../types.js').SPGridOptions} options
 * @param {import('../types.js').Column[]} columns Columns in display order.
 * @param {ReturnType<typeof initialView>} initial
 * @returns {import('../types.js').GridState}
 */
export function initialState(options, columns, initial) {
  return {
    columns,
    rows: options.rows ?? [],
    sort: loadSort(options.sortStorageKey, dataKeys(options.columns), initial.sort),
    groupBy: loadGroupBy(options.groupByStorageKey, columns, initial.groupBy),
    filter: null,
    page: 1,
    pageSize: loadPageSize(options.pageSizeStorageKey, options.pageSize) ?? null,
    searchColumn: null,
  };
}
