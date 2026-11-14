// @ts-check

/**
 * @typedef {Record<string, unknown>} Row
 */

/** @typedef {import('./columnTypes.js').Column} Column */

/** @typedef {import('./selectionTypes.js').SelectionActionDef} SelectionActionDef */

/**
 * @typedef {object} ActionDef
 * @property {string} name Value of `data-action`, reported as `action` in the 'action' event.
 * @property {string} label Button text (escaped); with an `icon` it is the button's aria-label and tooltip instead.
 * @property {IconName} [icon] Built-in icon (`visibility`, `edit`, `delete`, `cancel`, `check`, ...); replace its SVG with
 *   `options.icons`. Unknown names are ignored. A button with an icon shows the icon only (see `showLabel`).
 * @property {boolean} [showLabel] With an `icon`: also show the label text after the icon. Default false.
 * @property {string} [className] Extra class(es) for styling, e.g. 'btn-cancel'.
 * @property {string} [title] Tooltip (escaped); default for an icon-only button: `label`.
 * @property {(row: Row) => boolean} [visible] The button is left out when this returns false.
 * @property {(row: Row) => boolean} [disabled] The button is disabled when this returns true.
 */

/**
 * @typedef {object} ActionEventPayload
 * @property {string} action `ActionDef.name`, or the `data-cell-action` value of a clicked element.
 * @property {Row} row The original row object (not a copy), resolved from the rows currently shown.
 * @property {string} key Key of the column the click happened in.
 * @property {unknown} [rowKey] `row[options.rowKey]`; undefined when `rowKey` is not set.
 */

/**
 * @typedef {object} RowActivatePayload
 * @property {Row} row The original row object (not a copy), resolved from the rows currently shown.
 * @property {unknown} [rowKey] `row[options.rowKey]`; undefined when `rowKey` is not set.
 * @property {MouseEvent | KeyboardEvent} originalEvent The double-click, or the Enter key press on the focused row.
 */

/**
 * @typedef {object} CellClickPayload
 * @property {string} key Key of the column the click happened in.
 * @property {Row} row
 * @property {unknown} [rowKey]
 * @property {MouseEvent} originalEvent
 */

/**
 * Names of the built-in icons (Material Symbols); see `options.icons`.
 * @typedef {'arrow_upward' | 'arrow_downward' | 'unfold_more' | 'unfold_less' | 'chevron_left' | 'chevron_right' | 'first_page' | 'last_page' | 'search' | 'close' | 'inbox' | 'visibility' | 'edit' | 'delete' | 'cancel' | 'check' | 'download' | 'calendar_today' | 'view_column' | 'restart_alt' | 'refresh' | 'stripes' | 'wrap_text' | 'settings' | 'filter_list'} IconName
 */

/**
 * @typedef {'asc' | 'desc'} SortDirection
 */

/**
 * @typedef {'default' | 'horizontal' | 'vertical' | 'both' | 'none'} GridLines
 */

/**
 * @typedef {'default' | 'solid' | 'dashed' | 'dotted'} LineStyle
 */

/**
 * @typedef {{ key: string, direction: SortDirection } | null} SortState
 */

/** @typedef {import('./conditionTypes.js').ConditionOperator} ConditionOperator */
/** @typedef {import('./conditionTypes.js').Condition} Condition */
/** @typedef {import('./conditionTypes.js').ConditionGroup} ConditionGroup */

/**
 * @typedef {object} FilterState
 * @property {string | null} [search] Global search; whitespace-separated words are ANDed.
 * @property {string[]} [columns] Column keys the global search looks at; default: every key of the row.
 * @property {boolean} [exact] Compare `search` as one value with the whole cell (case-insensitive) instead of as substring words.
 *   Set by the grid for a search limited to an enum column; not part of the user's filter.
 * @property {boolean} [range] Read `search` as 'FROM..TO' days ('YYYY-MM-DD', either side may be empty) that a date cell must fall
 *   in. Set by the grid for a search limited to a `date` column; not part of the user's filter.
 * @property {string} [searchColumn] Only in `getFilter()` / 'filterChange': the column the search box is limited to.
 * @property {Record<string, string | null | undefined>} [columnFilters] Per-column substring filters, ANDed.
 * @property {Condition | ConditionGroup} [conditions] Only in `getFilter()` / 'filterChange': the advanced filter. `setFilter` ignores it
 *   (see `setAdvancedFilter`).
 */

