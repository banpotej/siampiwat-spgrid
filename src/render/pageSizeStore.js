// @ts-check
import { readJson, writeJson } from '../utils/storage.js';

const PREFIX = 'spgrid:pageSize:';

/**
 * The rows per page saved under `storageKey`, or `fallback` when nothing usable is saved (no entry,
 * not a positive integer, storage unavailable).
 *
 * @param {string | undefined} storageKey
 * @param {number | undefined} fallback
 * @returns {number | undefined}
 */
export function loadPageSize(storageKey, fallback) {
  const saved = storageKey === undefined ? undefined : readJson(PREFIX + storageKey);
  return typeof saved === 'number' && Number.isInteger(saved) && saved > 0 ? saved : fallback;
}

/**
 * @param {string | undefined} storageKey No-op when undefined.
 * @param {number} pageSize
 */
export function savePageSize(storageKey, pageSize) {
  if (storageKey !== undefined) writeJson(PREFIX + storageKey, pageSize);
}
