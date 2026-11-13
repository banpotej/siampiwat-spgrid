// @ts-check

/**
 * @typedef {object} GroupInfo Which group a header (`groupBy`) is for; the second argument of `labels.groupCount`.
 * @property {number} level 0 for the outermost group.
 * @property {string} column Key of the column this level groups by.
 * @property {import('./types.js').Row[]} rows The group's rows in the list.
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
 * @property {string} [exportFields] Title of the modal that lists the fields to export (`exportColumnSelect` option); default 'Choose fields to export'.
 * @property {string} [advancedFilter] aria-label and tooltip of the Advanced filter button (`advancedFilter` option), and the title of its modal; default 'Advanced filter'.
 * @property {string} [advMatch] Label of the all / any select in that modal; default 'Match'.
 * @property {string} [advMatchAll] Option of that select: every condition must hold (AND); default 'All conditions'.
 * @property {string} [advMatchAny] Option of that select: one condition is enough (OR); default 'Any condition'.
 * @property {string} [advField] aria-label of a condition's field select; default 'Field'.
 * @property {string} [advOperator] aria-label of a condition's operator select; default 'Operator'.
 * @property {string} [advValue] aria-label of a condition's value box; default 'Value'.
 * @property {string} [advAdd] Button that adds a condition row; default 'Add condition'.
 * @property {string} [advRemove] aria-label of the button that removes a condition row; default 'Remove condition'.
 * @property {(op: import('./types.js').ConditionOperator) => string} [conditionOperator] Text of an operator, in the modal and in the
 *   filter chips; default 'contains', 'at least', 'between', ...
 * @property {string} [conditionAnd] Word between the parts of an AND group in a filter chip; default 'and'.
 * @property {string} [conditionOr] Word between the parts of an OR group in a filter chip; default 'or'.
 * @property {string} [exportFilename] Label of the file name box in that modal; default 'File name'.
 * @property {string} [exportSearch] Label of the search box in that modal, which narrows the rows to export; default 'Rows to export (search)'.
 * @property {(count: number) => string} [exportRowCount] Line under that search box; default '12 rows will be exported'.
 * @property {(more: number) => string} [exportPreviewMore] Line under the preview table when more rows follow; default '… and 50 more rows'.
 * @property {string} [exportPreviewEmpty] Text of the preview when no row is left; default 'No rows match'.
 * @property {string} [columns] aria-label and tooltip of the Settings button (see `columnPicker`); default 'Settings'.
 * @property {string} [columnsSection] Heading of the column list in the settings modal; default 'Columns'.
 * @property {string} [selectAll] Button under the column list that shows every column; default 'Select all'.
 * @property {string} [clearAll] Button under the column list that hides every column but the first; default 'Clear all'.
 * @property {string} [sortSection]Heading of the sort selects in the settings modal; default 'Sorting'.
 * @property {string} [displaySection] Heading of the striped / wrap switches and the grid lines select in the settings modal; default 'Display'.
 * @property {string} [groupSection] Heading of the group selects in the settings modal (`groupByToggle`); default 'Grouping'.
 * @property {string} [groupBy] Label of the first group select; default 'Group by'.
 * @property {string} [thenBy] Label of the selects for the inner levels; default 'Then by'.
 * @property {string} [noGrouping] The empty option of those selects; default 'No grouping'.
 * @property {string} [columnSettings] Title of the settings modal; default 'Settings'.
 * @property {string} [apply] Apply button of the settings modal; default 'Apply'.
 * @property {string} [sortBy] Label of the sort column select in the settings modal; default 'Sort by'.
 * @property {string} [noSort] First option of that select (no sorting); default 'No sorting'.
 * @property {string} [sortDirection] Label of the sort direction select; default 'Direction'.
 * @property {string} [ascending] Ascending option of the direction select; default 'Ascending'.
 * @property {string} [descending] Descending option of the direction select; default 'Descending'.
 * @property {string} [refresh] aria-label and tooltip of the Refresh button (`refreshButton`); default 'Refresh'.
 * @property {string} [collapseAllGroups] aria-label and tooltip of the toolbar button that collapses every group (`groupToggleAllButton`); default 'Collapse all'.
 * @property {string} [expandAllGroups] aria-label and tooltip of the same button while every group is collapsed; default 'Expand all'.
 * @property {string} [resetView] Text of the Reset view button and title of its confirm dialog (`resetButton`); default 'Reset view'.
 * @property {(text: string) => string} [removeFilter] aria-label of a filter chip's remove button, given the chip's
 *   text (`filterSummary`); default 'Remove filter <text>'.
 * @property {(count: number, group: GroupInfo) => string} [groupCount] Count in a group header (`groupBy`), given how
 *   many rows of the group are on the page and which group it is (`level`, `column`, `rows`), so each level can word
 *   its count differently; default '(3)'.
 * @property {(count: number) => string} [rowCount] Text of the row counter (`rowCount` option), given how many rows match the
 *   search and filters (all pages); default '12 rows'.
 * @property {(shown: number, total: number) => string} [filterSummary] Count shown beside the filter chips
 *   (`filterSummary`); default 'Found 12 of 250'.
 * @property {string} [calendarToday] Today button of the calendar (`calendar` option); default 'Today'.
 * @property {string} [calendarPrev] aria-label of the calendar's previous day / week button; default 'Previous'.
 * @property {string} [calendarNext] aria-label of the calendar's next day / week button; default 'Next'.
 * @property {string} [calendarViews] aria-label of the group of calendar view buttons; default 'Calendar view'.
 * @property {string} [calendarAgenda] View button 'agenda'; default 'Agenda'.
 * @property {string} [calendarDay] View button 'day'; default 'Day'.
 * @property {string} [calendarWorkWeek] View button 'workWeek'; default 'Work week'.
 * @property {string} [calendarWeek] View button 'week'; default 'Week'.
 * @property {string} [calendarNoEvents] Text of an empty day in the agenda; default 'No events'.
 * @property {string} [viewGrid] aria-label and tooltip of the view button (`viewToggle`) while the calendar shows, for the click that goes back to the table; default 'Show as table'.
 * @property {string} [viewCalendar] aria-label and tooltip of the view button (`viewToggle`) while the table shows, for the click that opens the calendar; default 'Show as calendar'.
 * @property {string} [toggleDescription] aria-label and tooltip of the button that hides or shows `description`;
 *   default 'Show or hide description'.
 * @property {string} [stripedRows] Text of the `stripedToggle` switch; default 'Striped rows'.
 * @property {string} [textWrap] Text of the `textWrapToggle` switch; default 'Wrap text'.
 * @property {string} [close] aria-label of the round close button on the settings modal's corner; default 'Close'.
 * @property {string} [gridLines] Label of the `gridLinesToggle` select; default 'Grid lines'.
 * @property {string} [gridLinesDefault] 'default' option of that select; default 'Default'.
 * @property {string} [gridLinesHorizontal] 'horizontal' option; default 'Horizontal'.
 * @property {string} [gridLinesVertical] 'vertical' option; default 'Vertical'.
 * @property {string} [gridLinesBoth] 'both' option; default 'Both'.
 * @property {string} [gridLinesNone] 'none' option; default 'None'.
 * @property {string} [lineStyle] Label of the `lineStyleToggle` select; default 'Line style'.
 * @property {string} [lineStyleDefault] 'default' option of that select; default 'Default'.
 * @property {string} [lineStyleSolid] 'solid' option; default 'Solid'.
 * @property {string} [lineStyleDashed] 'dashed' option; default 'Dashed'.
 * @property {string} [lineStyleDotted] 'dotted' option; default 'Dotted'.
 * @property {string} [details] Small heading above the title of the `showDetails` modal; default 'Details'.
 * @property {string} [freezeColumns] Label of the frozen columns select (`freezeColumnsToggle`); default 'Frozen columns'.
 * @property {string} [freezeColumnsNone] 0 option of that select; default 'None'.
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
