// @ts-check

/**
 * @typedef {Record<string, unknown>} Row
 */

/**
 * @typedef {object} Column
 * @property {string} key Property of the row to display.
 * @property {string} [label] Header text; defaults to `key`.
 * @property {boolean} [sortable] Header click / Enter / Space cycles asc -> desc -> none.
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
 * @typedef {{ sortChange: SortState, filterChange: FilterState | null, pageChange: PageState }} GridEvents
 */

/**
 * @typedef {object} DataGridOptions
 * @property {Column[]} columns
 * @property {Row[]} [rows]
 * @property {string} [locale] Locale for sorting strings and lower-casing search text; default 'th'.
 * @property {(sort: SortState) => void} [onSortChange] Called whenever the sort changes.
 * @property {boolean} [searchable] Render a search box above the table.
 * @property {number} [searchDebounce] Milliseconds to wait after typing before filtering; default 200.
 * @property {Labels} [labels] UI texts.
 * @property {(filter: FilterState | null) => void} [onFilterChange] Called whenever the filter changes.
 * @property {number} [pageSize] Rows per page; enables pagination. Default: off (show all rows).
 * @property {number[]} [pageSizeOptions] Sizes offered in a "rows per page" select, e.g. [10, 20, 50].
 * @property {(page: PageState) => void} [onPageChange] Called whenever the page or page size changes.
 */

/**
 * @typedef {object} Labels
 * @property {string} [search] aria-label of the search box; default 'Search'.
 * @property {string} [empty] Text shown when there are no rows; default 'No data'.
 * @property {string} [pagination] aria-label of the pager <nav>; default 'Pagination'.
 * @property {string} [prev] Previous button text; default 'Previous'.
 * @property {string} [next] Next button text; default 'Next'.
 * @property {string} [pageSize] Label of the page size select; default 'Rows per page'.
 * @property {(from: number, to: number, total: number) => string} [summary] Summary text;
 *   default 'Showing 1–10 of 25' (and 'Showing 0 of 0' when empty).
 */

export {};
