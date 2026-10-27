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
 * @typedef {object} GridState Internal state of a DataGrid.
 * @property {Column[]} columns
 * @property {Row[]} rows
 * @property {SortState} sort
 * @property {FilterState | null} filter
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
 */

/**
 * @typedef {object} Labels
 * @property {string} [search] aria-label of the search box; default 'Search'.
 * @property {string} [empty] Text shown when there are no rows; default 'No data'.
 */

export {};
