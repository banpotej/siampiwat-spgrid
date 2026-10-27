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
 * @property {ActionDef[]} [actions] Makes this an action column: one button per action in each row. `key` is
 *   then only an identifier; the column is never sortable, searched or filtered.
 */

/**
 * @typedef {object} ActionDef
 * @property {string} name Value of `data-action`, reported as `action` in the 'action' event.
 * @property {string} label Button text (escaped).
 * @property {string} [className] Extra class(es) for styling, e.g. 'btn-cancel'.
 * @property {string} [title] Tooltip (escaped).
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
 * @typedef {object} CellClickPayload
 * @property {string} key Key of the column the click happened in.
 * @property {Row} row
 * @property {unknown} [rowKey]
 * @property {MouseEvent} originalEvent
 */

/**
 * Names of the built-in icons (Material Symbols); see `options.icons`.
 * @typedef {'arrow_upward' | 'arrow_downward' | 'unfold_more' | 'chevron_left' | 'chevron_right' | 'first_page' | 'last_page' | 'search' | 'close' | 'inbox'} IconName
 */

/**
 * @typedef {'asc' | 'desc'} SortDirection
 */

/**
 * @typedef {{ key: string, direction: SortDirection } | null} SortState
 */

/**
 * @typedef {object} FilterState
 * @property {string | null} [search] Global search; whitespace-separated words are ANDed.
 * @property {string[]} [columns] Column keys the global search looks at; default: every key of the row.
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
 */

/**
 * Payload of each grid event, by name.
 * @typedef {{ sortChange: SortState, filterChange: FilterState | null, pageChange: PageState,
 *   action: ActionEventPayload, cellClick: CellClickPayload }} GridEvents
 */

/**
 * @typedef {object} DataGridOptions
 * @property {Column[]} columns
 * @property {Row[]} [rows]
 * @property {string} [rowKey] Field that identifies a row; rendered as `data-row-id` and reported as `rowKey`.
 * @property {(payload: ActionEventPayload) => void} [onAction] Called when an action button or a
 *   `[data-cell-action]` element is clicked.
 * @property {string} [locale] Locale for sorting strings and lower-casing search text; default 'th'.
 * @property {(sort: SortState) => void} [onSortChange] Called whenever the sort changes.
 * @property {boolean} [searchable] Render a search box above the table.
 * @property {number} [searchDebounce] Milliseconds to wait after typing before filtering; default 200.
 * @property {Labels} [labels] UI texts.
 * @property {(filter: FilterState | null) => void} [onFilterChange] Called whenever the filter changes.
 * @property {number} [pageSize] Rows per page; enables pagination. Default: off (show all rows).
 * @property {number[]} [pageSizeOptions] Sizes offered in a "rows per page" select, e.g. [10, 20, 50].
 * @property {(page: PageState) => void} [onPageChange] Called whenever the page or page size changes.
 * @property {Partial<Record<IconName, string>>} [icons] Replacement SVG markup per icon. Trusted: it is
 *   inserted as HTML, so pass only markup you control, never user data.
 * @property {boolean} [striped] Zebra rows; default false.
 * @property {'compact' | 'comfortable'} [density] Cell padding; default 'comfortable'.
 * @property {boolean} [stickyHeader] Keep the header visible while scrolling.
 * @property {number | string} [maxHeight] Max height of the table area (a number is px, or any CSS length);
 *   taller tables scroll inside it.
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
 * @property {string} [pageSize] Label of the page size select; default 'Rows per page'.
 * @property {(from: number, to: number, total: number) => string} [summary] Summary text;
 *   default 'Showing 1–10 of 25' (and 'Showing 0 of 0' when empty).
 */

export {};
