// @ts-check
import { isActionColumn } from '../core/columns.js';
import { matchRanges } from '../core/highlight.js';

/** @typedef {import('../types.js').Column} Column */

/**
 * Wrap the matches inside the text nodes of `cell` in <mark class="dg-mark">. Built with DOM calls, so cell
 * content is never re-parsed as HTML.
 *
 * @param {HTMLElement} cell
 * @param {string[]} words
 * @param {string | undefined} locale
 */
function markText(cell, words, locale) {
  const doc = cell.ownerDocument;
  const walker = doc.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
  /** @type {Text[]} */
  const nodes = [];
  while (walker.nextNode()) nodes.push(/** @type {Text} */ (walker.currentNode));
  for (const node of nodes) {
    const ranges = matchRanges(node.data, words, locale);
    if (ranges.length === 0) continue;
    const fragment = doc.createDocumentFragment();
    let at = 0;
    for (const [start, end] of ranges) {
      if (start > at) fragment.append(node.data.slice(at, start));
      const mark = doc.createElement('mark');
      mark.className = 'dg-mark';
      mark.textContent = node.data.slice(start, end);
      fragment.append(mark);
      at = end;
    }
    if (at < node.data.length) fragment.append(node.data.slice(at));
    node.replaceWith(fragment);
  }
}

/**
 * Highlight the search words in the rendered table body.
 *
 * @param {HTMLElement} host Holds the rendered table.
 * @param {Column[]} columns The rendered columns, in order (cell i belongs to column i).
 * @param {string[]} words Folded search words.
 * @param {{ locale?: string, only?: string | null, whole?: boolean }} [options] `only`: a column key the search is limited
 *   to. `whole`: mark the whole cell (class `dg-match`) instead of the matched text; for a search on an enum column, where
 *   every shown row matches the whole cell (the cell may show a label, not the value, so its text is not compared).
 */
export function highlightSearch(host, columns, words, { locale, only, whole = false } = {}) {
  if (words.length === 0) return;
  for (const row of host.querySelectorAll('tbody tr:not(.dg-empty):not(.dg-group-row)')) {
    columns.forEach((column, i) => {
      if (isActionColumn(column) || (only && column.key !== only)) return;
      const cell = /** @type {HTMLElement | undefined} */ (row.children[i]);
      if (!cell) return;
      if (whole) cell.classList.add('dg-match');
      else markText(cell, words, locale);
    });
  }
}
