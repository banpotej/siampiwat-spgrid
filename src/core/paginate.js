// @ts-check

/** @typedef {import('../types.js').Row} Row */
/** @typedef {import('../types.js').PageState} PageState */
/** @typedef {import('../types.js').PageResult} PageResult */

/**
 * @param {unknown} n
 * @returns {n is number}
 */
const isPositiveInteger = (n) => typeof n === 'number' && Number.isInteger(n) && n > 0;

/**
 * Clamp a 1-based page into [1, totalPages]. NaN/undefined mean page 1;
 * fractions are truncated; +-Infinity clamp to the ends.
 *
 * @param {number | undefined} page
 * @param {number} totalPages
 * @returns {number}
 */
function clampPage(page, totalPages) {
  const p = Math.trunc(page ?? 1);
  return Number.isNaN(p) ? 1 : Math.min(Math.max(p, 1), totalPages);
}

/**
 * Slice one page out of `rows`. Pure: returns a new array of the same row
 * objects and never mutates `rows`. `page` is 1-based and clamped into range;
 * an empty `rows` still has one (empty) page.
 *
 * @param {Row[]} rows
 * @param {{ page?: number, pageSize: number }} state
 * @returns {PageResult}
 * @throws {RangeError} `pageSize` is not a positive integer
 */
export function paginate(rows, { page, pageSize }) {
  if (!isPositiveInteger(pageSize)) {
    throw new RangeError(`paginate: pageSize must be a positive integer, got ${pageSize}`);
  }
  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const current = clampPage(page, totalPages);
  const start = (current - 1) * pageSize;
  return {
    rows: rows.slice(start, start + pageSize),
    page: current,
    pageSize,
    totalRows,
    totalPages,
  };
}

/**
 * Page numbers for a pager, with 'ellipsis' markers for skipped ranges. Always
 * `maxButtons` entries once there are more pages than that, always includes the
 * first, last and current page, and an ellipsis never hides just one page.
 * E.g. page 5 of 20 -> [1, 'ellipsis', 4, 5, 6, 'ellipsis', 20].
 *
 * @param {number} page Current page; clamped into range.
 * @param {number} totalPages
 * @param {number} [maxButtons] At least 5; default 7.
 * @returns {(number | 'ellipsis')[]}
 * @throws {RangeError} `totalPages` is not a positive integer, or `maxButtons` an integer < 5
 */
export function getPageWindow(page, totalPages, maxButtons = 7) {
  if (!isPositiveInteger(totalPages)) {
    throw new RangeError(`getPageWindow: totalPages must be a positive integer, got ${totalPages}`);
  }
  if (!Number.isInteger(maxButtons) || maxButtons < 5) {
    throw new RangeError(`getPageWindow: maxButtons must be an integer >= 5, got ${maxButtons}`);
  }
  /** @param {number} from @param {number} to */
  const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
  if (totalPages <= maxButtons) return range(1, totalPages);

  const current = clampPage(page, totalPages);
  const width = maxButtons - 4; // pages between the two ellipses
  const first = current - Math.floor(width / 2);
  const last = first + width - 1;

  if (first <= 3) return [...range(1, maxButtons - 2), 'ellipsis', totalPages];
  if (last >= totalPages - 2) {
    return [1, 'ellipsis', ...range(totalPages - maxButtons + 3, totalPages)];
  }
  return [1, 'ellipsis', ...range(first, last), 'ellipsis', totalPages];
}
