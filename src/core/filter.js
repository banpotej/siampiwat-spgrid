// @ts-check

/** @typedef {import('../types.js').Row} Row */
/** @typedef {import('../types.js').FilterState} FilterState */

const DEFAULT_LOCALE = 'th';

/**
 * Case-fold and canonically compose, so 'É', 'é' and 'é' compare equal.
 *
 * @param {unknown} value
 * @param {string} locale
 * @returns {string}
 */
const fold = (value, locale) => String(value).toLocaleLowerCase(locale).normalize('NFC');

/**
 * @param {unknown} text
 * @param {string} locale
 * @returns {string[]} Folded, non-empty words; [] for null/undefined/blank.
 */
const toWords = (text, locale) =>
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
 * Filter rows by a global search and/or per-column filters. Pure: returns a
 * new array of the same row objects and never mutates `rows`.
 *
 * - `search`: case-insensitive, accent-safe substring match. Whitespace-separated
 *   words are ANDed; each word may match a different column.
 * - `columns`: keys the global search looks at (default: every key of the row).
 * - `columnFilters`: `{ key: text }`, ANDed across columns; blank values are ignored.
 * - Search and column filters combine with AND.
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

  return rows.filter((row) => {
    for (const [key, words] of columnWords) {
      if (!wordHits(row[key], words, locale).every(Boolean)) return false;
    }
    if (searchWords.length === 0) return true;

    const keys = filter?.columns ?? Object.keys(row);
    const matched = searchWords.map(() => false);
    for (const key of keys) {
      wordHits(row[key], searchWords, locale).forEach((hit, i) => {
        if (hit) matched[i] = true;
      });
    }
    return matched.every(Boolean);
  });
}
