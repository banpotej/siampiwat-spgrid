// @ts-check
import { removeFilterPart } from '../core/filter.js';
import { askConfirm } from './confirm.js';
import { bindControls } from './controls.js';

const DEFAULT_DEBOUNCE = 200;

/**
 * Wire the toolbar, pager, action cells, column picker and filter chips of one grid to its public methods.
 *
 * @param {import('../DataGrid.js').DataGrid} grid
 * @param {ReturnType<typeof import('./toolbar.js').mountShell>} shell
 * @param {import('../types.js').DataGridOptions} options
 * @param {Required<import('../types.js').Labels>} labels
 * @param {{
 *   applyFilter: (filter: import('../types.js').FilterState | null) => void,
 *   columnFilters: () => import('../types.js').FilterState['columnFilters'],
 *   columns: () => import('../types.js').Column[],
 *   visible: () => import('../types.js').Row[],
 *   emit: (event: any, payload: any) => void,
 * }} host What the grid keeps private.
 * @returns {() => void} Removes every listener.
 */
export function bindGridControls(grid, shell, options, labels, host) {
  return bindControls(shell, {
    debounce: options.searchDebounce ?? DEFAULT_DEBOUNCE,
    submit: options.searchButton === true,
    onSearch: (search) => host.applyFilter({ search, columnFilters: host.columnFilters() }),
    onColumn: (key) => grid.setSearchColumn(key),
    onExport: () => grid.exportExcel(),
    onRefresh: () => host.emit('refresh', undefined),
    onRemoveFilter: (part) => {
      grid.setFilter(removeFilterPart(grid.getFilter(), part));
      if (part.type === 'search') grid.setSearchColumn(null);
    },
    columnPicker: {
      columns: shell.pickerColumns ?? [],
      groupColumns: shell.groupColumns ?? [],
      labels: {
        title: labels.columnSettings,
        apply: labels.apply,
        cancel: labels.cancel,
        close: labels.close,
        sortBy: labels.sortBy,
        noSort: labels.noSort,
        sortDirection: labels.sortDirection,
        ascending: labels.ascending,
        descending: labels.descending,
        columns: labels.columnsSection,
        selectAll: labels.selectAll,
        clearAll: labels.clearAll,
        sort: labels.sortSection,
        display: labels.displaySection,
        groupSection: labels.groupSection,
        groupBy: labels.groupBy,
        thenBy: labels.thenBy,
        noGrouping: labels.noGrouping,
        stripedRows: labels.stripedRows,
        textWrap: labels.textWrap,
        gridLines: labels.gridLines,
        gridLinesOptions: {
          default: labels.gridLinesDefault,
          horizontal: labels.gridLinesHorizontal,
          vertical: labels.gridLinesVertical,
          both: labels.gridLinesBoth,
          none: labels.gridLinesNone,
        },
        lineStyle: labels.lineStyle,
        lineStyleOptions: {
          default: labels.lineStyleDefault,
          solid: labels.lineStyleSolid,
          dashed: labels.lineStyleDashed,
          dotted: labels.lineStyleDotted,
        },
        reset: labels.resetView,
      },
      getState: () => ({
        ...(shell.pickerColumns && { hidden: grid.getHiddenColumns(), sort: grid.getSort() }),
        view: shell.view?.get(),
        ...(options.groupByToggle === true && { groupBy: grid.getGroupBy() }),
      }),
      onApply: ({ hidden, sort, view, groupBy }) => {
        if (view) shell.view?.apply(view);
        if (hidden !== undefined) grid.setHiddenColumns(hidden);
        if (sort !== undefined) grid.setSort(sort);
        if (groupBy !== undefined) grid.setGroupBy(groupBy);
      },
      onReset:
        options.resetButton === true
          ? () =>
              askConfirm(options.confirmReset, labels.confirmReset, {
                root: shell.host.closest('.dg-root'),
                title: labels.resetView,
                ok: labels.confirmOk,
                cancel: labels.cancel,
              }).then((ok) => ok && grid.resetView())
          : undefined,
    },
    pager: grid,
    actions: {
      getRows: host.visible,
      getColumns: host.columns,
      rowKey: options.rowKey,
      emit: host.emit,
    },
    rowActivate: options.onRowActivate && {
      getRows: host.visible,
      rowKey: options.rowKey,
      emit: host.emit,
    },
  });
}