/**
 * @typedef {object} PageState
 * @property {number} page 1-based page number; clamped into range.
 * @property {number} pageSize Rows per page; a positive integer.
 */

/**
 * @typedef {object} PageResult
 * @property {Row[]} rows Rows on the current page.
 * @property {number} page Current page after clamping.
 * @property {number} pageSize
 * @property {number} totalRows Rows before slicing.
 * @property {number} totalPages At least 1, even when there are no rows.
 */

/**
 * @typedef {object} GridState Internal state of a SPGrid.
 * @property {Column[]} columns
 * @property {Row[]} rows
 * @property {SortState} sort
 * @property {FilterState | null} filter
 * @property {Condition | ConditionGroup | null} conditions The advanced filter (normalized); null when there is none.
 * @property {number} page Requested 1-based page; the rendered page is clamped into range.
 * @property {number | null} pageSize Rows per page; null while pagination is off.
 * @property {string | null} searchColumn Column the global search is limited to; null searches every data column.
 * @property {string[]} groupBy Keys of the columns the rows are grouped by, outermost first; empty while ungrouped.
 * @property {ReadonlySet<unknown>} selected The selected rows: each one's `rowKey` value, or the row object itself without a `rowKey`.
 */

/**
 * Payload of each grid event, by name.
 * @typedef {{ sortChange: SortState, filterChange: FilterState | null, pageChange: PageState,
 *   action: ActionEventPayload, cellClick: CellClickPayload, rowActivate: RowActivatePayload, columnsChange: string[], columnOrderChange: string[], groupByChange: string[], selectionChange: Row[], selectionAction: { action: string, rows: Row[] }, viewChange: 'grid' | 'calendar', calendarChange: import('./calendarTypes.js').CalendarState, refresh: void }} GridEvents
 */

