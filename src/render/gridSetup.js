// @ts-check
import { dataKeys } from '../core/columns.js';
import { assertPageSize } from '../core/paginate.js';
import { GridRenderer } from './gridRenderer.js';
import { resolveIcons } from './icons.js';
import { resolveLabels } from './labels.js';
import { loadPageSize } from './pageSizeStore.js';
import { loadSort } from './sortStore.js';
import { mountShell } from './toolbar.js';

/**
 * @param {unknown} container
 * @param {import('../types.js').DataGridOptions} options
 * @throws {TypeError} `container` is not an HTMLElement
 * @throws {RangeError} `pageSize` or an entry of `pageSizeOptions` is not a positive integer
 */
export function assertOptions(container, options) {
  if (!(container instanceof HTMLElement)) {
    throw new TypeError('DataGrid: container must be an HTMLElement');
  }
  if (options.pageSize !== undefined) assertPageSize(options.pageSize);
  options.pageSizeOptions?.forEach(assertPageSize);
}

/**
 * Mount the static shell in `container` and make the renderer that fills it.
 *
 * @param {HTMLElement} container
 * @param {import('../types.js').DataGridOptions} options
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
 * The state a new grid starts with: the saved sort and page size (if any) over the options.
 *
 * @param {import('../types.js').DataGridOptions} options
 * @param {import('../types.js').Column[]} columns Columns in display order.
 * @param {import('../types.js').SortState} defaultSort
 * @returns {import('../types.js').GridState}
 */
export function initialState(options, columns, defaultSort) {
  return {
    columns,
    rows: options.rows ?? [],
    sort: loadSort(options.sortStorageKey, dataKeys(options.columns), defaultSort),
    filter: null,
    page: 1,
    pageSize: loadPageSize(options.pageSizeStorageKey, options.pageSize) ?? null,
    searchColumn: null,
  };
}
