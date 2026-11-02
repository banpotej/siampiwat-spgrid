// @ts-check

/**
 * @typedef {Record<string, unknown>} Row
 */

/**
 * @typedef {object} Column
 * @property {string} key Property of the row to display.
 * @property {string} [label] Header text; defaults to `key`.
 * @property {boolean} [sortable] Header click / Enter / Space cycles asc -> desc -> none.
 * @property {'left' | 'center' | 'right'} [align] Text alignment of the header and cells; default 'left'.
 * @property {string} [width] Any CSS width, e.g. '80px'; ignored if it contains anything but a plain length.
 * @property {string} [ariaLabel] `aria-label` of the header cell; give it to columns without a label.
 * @property {(value: unknown, row: Row) => string} [render] Cell HTML. NOT escaped: the caller must escape
 *   every piece of user data it interpolates (use `escapeHtml`). Default: the escaped value.
 * @property {'text' | 'badge' | 'date' | 'boolean' | 'number'} [type] How the cell looks (default 'text', as is):
 *   `badge` = a coloured pill (see `badges`); `date` = a Date, ISO string or timestamp formatted for the grid's
 *   locale with a calendar icon; `boolean` = a check / cross chip; `number` = formatted, right-aligned figures.
 *   Blank values show a muted dash. Ignored when `render` is set. Sorting, search and export use the raw value.
 * @property {Intl.NumberFormatOptions | Intl.DateTimeFormatOptions} [format] Options for `number` (e.g.
 *   `{ style: 'currency', currency: 'THB' }`) and `date` (default `{ dateStyle: 'medium' }`).
 * @property {(string | { value: string, label?: string })[]} [options] Makes this an enum column: the values it can take
 *   (a `badge` column's `badges` keys count too). With `searchColumnSelect`, choosing it as the search column swaps the text box
 *   for a select of these values (labels escaped) and the search matches the whole cell, not a substring. Default none.
 * @property {Record<string, { tone?: 'success' | 'danger' | 'warning' | 'info' | 'neutral', icon?: IconName,
 *   label?: string }>} [badges] For `badge`: look per value (keyed by the raw value); others are neutral.
 * @property {ActionDef[]} [actions] Makes this an action column: one button per action in each row. `key` is
 *   then only an identifier; the column is never sortable, searched or filtered.
 */

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
 * @typedef {'arrow_upward' | 'arrow_downward' | 'unfold_more' | 'chevron_left' | 'chevron_right' | 'first_page' | 'last_page' | 'search' | 'close' | 'inbox' | 'visibility' | 'edit' | 'delete' | 'cancel' | 'check' | 'download' | 'calendar_today' | 'view_column' | 'restart_alt' | 'refresh' | 'stripes' | 'wrap_text' | 'settings'} IconName
 */

/**
 * @typedef {'asc' | 'desc'} SortDirection
 */

/**
 * @typedef {'default' | 'horizontal' | 'vertical' | 'both' | 'none'} GridLines
 */

/**
 * @typedef {{ key: string, direction: SortDirection } | null} SortState
 */

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
 * @typedef {object} GridState Internal state of a DataGrid.
 * @property {Column[]} columns
 * @property {Row[]} rows
 * @property {SortState} sort
 * @property {FilterState | null} filter
 * @property {number} page Requested 1-based page; the rendered page is clamped into range.
 * @property {number | null} pageSize Rows per page; null while pagination is off.
 * @property {string | null} searchColumn Column the global search is limited to; null searches every data column.
 */

/**
 * Payload of each grid event, by name.
 * @typedef {{ sortChange: SortState, filterChange: FilterState | null, pageChange: PageState,
 *   action: ActionEventPayload, cellClick: CellClickPayload, rowActivate: RowActivatePayload, columnsChange: string[], columnOrderChange: string[], refresh: void }} GridEvents
 */

