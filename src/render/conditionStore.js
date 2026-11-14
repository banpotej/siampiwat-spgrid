// @ts-check
import { normalizeConditions } from '../core/conditions.js';
import { readJson, writeJson } from '../utils/storage.js';

const PREFIX = 'spgrid:advancedFilter:';

/**
 * The advanced filter saved under `storageKey`, or null when nothing usable is saved (no entry, bad JSON,
 * a column or operator that no longer fits, storage unavailable).
 *
 * @param {string | undefined} storageKey
 * @param {import('../types.js').Column[]} columns
 * @param {string} [locale]
 * @returns {import('../types.js').GridState['conditions']}
 */
export function loadConditions(storageKey, columns, locale) {
  const saved = storageKey === undefined ? undefined : readJson(PREFIX + storageKey);
  if (saved === undefined || saved === null) return null;
  try {
    return normalizeConditions(/** @type {any} */ (saved), columns, { locale });
  } catch {
    return null;
  }
}

/**
 * @param {string | undefined} storageKey No-op when undefined.
 * @param {import('../types.js').GridState['conditions']} conditions
 */
export function saveConditions(storageKey, conditions) {
  if (storageKey !== undefined) writeJson(PREFIX + storageKey, conditions);
}