/**
 * @typedef {object} SPGridOptions
 * @property {Column[]} columns
 * @property {Row[]} [rows]
 * @property {string} [rowKey] Field that identifies a row; rendered as `data-row-id` and reported as `rowKey`.
 * @property {(payload: ActionEventPayload) => void} [onAction] Called when an action button or a
 *   `[data-cell-action]` element is clicked.
 * @property {(payload: RowActivatePayload) => void} [onRowActivate] Makes the rows activatable and is called when one
 *   is: a double-click on the row, or Enter while the row has focus (each row is then a Tab stop, with a pointer cursor).
 *   Buttons, links and form controls inside a row keep their own behaviour. Default: rows are not interactive.
 * @property {boolean | 'single' | 'multiple'} [selectable] Add a leading checkbox column so rows can be selected: `true` / `'multiple'`
 *   (a header checkbox selects every row on the page) or `'single'` (at most one row). Space on a focused row toggles it;
 *   selected rows have `aria-selected="true"` and the class `is-selected`. The selection survives sorting, filtering and
 *   paging, and is kept across `setRows()` for rows still there (matched by `rowKey`; without one, by identity). Read it with
 *   `getSelectedRows()`, set it with `setSelectedRows()`, export it with `exportExcel({ selectedOnly: true })`. Default off.
 * @property {SelectionActionDef[]} [selectionActions] With `selectable`: a bar over the table that shows "N selected", these buttons and
 *   Clear selection while rows are selected. A button reports `{ action, rows }` through `onSelectionAction`, after the question when it has
 *   `confirm`. With `showHeader: false` (no header checkbox) the bar also holds "select all on this page" and is always shown.
 * @property {(payload: { action: string, rows: Row[] }) => void} [onSelectionAction] Called when a selection action runs (same as
 *   `on('selectionAction', fn)`).
 * @property {boolean} [clearFiltersButton] A toolbar button that clears the search and every filter at once (it shows only while
 *   something filters the rows); the sort, page size and columns stay (that is `resetView()`). Default `false`.
 * @property {(rows: Row[]) => void} [onSelectionChange] Called with the selected rows whenever the selection changes (same
 *   as `on('selectionChange', fn)`).
 * @property {string} [locale] Locale for sorting strings and lower-casing search text; default 'th'.
 * @property {{ key: string, direction: SortDirection }} [defaultSort] Sort applied when the grid is created (and by
 *   `resetView()`); `key` must be a data column. Default: unsorted.
 * @property {string} [sortStorageKey] Remember the sort in `localStorage` under this name (stored as
 *   `spgrid:sort:<name>`) and restore it next time, ahead of `defaultSort`; clearing the sort is remembered too.
 *   Give each grid its own name. Default: not saved.
 * @property {(sort: SortState) => void} [onSortChange] Called whenever the sort changes.
 * @property {boolean} [searchable] Render a search box above the table.
 * @property {boolean} [searchColumnSelect] With `searchable`: add a select beside the search box that limits
 *   the search to one column (default: all columns).
 * @property {boolean} [searchButton] With `searchable`: add a Search button; the grid then filters only when it is
 *   clicked or Enter is pressed in the box, not while typing (`searchDebounce` is ignored). Default false.
 * @property {boolean} [exportButton] Render an "Export Excel" button in the toolbar (works without `searchable`)
 *   that calls `exportExcel()`. Default false.
 * @property {string | (() => string)} [exportFilename] Download name of an export (`.xlsx` is added when missing; characters a
 *   file name cannot hold are dropped): the Export button's and `exportExcel()`'s when it gives no `filename`. A function is called
 *   for each export, e.g. to put the date in. With `exportColumnSelect` the modal's file name box starts with it and the user can
 *   change it. Default 'export.xlsx'.
 * @property {boolean} [exportColumnSelect] With `exportButton`: the button first opens a modal where the user ticks the
 *   fields (data columns) to export and can narrow the rows with a search box (starting with the grid's search text),
 *   then calls `exportExcel({ columns, search })`. Default false (exports every column and the grid's rows).
 * @property {boolean} [advancedFilter] Render an "Advanced filter" button in the toolbar (works without `searchable`) that opens a
 *   modal where the user builds conditions (field + operator + value) combined with all / any. They apply on top of the search and
 *   the column filters, and also to Excel export. Same as `setAdvancedFilter()`. Default false.
 * @property {boolean} [filterSummary] Render a strip under the toolbar, while a filter is active, with how many rows
 *   matched ("Found 12 of 250") and one chip per active filter (search text with its column, column filters); the
 *   x on a chip removes that filter. Default false.
 * @property {string} [title] Name of the grid, shown at the start (left) of the toolbar as an `<h2 class="spg-title">`
 *   (escaped; the toolbar is rendered for it even without a search box). Default none.
 * @property {boolean} [rowCount] Show how many rows match the search and filters (all pages, e.g. "5 รายการ") as a
 *   `<span class="spg-count">` at the end of the toolbar (rendered for it even without a search box); the text is `labels.rowCount`. Default false.
 * @property {boolean} [showHeader] Set `false` to hide the header row (it stays in the DOM, visually hidden, so screen
 *   readers still read it); for a list-like grid with one `render` column. Default true.
 * @property {string} [description] Text under the grid name (escaped), shown in a strip below the toolbar; a button
 *   next to the name hides or shows it (starts shown). Default none.
 * @property {boolean} [resetButton] Add a "Reset view" button to the settings modal that calls `resetView()` (after asking, see
 *   `confirmReset`); opening the modal needs the Settings button, which this option turns on. Default false.
 * @property {false | ((message: string) => boolean | Promise<boolean>)} [confirmReset] How the Reset view button asks
 *   before it resets (`labels.confirmReset` is the message): default a built-in modal; pass your own
 *   dialog (return or resolve `true` to go ahead; anything else, or an error, cancels), or `false` to reset at once.
 *   `resetView()` itself never asks.
 * @property {boolean} [refreshButton] Render a "Refresh" button in the toolbar that emits `refresh`; the app reloads
 *   its data and calls `setRows()`. Default false.
 * @property {boolean} [groupToggleAllButton] Render a "Collapse all" / "Expand all" button in the toolbar that folds or
 *   unfolds every group header (`groupBy`). It shows only while the rows are grouped, and offers Expand all once every
 *   group on the page is collapsed. Default false.
 * @property {() => void} [onRefresh] Called when the Refresh button is clicked (same as `on('refresh', fn)`).
 * @property {boolean} [columnPicker] Render a "Settings" button in the toolbar (works without `searchable`) that opens
 *   a modal with a checkbox per data column to show or hide it and, for `sortable` columns, a sort column and
 *   direction (saved by `sortStorageKey`); Apply commits. `resetButton`, `stripedToggle` and `textWrapToggle` add their
 *   part to the same modal and turn the button on by themselves. Default false.
 * @property {string[]} [hiddenColumns] Keys of data columns hidden at first (`columnStorageKey` can override it).
 * @property {string} [columnStorageKey] Remember the hidden columns in `localStorage` under this name
 *   (stored as `spgrid:columns:<name>`) and restore them next time. Give each grid its own name. Default: not saved.
 * @property {(hidden: string[]) => void} [onColumnsChange] Called whenever the set of hidden columns changes.
 * @property {boolean} [reorderableColumns] Let the user drag a header cell onto another to move the column (it lands
 *   before or after it), or focus a header cell and press Alt+Left / Alt+Right to move it one place. Default false.
 * @property {string} [columnOrderStorageKey] Remember the order of the columns in `localStorage` under this name
 *   (stored as `spgrid:columnOrder:<name>`) and restore it next time, whether or not `reorderableColumns` is on.
 *   Give each grid its own name. Default: not saved.
 * @property {(order: string[]) => void} [onColumnOrderChange] Called whenever the order of the columns changes
 *   (same as `on('columnOrderChange', fn)`); receives the key of every column in display order.
 * @property {number} [searchDebounce] Milliseconds to wait after typing before filtering; default 200.
 * @property {Labels} [labels] UI texts.
 * @property {(filter: FilterState | null) => void} [onFilterChange] Called whenever the filter changes.
 * @property {number} [pageSize] Rows per page; enables pagination. Default: off (show all rows).
 * @property {number[]} [pageSizeOptions] Sizes offered in a "rows per page" select, e.g. [10, 20, 50].
 * @property {string} [pageSizeStorageKey] Remember the rows per page in `localStorage` under this name (stored as
 *   `spgrid:pageSize:<name>`) and restore it next time, ahead of `pageSize`. Default: not saved.
 * @property {(page: PageState) => void} [onPageChange] Called whenever the page or page size changes.
 * @property {Partial<Record<IconName, string>>} [icons] Replacement SVG markup per icon. Trusted: it is
 *   inserted as HTML, so pass only markup you control, never user data.
 * @property {boolean} [striped] Zebra rows; default false (`stripedStorageKey` can override it).
 * @property {boolean} [resizableColumns] Let the user drag the right edge of a header cell (or focus the handle and use the
 *   left / right arrow keys) to change a column's width. Action columns are not resizable. Default false.
 * @property {string} [columnWidthStorageKey] With `resizableColumns`: remember the column widths in `localStorage` under
 *   this name (stored as `spgrid:columnWidths:<name>`) and restore them next time. Give each grid its own name.
 *   Default: not saved.
 * @property {boolean} [highlightSearch] Mark where the search text occurs in the cells (`<mark class="spg-mark">`, limited
 *   to the search column when one is chosen). Default true.
 * @property {boolean} [textWrap] Long cell text wraps onto more lines (true) or stays on one line (false); default true
 *   (`textWrapStorageKey` can override it).
 * @property {boolean} [textWrapToggle] Add a "Wrap text" switch to the settings modal so the user can turn wrapping on
 *   or off. Default false.
 * @property {string} [textWrapStorageKey] Remember the wrap choice in `localStorage` under this name (stored as
 *   `spgrid:textWrap:<name>`) and restore it next time, ahead of `textWrap`. Default: not remembered.
 * @property {boolean} [stripedToggle] Add a "Striped rows" switch to the settings modal so the user can turn the
 *   zebra rows on or off. Default false.
 * @property {string} [stripedStorageKey] Remember the striped choice in `localStorage` under this name (stored as
 *   `spgrid:striped:<name>`) and restore it next time, ahead of `striped`. Default: not remembered.
 * @property {boolean} [bordered] Draw a border around every cell (vertical lines too); default false. The same as
 *   `gridLines: 'both'` (`gridLines` wins when both are set).
 * @property {GridLines} [gridLines] Which lines the table draws: 'default' (the theme's row lines), 'horizontal' (row
 *   lines), 'vertical' (column lines), 'both' (every cell bordered) or 'none'. Default 'default' (`gridLinesStorageKey`
 *   can override it). An unknown value throws a `RangeError`.
 * @property {LineStyle} [lineStyle] How the grid lines are drawn: 'solid', 'dashed', 'dotted', or 'default' (the theme's
 *   `--spg-line-style`, dashed unless you changed it). Default 'default' (`lineStyleStorageKey` can override it). An
 *   unknown value throws a `RangeError`.
 * @property {boolean} [lineStyleToggle] Add a "Line style" select to the settings modal so the user can pick the style.
 *   Default false.
 * @property {string} [lineStyleStorageKey] Remember the line style in `localStorage` under this name (stored as
 *   `spgrid:lineStyle:<name>`) and restore it next time, ahead of `lineStyle`. Default: not remembered.
 * @property {string[]} [groupBy] Data column keys to group the rows by, outermost first (e.g. `['department', 'status']`).
 *   Each group gets a collapsible header row (the column's cell for the group's value, and how many of its rows are on
 *   the page); inside a group the rows keep the `sort`. Group columns are sorted first (ascending, or as the sort says
 *   when the sort is on that column). Default none (`groupByStorageKey` can override it). An unknown or repeated
 *   column throws a `RangeError`.
 * @property {boolean} [groupByToggle] Add a "Grouping" section to the settings modal with two selects (group by, then
 *   by) over the data columns, so the user can pick the group columns. Default false.
 * @property {string} [groupByStorageKey] Remember the group columns in `localStorage` under this name (stored as
 *   `spgrid:groupBy:<name>`) and restore it next time, ahead of `groupBy`; ungrouping is remembered too. Give each
 *   grid its own name. Default: not remembered.
 * @property {(groupBy: string[]) => void} [onGroupByChange] Called whenever the group columns change (same as
 *   `on('groupByChange', fn)`).
 * @property {string} [advancedFilterStorageKey] Remember the advanced filter in `localStorage` under this name (stored as
 *   `spgrid:advancedFilter:<name>`) and restore it next time; clearing it is remembered too. A saved filter that no
 *   longer fits the columns is ignored. Give each grid its own name. Default: not remembered.
 * @property {boolean} [gridLinesToggle] Add a "Grid lines" select to the settings modal so the user can pick the mode.
 *   Default false.
 * @property {string} [gridLinesStorageKey] Remember the grid lines choice in `localStorage` under this name (stored as
 *   `spgrid:gridLines:<name>`) and restore it next time, ahead of `gridLines`/`bordered`. Default: not remembered.
 * @property {number} [freezeColumns] How many columns, counted from the start (left) edge of the shown columns, stay in
 *   place while the table scrolls sideways (`spg-frozen`). The table area must scroll: `maxHeight` makes it, or give
 *   `.spg-table-wrap` `overflow-x: auto`. One column always stays free. Default 0 (`freezeColumnsStorageKey` can
 *   override it). Anything but a whole number, 0 or more, throws a `RangeError`.
 * @property {boolean} [freezeColumnsToggle] Add a "Frozen columns" select (0, 1, 2 …) to the settings modal so the user
 *   can pick how many. Default false.
 * @property {string} [freezeColumnsStorageKey] Remember the frozen column count in `localStorage` under this name (stored
 *   as `spgrid:freezeColumns:<name>`) and restore it next time, ahead of `freezeColumns`. Default: not remembered.
 * @property {boolean} [buttonLabels] Write each toolbar button's name beside its icon (Refresh, Export, Advanced filter, Settings,
 *   Collapse all, the view and search buttons), so no button relies on its tooltip. The text is the button's label (`labels.*`,
 *   `thaiLabels` for Thai) and follows it when the label changes. Default `false`: icon-only buttons.
 * @property {'compact' | 'comfortable'} [density] Cell padding; default 'comfortable'.
 * @property {boolean} [stickyHeader] Keep the header visible while scrolling.
 * @property {number | string} [maxHeight] Max height of the table area (a number is px, or any CSS length);
 *   taller tables scroll inside it.
 * @property {import('./calendarTypes.js').CalendarOptions} [calendar] Show the rows as events on a calendar (week, work week,
 *   day or agenda) instead of a table; search and filters still apply, paging and grouping do not. See `CalendarOptions`.
 * @property {'grid' | 'calendar'} [defaultView] What the grid shows first when it has a `calendar`: `'calendar'` (default) or `'grid'`.
 * @property {boolean} [viewToggle] With `calendar`: render a toolbar button that switches between the table and the calendar
 *   (`getView()` / `setView()` do the same from code). Needs `calendar`. Default `false`.
 * @property {(view: 'grid' | 'calendar') => void} [onViewChange] Called when the view changes (same as `on('viewChange', fn)`).
 * @property {(state: import('./calendarTypes.js').CalendarState) => void} [onCalendarChange] Called when the calendar opens
 *   another view or range of days (same as `on('calendarChange', fn)`).
 */

/** @typedef {import('./viewTypes.js').ViewSettings} ViewSettings */
/** @typedef {import('./viewTypes.js').ExportOptions} ExportOptions */

/** @typedef {import('./labelTypes.js').Labels} Labels */

export {};
