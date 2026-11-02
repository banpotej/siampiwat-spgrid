// @ts-check
import { DEFAULT_LOCALE, fold } from './filter.js';

/**
 * Where the search words occur in `text`, the way the global search matches them (case-insensitive,
 * accent-safe substring). Pure.
 *
 * @param {string} text
 * @param {string[]} words Folded words, as `toWords()` gives them.
 * @param {string} [locale] Locale for lower-casing; default 'th'.
 * @returns {[number, number][]} Sorted, non-overlapping `[start, end)` ranges into `text`; [] when nothing matches
 *   (or when folding changes the text's length, so the ranges could not be mapped back).
 */
export function matchRanges(text, words, locale = DEFAULT_LOCALE) {
  if (words.length === 0 || text === '') return [];
  const folded = fold(text, locale);
  if (folded.length !== text.length) return [];
  /** @type {[number, number][]} */
  const found = [];
  for (const word of words) {
    for (let at = folded.indexOf(word); at !== -1; at = folded.indexOf(word, at + word.length)) {
      found.push([at, at + word.length]);
    }
  }
  found.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  /** @type {[number, number][]} */
  const merged = [];
  for (const [start, end] of found) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}
