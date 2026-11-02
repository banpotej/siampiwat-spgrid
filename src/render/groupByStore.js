// @ts-check
import { dataKeys } from '../core/columns.js';
import { readJson, writeJson } from '../utils/storage.js';

const PREFIX = 'datagrid:groupBy:';

/**
 * The group columns saved under `storageKey`, or `fallback` when nothing usable is saved (no entry, bad JSON,
 * storage unavailable). A saved empty list counts: the user ungrouped. Saved keys that are no longer data
 * columns, and repeats, are dropped.
 *
 * @param {string | undefined} storageKey
 * @param {import('../types.js').Column[]} columns
 * @param {string[]} fallback
 * @returns {string[]}
 */
export function loadGroupBy(storageKey, columns, fallback) {
  const saved = storageKey === undefined ? undefined : readJson(PREFIX + storageKey);
  if (!Array.isArray(saved)) return fallback;
  const data = dataKeys(columns);
  return saved.filter((key, i) => data.includes(key) && saved.indexOf(key) === i);
}

/**
 * @param {string | undefined} storageKey No-op when undefined.
 * @param {string[]} keys
 */
export function saveGroupBy(storageKey, keys) {
  if (storageKey !== undefined) writeJson(PREFIX + storageKey, keys);
}
