// @ts-check
import { readJson, writeJson } from '../utils/storage.js';

/** @typedef {import('../types.js').SortState} SortState */

const PREFIX = 'spgrid:sort:';

/**
 * The sort saved under `storageKey`, or `fallback` when nothing usable is saved (no entry, bad JSON, a key
 * that is no longer a column, storage unavailable). A saved "no sort" (`null`) counts: the user cleared it.
 *
 * @param {string | undefined} storageKey
 * @param {string[]} columnKeys Data column keys a sort may name.
 * @param {SortState} fallback
 * @returns {SortState}
 */
export function loadSort(storageKey, columnKeys, fallback) {
  const saved = storageKey === undefined ? undefined : readJson(PREFIX + storageKey);
  if (saved === null) return null;
  if (typeof saved !== 'object' || saved === undefined) return fallback;
  const { key, direction } = /** @type {Record<string, unknown>} */ (saved);
  const ok =
    typeof key === 'string' &&
    columnKeys.includes(key) &&
    (direction === 'asc' || direction === 'desc');
  return ok ? { key, direction } : fallback;
}

/**
 * @param {string | undefined} storageKey No-op when undefined.
 * @param {SortState} sort
 */
export function saveSort(storageKey, sort) {
  if (storageKey !== undefined) writeJson(PREFIX + storageKey, sort);
}
