// @ts-check
import { readJson } from '../utils/storage.js';

export const FREEZE_PREFIX = 'datagrid:freezeColumns:';

/** @param {unknown} value @returns {value is number} A whole number, 0 or more. */
export const isFreezeCount = (value) =>
  Number.isInteger(value) && /** @type {number} */ (value) >= 0;

/**
 * The frozen column count saved under `FREEZE_PREFIX + storageKey`, or `fallback` when nothing usable is saved.
 *
 * @param {string | undefined} storageKey
 * @param {number} fallback
 * @returns {number}
 */
export function loadFreezeColumns(storageKey, fallback) {
  const saved = storageKey === undefined ? undefined : readJson(FREEZE_PREFIX + storageKey);
  return isFreezeCount(saved) ? saved : fallback;
}

/**
 * Freeze the first `count` columns of the rendered table: their header and body cells get `dg-frozen` and stick to
 * the start edge while the table scrolls sideways, each one past the columns before it (`--dgi-freeze-start`, set
 * through the CSSOM). The last one also gets `dg-frozen-last` for the shadow on its far edge. Group header rows
 * span every column and are left alone. Safe to call again: it first undoes the previous call.
 *
 * @param {HTMLElement} host Element the table is rendered into.
 * @param {number} count Leading columns to freeze; one column always stays free, so it is capped below the column count.
 */
export function freezeColumns(host, count) {
  for (const cell of host.querySelectorAll('.dg-frozen')) {
    cell.classList.remove('dg-frozen', 'dg-frozen-last');
    /** @type {HTMLElement} */ (cell).style.removeProperty('--dgi-freeze-start');
  }
  const heads = [...host.querySelectorAll('thead th')];
  const n = Math.min(count, heads.length - 1);
  if (n < 1) return;
  const widths = heads.slice(0, n).map((th) => th.getBoundingClientRect().width); // all measured before any is changed
  const rows = [...host.querySelectorAll('tbody tr[data-row-index]')];
  let start = 0;
  widths.forEach((width, i) => {
    const cells = [heads[i], ...rows.map((tr) => tr.children[i])];
    for (const cell of cells) {
      if (!(cell instanceof HTMLElement)) continue;
      cell.classList.add('dg-frozen');
      cell.classList.toggle('dg-frozen-last', i === n - 1);
      cell.style.setProperty('--dgi-freeze-start', `${start}px`);
    }
    start += width;
  });
}
