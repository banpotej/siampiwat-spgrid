// @ts-check

/** @typedef {import('../types.js').Labels} Labels */

/** @type {Required<Labels>} */
const DEFAULT_LABELS = {
  search: 'Search',
  empty: 'No data',
  pagination: 'Pagination',
  prev: 'Previous',
  next: 'Next',
  first: 'First page',
  last: 'Last page',
  clear: 'Clear search',
  pageSize: 'Rows per page',
  summary: (from, to, total) =>
    total === 0 ? 'Showing 0 of 0' : `Showing ${from}–${to} of ${total}`,
};

/**
 * Defaults overlaid with the user's labels; `undefined` values keep the default.
 *
 * @param {Labels} [labels]
 * @returns {Required<Labels>}
 */
export function resolveLabels(labels) {
  const given = Object.entries(labels ?? {}).filter(([, value]) => value !== undefined);
  return { ...DEFAULT_LABELS, ...Object.fromEntries(given) };
}