/**
 * @typedef {object} DataGridOptions
 * @property {Column[]} columns
 * @property {Row[]} [rows]
 * @property {string} [rowKey] Field that identifies a row; rendered as `data-row-id` and reported as `rowKey`.
 * @property {(payload: ActionEventPayload) => void} [onAction] Called when an action button or a
 *   `[data-cell-action]` element is clicked.
 * @property {(payload: RowActivatePayload) => void} [onRowActivate] Makes the rows activatable and is called when one
 *   is: a double-click on the row, or Enter while the row has focus (each row is then a Tab stop, with a pointer cursor).
 *   Buttons, links and form controls inside a row keep their own behaviour. Default: rows are not interactive.
 * @property {string} [locale] Locale for sorting strings and lower-casing search text; default 'th'.
 * @property {{ key: string, direction: SortDirection }} [defaultSort] Sort applied when the grid is created (and by
 *   `resetView()`); `key` must be a data column. Default: unsorted.
 * @property {string} [sortStorageKey] Remember the sort in `localStorage` under this name (stored as
 *   `datagrid:sort:<name>`) and restore it next time, ahead of `defaultSort`; clearing the sort is remembered too.
 *   Give each grid its own name. Default: not saved.
 * @property {(sort: SortState) => void} [onSortChange] Called whenever the sort changes.
 * @property {boolean} [searchable] Render a search box above the table.
 * @property {boolean} [searchColumnSelect] With `searchable`: add a select beside the search box that limits
 *   the search to one column (default: all columns).
 * @property {boolean} [searchButton] With `searchable`: add a Search button; the grid then filters only when it is
 *   clicked or Enter is pressed in the box, not while typing (`searchDebounce` is ignored). Default false.
 * @property {boolean} [exportButton] Render an "Export Excel" button in the toolbar (works without `searchable`)
 *   that calls `exportExcel()`. Default false.
 * @property {boolean} [filterSummary] Render a strip under the toolbar, while a filter is active, with how many rows
 *   matched ("Found 12 of 250") and one chip per active filter (search text with its column, column filters); the
 *   x on a chip removes that filter. Default false.
 * @property {string} [title] Name of the grid, shown at the start (left) of the toolbar as an `<h2 class="dg-title">`
 *   (escaped; the toolbar is rendered for it even without a search box). Default none.
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
 * @property {() => void} [onRefresh] Called when the Refresh button is clicked (same as `on('refresh', fn)`).
 * @property {boolean} [columnPicker] Render a "Settings" button in the toolbar (works without `searchable`) that opens
 *   a modal with a checkbox per data column to show or hide it and, for `sortable` columns, a sort column and
 *   direction (saved by `sortStorageKey`); Apply commits. `resetButton`, `stripedToggle` and `textWrapToggle` add their
 *   part to the same modal and turn the button on by themselves. Default false.
 * @property {string[]} [hiddenColumns] Keys of data columns hidden at first (`columnStorageKey` can override it).
 * @property {string} [columnStorageKey] Remember the hidden columns in `localStorage` under this name
 *   (stored as `datagrid:columns:<name>`) and restore them next time. Give each grid its own name. Default: not saved.
 * @property {(hidden: string[]) => void} [onColumnsChange] Called whenever the set of hidden columns changes.
 * @property {boolean} [reorderableColumns] Let the user drag a header cell onto another to move the column (it lands
 *   before or after it), or focus a header cell and press Alt+Left / Alt+Right to move it one place. Default false.
 * @property {string} [columnOrderStorageKey] Remember the order of the columns in `localStorage` under this name
 *   (stored as `datagrid:columnOrder:<name>`) and restore it next time, whether or not `reorderableColumns` is on.
 *   Give each grid its own name. Default: not saved.
 * @property {(order: string[]) => void} [onColumnOrderChange] Called whenever the order of the columns changes
 *   (same as `on('columnOrderChange', fn)`); receives the key of every column in display order.
 * @property {number} [searchDebounce] Milliseconds to wait after typing before filtering; default 200.
 * @property {Labels} [labels] UI texts.
 * @property {(filter: FilterState | null) => void} [onFilterChange] Called whenever the filter changes.
 * @property {number} [pageSize] Rows per page; enables pagination. Default: off (show all rows).
 * @property {number[]} [pageSizeOptions] Sizes offered in a "rows per page" select, e.g. [10, 20, 50].
 * @property {string} [pageSizeStorageKey] Remember the rows per page in `localStorage` under this name (stored as
 *   `datagrid:pageSize:<name>`) and restore it next time, ahead of `pageSize`. Default: not saved.
 * @property {(page: PageState) => void} [onPageChange] Called whenever the page or page size changes.
 * @property {Partial<Record<IconName, string>>} [icons] Replacement SVG markup per icon. Trusted: it is
 *   inserted as HTML, so pass only markup you control, never user data.
 * @property {boolean} [striped] Zebra rows; default false (`stripedStorageKey` can override it).
 * @property {boolean} [resizableColumns] Let the user drag the right edge of a header cell (or focus the handle and use the
 *   left / right arrow keys) to change a column's width. Action columns are not resizable. Default false.
 * @property {string} [columnWidthStorageKey] With `resizableColumns`: remember the column widths in `localStorage` under
 *   this name (stored as `datagrid:columnWidths:<name>`) and restore them next time. Give each grid its own name.
 *   Default: not saved.
 * @property {boolean} [highlightSearch] Mark where the search text occurs in the cells (`<mark class="dg-mark">`, limited
 *   to the search column when one is chosen). Default true.
 * @property {boolean} [textWrap] Long cell text wraps onto more lines (true) or stays on one line (false); default true
 *   (`textWrapStorageKey` can override it).
 * @property {boolean} [textWrapToggle] Add a "Wrap text" switch to the settings modal so the user can turn wrapping on
 *   or off. Default false.
 * @property {string} [textWrapStorageKey] Remember the wrap choice in `localStorage` under this name (stored as
 *   `datagrid:textWrap:<name>`) and restore it next time, ahead of `textWrap`. Default: not remembered.
 * @property {boolean} [stripedToggle] Add a "Striped rows" switch to the settings modal so the user can turn the
 *   zebra rows on or off. Default false.
 * @property {string} [stripedStorageKey] Remember the striped choice in `localStorage` under this name (stored as
 *   `datagrid:striped:<name>`) and restore it next time, ahead of `striped`. Default: not remembered.
 * @property {boolean} [bordered] Draw a border around every cell (vertical lines too); default false. The same as
 *   `gridLines: 'both'` (`gridLines` wins when both are set).
 * @property {GridLines} [gridLines] Which lines the table draws: 'default' (the theme's row lines), 'horizontal' (row
 *   lines), 'vertical' (column lines), 'both' (every cell bordered) or 'none'. Default 'default' (`gridLinesStorageKey`
 *   can override it). An unknown value throws a `RangeError`.
 * @property {boolean} [gridLinesToggle] Add a "Grid lines" select to the settings modal so the user can pick the mode.
 *   Default false.
 * @property {string} [gridLinesStorageKey] Remember the grid lines choice in `localStorage` under this name (stored as
 *   `datagrid:gridLines:<name>`) and restore it next time, ahead of `gridLines`/`bordered`. Default: not remembered.
 * @property {'compact' | 'comfortable'} [density] Cell padding; default 'comfortable'.
 * @property {boolean} [stickyHeader] Keep the header visible while scrolling.
 * @property {number | string} [maxHeight] Max height of the table area (a number is px, or any CSS length);
 *   taller tables scroll inside it.
 */

