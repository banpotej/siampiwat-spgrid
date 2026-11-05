// @ts-check
import { escapeHtml } from '../utils/escape.js';
import { parseDayRange } from '../core/dates.js';

/**
 * What stands in for the search box while the search column is not a plain text one; both start hidden: the value
 * select of an enum column, and a from / to pair of date boxes for a date column.
 *
 * @param {{ label: string, all: string, from: string, to: string }} text aria-labels, and the select's first option.
 * @returns {string}
 */
export const renderSearchAlternatives = ({ label, all, from, to }) =>
  `<select class="spg-search-value" aria-label="${escapeHtml(label)}" hidden><option value="">${escapeHtml(all)}</option></select>` +
  `<div class="spg-search-range" role="group" aria-label="${escapeHtml(label)}" hidden>` +
  `<input type="date" class="spg-date-from" aria-label="${escapeHtml(from)}">` +
  `<span aria-hidden="true">–</span>` +
  `<input type="date" class="spg-date-to" aria-label="${escapeHtml(to)}"></div>`;

/**
 * Show the control that fits the search column: the value select (filled from `options`) for 'enum', the date
 * boxes for 'date', else the search box. The hidden box keeps the search text ('FROM..TO' for dates), so
 * everything else keeps reading it; the others only mirror it.
 *
 * @param {{ input: HTMLInputElement | null, select: HTMLSelectElement | null, range: HTMLElement | null }} parts
 * @param {'enum' | 'date' | 'text'} kind
 * @param {{ value: string, label: string }[] | null} options Values of the enum search column, or null.
 */
export function syncSearchValue({ input, select, range }, kind, options) {
  if (!input || !select || !range) return;
  input.hidden = kind !== 'text';
  select.hidden = kind !== 'enum';
  range.hidden = kind !== 'date';
  if (kind === 'enum' && options) {
    const [all] = select.options;
    // `new Option` sets text, never markup, so labels need no escaping.
    select.replaceChildren(all, ...options.map((o) => new Option(o.label, o.value)));
    const text = input.value.trim().toLowerCase();
    select.value = options.find((o) => o.value.toLowerCase() === text)?.value ?? '';
  }
  if (kind === 'date') {
    const { from, to } = parseDayRange(input.value);
    const [fromBox, toBox] = range.querySelectorAll('input');
    fromBox.value = from;
    toBox.value = to;
  }
}

/**
 * @param {HTMLElement} range The date boxes.
 * @returns {string} Their search text: 'FROM..TO', or '' when both are empty.
 */
export function rangeText(range) {
  const [from, to] = [...range.querySelectorAll('input')].map((box) => box.value);
  return from || to ? `${from}..${to}` : '';
}
