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
 * @typedef {object} DataGridOptions
 * @property {Column[]} columns
 * @property {Row[]} [rows]
 * @property {string} [locale] Collator locale used to sort strings; default 'th'.
 * @property {(sort: SortState) => void} [onSortChange] Called whenever the sort changes.
 */

export {};
