// @ts-check
import { restoreHidden } from '../core/columnVisibility.js';
import { readJson, writeJson } from '../utils/storage.js';

/** @typedef {import('../types.js').Column} Column */

const PREFIX = 'datagrid:columns:';

/**
 * The hidden column keys saved under `storageKey`, or `fallback` when nothing usable is saved
 * (no entry, bad JSON, storage unavailable). Saved keys that are no longer columns are dropped.
 *
 * @param {string | undefined} storageKey
 * @param {Column[]} columns
 * @param {string[]} fallback
 * @returns {string[]}
 */
export function loadHidden(storageKey, columns, fallback) {
  const saved = storageKey === undefined ? undefined : readJson(PREFIX + storageKey);
  return saved === undefined ? fallback : restoreHidden(columns, saved);
}

/**
 * @param {string | undefined} storageKey No-op when undefined.
 * @param {string[]} hidden
 */
export function saveHidden(storageKey, hidden) {
  if (storageKey !== undefined) writeJson(PREFIX + storageKey, hidden);
}