/**
 * @typedef {object} ExportOptions
 * @property {string} [filename] Download name; default 'export.xlsx' (`.xlsx` is appended when missing).
 * @property {string} [sheetName] Worksheet name; default 'Sheet1'. Characters Excel forbids are replaced.
 */

/**
 * @typedef {object} Labels
 * @property {string} [search] aria-label of the search box; default 'Search'.
 * @property {string} [empty] Text shown when there are no rows; default 'No data'.
 * @property {string} [pagination] aria-label of the pager <nav>; default 'Pagination'.
 * @property {string} [prev] aria-label of the previous button; default 'Previous'.
 * @property {string} [next] aria-label of the next button; default 'Next'.
 * @property {string} [first] aria-label of the first page button; default 'First page'.
 * @property {string} [last] aria-label of the last page button; default 'Last page'.
 * @property {string} [clear] aria-label of the clear search button; default 'Clear search'.
 * @property {string} [searchButton] Text of the Search button (`searchButton` option); default 'Search'.
 * @property {string} [searchColumn] aria-label of the search column select; default 'Search in'.
 * @property {string} [dateFrom] aria-label of the "from" date box shown for a `date` search column; default 'From'.
 * @property {string} [dateTo] aria-label of the "to" date box; default 'To'.
 * @property {string} [allValues] First option of the value select shown for an enum search column; default 'All'.
 * @property {string} [allColumns] First option of the search column select; default 'All columns'.
 * @property {string} [exportExcel] Text of the Export button (`exportButton` option); default 'Export Excel'.
 * @property {string} [columns] aria-label and tooltip of the Settings button (see `columnPicker`); default 'Settings'.
 * @property {string} [columnsSection] Heading of the column list in the settings modal; default 'Columns'.
 * @property {string} [sortSection] Heading of the sort selects in the settings modal; default 'Sorting'.
 * @property {string} [displaySection] Heading of the striped / wrap switches and the grid lines select in the settings modal; default 'Display'.
 * @property {string} [columnSettings] Title of the settings modal; default 'Settings'.
 * @property {string} [apply] Apply button of the settings modal; default 'Apply'.
 * @property {string} [sortBy] Label of the sort column select in the settings modal; default 'Sort by'.
 * @property {string} [noSort] First option of that select (no sorting); default 'No sorting'.
 * @property {string} [sortDirection] Label of the sort direction select; default 'Direction'.
 * @property {string} [ascending] Ascending option of the direction select; default 'Ascending'.
 * @property {string} [descending] Descending option of the direction select; default 'Descending'.
 * @property {string} [refresh] aria-label and tooltip of the Refresh button (`refreshButton`); default 'Refresh'.
 * @property {string} [resetView] Text of the Reset view button and title of its confirm dialog (`resetButton`); default 'Reset view'.
 * @property {(text: string) => string} [removeFilter] aria-label of a filter chip's remove button, given the chip's
 *   text (`filterSummary`); default 'Remove filter <text>'.
 * @property {(shown: number, total: number) => string} [filterSummary] Count shown beside the filter chips
 *   (`filterSummary`); default 'Found 12 of 250'.
 * @property {string} [toggleDescription] aria-label and tooltip of the button that hides or shows `description`;
 *   default 'Show or hide description'.
 * @property {string} [stripedRows] Text of the `stripedToggle` switch; default 'Striped rows'.
 * @property {string} [textWrap] Text of the `textWrapToggle` switch; default 'Wrap text'.
 * @property {string} [gridLines] Label of the `gridLinesToggle` select; default 'Grid lines'.
 * @property {string} [gridLinesDefault] 'default' option of that select; default 'Default'.
 * @property {string} [gridLinesHorizontal] 'horizontal' option; default 'Horizontal'.
 * @property {string} [gridLinesVertical] 'vertical' option; default 'Vertical'.
 * @property {string} [gridLinesBoth] 'both' option; default 'Both'.
 * @property {string} [gridLinesNone] 'none' option; default 'None'.
 * @property {(name: string) => string} [resizeColumn] Accessible name of a column's resize handle (`resizableColumns`);
 *   default 'Resize <name>'.
 * @property {string} [confirmOk] Confirm button of the built-in Reset view modal; default 'Reset'.
 * @property {string} [cancel] Cancel button of the built-in Reset view modal; default 'Cancel'.
 * @property {string} [confirmReset] Question asked before the Reset view button resets (`resetButton`); default
 *   'Reset the view? Search, sorting, hidden columns and rows per page go back to their defaults.'.
 * @property {string} [yes] Accessible name of a `true` value in a `boolean` column; default 'Yes'.
 * @property {string} [no] Accessible name of a `false` value in a `boolean` column; default 'No'.
 * @property {string} [pageSize] Label of the page size select; default 'Rows per page'.
 * @property {(from: number, to: number, total: number) => string} [summary] Summary text;
 *   default 'Showing 1–10 of 25' (and 'Showing 0 of 0' when empty).
 */

export {};
