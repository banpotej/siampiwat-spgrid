// @ts-check
import { dataKeys } from '../core/columns.js';
import { normalizeGroupBy } from '../core/group.js';
import { assertPageSize } from '../core/paginate.js';
import { normalizeSelectable } from '../core/selection.js';
import { normalizeSort } from '../core/sort.js';
import { assertCalendar } from './calendarOptions.js';
import { CalendarView } from './calendarView.js';
import { isFreezeCount } from './frozenColumns.js';
import { GridRenderer } from './gridRenderer.js';
import { loadConditions } from './conditionStore.js';
import { loadGroupBy } from './groupByStore.js';
import { resolveIcons } from './icons.js';
import { resolveLabels } from './labels.js';
import { loadPageSize } from './pageSizeStore.js';
import { loadSort } from './sortStore.js';
import { assertView } from './viewMode.js';
import { GRID_LINES, LINE_STYLES } from './viewToggles.js';
import { mountShell } from './toolbar.js';

/**
 * @param {unknown} actions The `selectionActions` option.
 * @param {unknown} mode What `selectable` came to.
 * @throws {RangeError} without `selectable`, an empty list, or a name used twice
 * @throws {TypeError} not a list of `{ name, label }` objects
 */
function assertSelectionActions(actions, mode) {
  if (actions === undefined) return;
  if (!mode) throw new RangeError('SPGrid: selectionActions needs the selectable option');
  if (!Array.isArray(actions) || actions.length === 0) {
    throw new TypeError('SPGrid: selectionActions must be a non-empty list');
  }
  const names = new Set();
  for (const a of actions) {
    if (!a || typeof a.name !== 'string' || a.name === '' || typeof a.label !== 'string') {
      throw new TypeError('SPGrid: a selection action needs a name and a label');
    }
    if (names.has(a.name)) throw new RangeError(`SPGrid: selection action "${a.name}" is repeated`);
    names.add(a.name);
  }
}

/**
 * @param {unknown} container
 * @param {import('../types.js').SPGridOptions} options
 * @throws {TypeError} `container` is not an HTMLElement
 * @throws {RangeError} `selectable` is unknown, `pageSize` or an entry of `pageSizeOptions` is not a positive integer,, `gridLines` / `lineStyle` is unknown, `freezeColumns` is not a whole number, `calendar` is not valid (see `assertCalendar`), `defaultView` is unknown or `'calendar'` without `calendar`, or `viewToggle` is on without `calendar`
 */
export function assertOptions(container, options) {
  if (!(container instanceof HTMLElement)) {
    throw new TypeError('SPGrid: container must be an HTMLElement');
  }
  const mode = normalizeSelectable(options.selectable);
  assertSelectionActions(options.selectionActions, mode);
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
  if (options.calendar !== undefined) assertCalendar(options.calendar);
  if (options.defaultView !== undefined) assertView(options.defaultView, !!options.calendar);
  if (options.viewToggle === true && !options.calendar) {
    throw new RangeError('SPGrid: viewToggle needs the calendar option');
  }
}

/**
 * Mount the static shell in `container` and make the renderer that fills it.
 *
 * @param {HTMLElement} container
 * @param {import('../types.js').SPGridOptions} options
 * @param {(state: import('../calendarTypes.js').CalendarState) => void} [onCalendarChange]
 */
export function mountParts(container, options, onCalendarChange) {
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
    selectable: normalizeSelectable(options.selectable),
    calendar:
      options.calendar &&
      new CalendarView(options.calendar, {
        labels,
        icons,
        locale: options.locale,
        onChange: onCalendarChange,
      }),
    view: options.defaultView,
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
    conditions: loadConditions(options.advancedFilterStorageKey, columns, options.locale),
    page: 1,
    pageSize: loadPageSize(options.pageSizeStorageKey, options.pageSize) ?? null,
    searchColumn: null,
    selected: new Set(),
  };
}
