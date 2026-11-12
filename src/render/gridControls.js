// @ts-check
import { removeConditionPart } from '../core/conditions.js';
import { removeFilterPart } from '../core/filter.js';
import { isActionColumn } from '../core/columns.js';
import { askConfirm } from './confirm.js';
import { bindAdvancedFilter } from './advancedFilter.js';
import { bindControls } from './controls.js';
import { openExportDialog } from './exportDialog.js';
import { exportExcel, exportRows } from './exportExcel.js';
import { previewCount } from './conditionPreview.js';

const DEFAULT_DEBOUNCE = 200;

/**
 * What the toolbar needs to count and list the rows an export would hold, bound to the grid's live state.
 *
 * @param {() => import('../types.js').GridState} state
 * @param {string | undefined} locale
 * @param {{ get: () => string[] }} hidden
 */
export const exportHost = (state, locale, hidden) => ({
  columns: () => state().columns,
  /** @param {import('../types.js').GridState['conditions']} conditions */
  previewCount: (conditions) => previewCount(state(), { locale, hidden: hidden.get() }, conditions),
  /** @param {string | undefined} search */
  exportRows: (search) => exportRows(state(), { locale, hidden: hidden.get(), search }),
  /** @param {import('../types.js').ExportOptions} options */
  exportFile: (options) => exportExcel(state(), { locale, hidden: hidden.get(), ...options }),
});

/**
 * Wire the toolbar, pager, action cells, column picker and filter chips of one grid to its public methods.
 *
 * @param {import('../SPGrid.js').SPGrid} grid
 * @param {ReturnType<typeof import('./toolbar.js').mountShell>} shell
 * @param {import('../types.js').SPGridOptions} options
 * @param {Required<import('../types.js').Labels>} labels
 * @param {{
 *   applyFilter: (filter: import('../types.js').FilterState | null) => void,
 *   columns: () => import('../types.js').Column[],
 *   visible: () => import('../types.js').Row[],
 *   exportRows: (search: string | undefined) => import('../types.js').Row[],
 *   exportFile: (options: import('../types.js').ExportOptions) => Blob,
 *   previewCount: (conditions: import('../types.js').GridState['conditions']) => { shown: number, total: number },
 *   emit: (event: any, payload: any) => void,
 * }} host What the grid keeps private.
 * @returns {() => void} Removes every listener.
 */
export function bindGridControls(grid, shell, options, labels, host) {
  const unbindAdvanced = bindAdvancedFilter(grid, shell, labels, host.columns, host.previewCount);
  const unbindControls = bindControls(shell, {
    debounce: options.searchDebounce ?? DEFAULT_DEBOUNCE,
    submit: options.searchButton === true,
    onSearch: (search) =>
      host.applyFilter({ search, columnFilters: grid.getFilter()?.columnFilters }),
    onColumn: (key) => grid.setSearchColumn(key),
    onExport: () => {
      if (options.exportColumnSelect !== true) return void grid.exportExcel();
      const root = shell.host.closest('.spg-root');
      if (!root) return void grid.exportExcel();
      const columns = host
        .columns()
        .filter((c) => !isActionColumn(c))
        .map((c) => ({ key: c.key, label: c.label ?? c.key }));
      const dialog = {
        title: labels.exportFields,
        ok: labels.exportExcel,
        cancel: labels.cancel,
        close: labels.close,
        selectAll: labels.selectAll,
        clearAll: labels.clearAll,
        search: labels.exportSearch,
        rowCount: labels.exportRowCount,
        previewMore: labels.exportPreviewMore,
        previewEmpty: labels.exportPreviewEmpty,
      };
      const search = { value: grid.getFilter()?.search ?? '', rows: host.exportRows };
      openExportDialog(/** @type {HTMLElement} */ (root), columns, dialog, search, (choice) => {
        if (choice) grid.exportExcel(choice);
      });
    },
    onRefresh: () => host.emit('refresh', undefined),
    onView: () => grid.setView(grid.getView() === 'grid' ? 'calendar' : 'grid'),
    onRemoveFilter: (part) => {
      if (part.type === 'condition' || part.type === 'conditions') {
        const index = part.type === 'condition' ? part.index : null;
        return grid.setAdvancedFilter(removeConditionPart(grid.getAdvancedFilter(), index));
      }
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
        freezeColumns: labels.freezeColumns,
        freezeColumnsNone: labels.freezeColumnsNone,
        reset: labels.resetView,
      },
      getState: () => ({
        ...(shell.pickerColumns && { hidden: grid.getHiddenColumns(), sort: grid.getSort() }),
        view: shell.view?.get(),
        ...(options.groupByToggle === true && { groupBy: grid.getGroupBy() }),
        ...(options.freezeColumnsToggle === true && {
          freezeMax: grid.getColumnOrder().length - 1,
        }),
      }),
      onApply: ({ hidden, sort, view, groupBy }) => {
        if (view && shell.view?.apply(view)) grid.render();
        if (hidden !== undefined) grid.setHiddenColumns(hidden);
        if (sort !== undefined) grid.setSort(sort);
        if (groupBy !== undefined) grid.setGroupBy(groupBy);
      },
      onReset:
        options.resetButton === true
          ? () =>
              askConfirm(options.confirmReset, labels.confirmReset, {
                root: shell.host.closest('.spg-root'),
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
  return () => {
    unbindAdvanced();
    unbindControls();
  };
}
