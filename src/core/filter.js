// @ts-check
import { dayOf, parseDayRange } from './dates.js';

/** @typedef {import('../types.js').Row} Row */
/** @typedef {import('../types.js').FilterState} FilterState */

export const DEFAULT_LOCALE = 'th';

/**
 * Case-fold and canonically compose, so 'É', 'é' and 'é' compare equal.
 *
 * @param {unknown} value
 * @param {string} locale
 * @returns {string}
 */
export const fold = (value, locale) => String(value).toLocaleLowerCase(locale).normalize('NFC');

/**
 * @param {unknown} text
 * @param {string} locale
 * @returns {string[]} Folded, non-empty words; [] for null/undefined/blank.
 */
export const toWords = (text, locale) =>
  text === null || text === undefined ? [] : fold(text, locale).split(/\s+/).filter(Boolean);

/**
 * null/undefined cells never match; everything else is matched through String().
 *
 * @param {unknown} cell
 * @param {string[]} words
 * @param {string} locale
 * @returns {boolean[]} For each word, whether this cell contains it.
 */
const wordHits = (cell, words, locale) => {
  if (cell === null || cell === undefined) return words.map(() => false);
  const text = fold(cell, locale);
  return words.map((w) => text.includes(w));
};

/**
 * Canonical form of a filter: only active parts, copied; null when nothing is active.
 * `columns` is dropped (it is a grid-level setting, not part of the user's filter).
 *
 * @param {FilterState | null | undefined} filter
 * @returns {FilterState | null}
 */
export function normalizeFilter(filter) {
  if (!filter) return null;
  /** @type {FilterState} */
  const out = {};
  if (typeof filter.search === 'string' && filter.search.trim() !== '') out.search = filter.search;
  /** @type {Record<string, string>} */
  const columnFilters = {};
  for (const [key, text] of Object.entries(filter.columnFilters ?? {})) {
    if (typeof text === 'string' && text.trim() !== '') columnFilters[key] = text;
  }
  if (Object.keys(columnFilters).length > 0) out.columnFilters = columnFilters;
  return out.search === undefined && !out.columnFilters ? null : out;
}

/**
 * @param {FilterState | null | undefined} a
 * @param {FilterState | null | undefined} b
 * @returns {boolean} Whether both normalize to the same filter.
 */
export function isSameFilter(a, b) {
  const x = normalizeFilter(a);
  const y = normalizeFilter(b);
  if (!x || !y) return x === y;
  if (x.search !== y.search) return false;
  const xf = Object.entries(x.columnFilters ?? {});
  const yf = y.columnFilters ?? {};
  return xf.length === Object.keys(yf).length && xf.every(([key, text]) => yf[key] === text);
}

/**
 * A copy of `filter` without one part of it.
 *
 * @param {FilterState | null | undefined} filter
 * @param {{ type: 'search' } | { type: 'column', key: string }} part The global search, or one `columnFilters` entry.
 * @returns {FilterState | null} Normalized; null when nothing is left.
 */
export function removeFilterPart(filter, part) {
  const next = { ...filter };
  if (part.type === 'search') delete next.search;
  else next.columnFilters = { ...next.columnFilters, [part.key]: null };
  return normalizeFilter(next);
}

/**
 * The filter to store when `filter` is applied on top of `current`.
 *
 * @param {FilterState | null | undefined} current
 * @param {FilterState | null | undefined} filter
 * @param {string[]} keys Column keys `columnFilters` may name.
 * @returns {FilterState | null | undefined} The normalized filter (null clears), or undefined when nothing changes.
 * @throws {RangeError} a `columnFilters` key is not in `keys`
 */
export function resolveFilter(current, filter, keys) {
  const next = normalizeFilter(filter);
  for (const key of Object.keys(next?.columnFilters ?? {})) {
    if (!keys.includes(key)) throw new RangeError(`DataGrid: unknown column "${key}"`);
  }
  return isSameFilter(current, next) ? undefined : next;
}

/**
 * Filter rows by a global search and/or per-column filters. Pure: returns a
 * new array of the same row objects and never mutates `rows`.
 *
 * - `search`: case-insensitive, accent-safe substring match. Whitespace-separated
 *   words are ANDed; each word may match a different column.
 * - `columns`: keys the global search looks at (default: every key of the row).
 * - `columnFilters`: `{ key: text }`, ANDed across columns; blank values are ignored.
 * - Search and column filters combine with AND.
 * - `exact`: the search is one value, equal (case-insensitive) to a whole cell of `columns`, not a substring.
 * - `range`: the search is 'FROM..TO' (days, 'YYYY-MM-DD', either may be empty) and a date cell of `columns` must fall in it.
 *
 * @param {Row[]} rows
 * @param {FilterState} [filter]
 * @param {{ locale?: string }} [options] Locale for lower-casing; default 'th'.
 * @returns {Row[]}
 */
export function filterRows(rows, filter, options = {}) {
  const locale = options.locale ?? DEFAULT_LOCALE;
  const searchWords = toWords(filter?.search, locale);
  const columnWords = Object.entries(filter?.columnFilters ?? {})
    .map(([key, text]) => /** @type {const} */ ([key, toWords(text, locale)]))
    .filter(([, words]) => words.length > 0);

  if (searchWords.length === 0 && columnWords.length === 0) return [...rows];
  const range =
    filter?.range === true && searchWords.length > 0 ? parseDayRange(filter.search) : null;
  const exact =
    filter?.exact === true && searchWords.length > 0
      ? fold(String(filter.search).trim(), locale)
      : null;

  return rows.filter((row) => {
    for (const [key, words] of columnWords) {
      if (!wordHits(row[key], words, locale).every(Boolean)) return false;
    }
    if (searchWords.length === 0) return true;

    const keys = filter?.columns ?? Object.keys(row);
    if (range) {
      if (range.from === '' && range.to === '') return true;
      return keys.some((key) => {
        const day = dayOf(row[key]);
        return day !== null && day >= (range.from || day) && day <= (range.to || day);
      });
    }
    if (exact !== null) {
      return keys.some((key) => row[key] != null && fold(row[key], locale).trim() === exact);
    }
    const matched = searchWords.map(() => false);
    for (const key of keys) {
      wordHits(row[key], searchWords, locale).forEach((hit, i) => {
        if (hit) matched[i] = true;
      });
    }
    return matched.every(Boolean);
  });
}
