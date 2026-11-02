// @ts-check
import { readJson, writeJson } from '../utils/storage.js';

/** localStorage key prefixes of the remembered view settings. */
export const STRIPED_PREFIX = 'datagrid:striped:';
export const TEXT_WRAP_PREFIX = 'datagrid:textWrap:';

/**
 * A yes/no view setting: the choice saved under `prefix + storageKey`, or `fallback` when nothing usable is
 * saved (no key, no entry, not a boolean, storage unavailable).
 *
 * @param {string} prefix
 * @param {string | undefined} storageKey
 * @param {boolean} fallback
 * @returns {boolean}
 */
export function loadFlag(prefix, storageKey, fallback) {
  const saved = storageKey === undefined ? undefined : readJson(prefix + storageKey);
  return typeof saved === 'boolean' ? saved : fallback;
}

/**
 * @typedef {object} ViewFlags The look switches of the settings modal; a flag is left out when it is not offered.
 * @property {boolean} [striped] Zebra rows.
 * @property {boolean} [wrapped] Long cell text wraps.
 */

/**
 * The striped / wrapped look of one grid: the classes on its root and the choices saved in `localStorage`.
 *
 * @param {Element | null} root The `.dg-root` element.
 * @param {Pick<import('../types.js').DataGridOptions, 'stripedToggle' | 'textWrapToggle' | 'stripedStorageKey' | 'textWrapStorageKey'>} options
 * @returns {{ get: () => ViewFlags, apply: (flags: ViewFlags) => void } | null} null when no switch is offered.
 */
export function createViewSettings(root, options) {
  const offerStriped = options.stripedToggle === true;
  const offerWrapped = options.textWrapToggle === true;
  if (!root || (!offerStriped && !offerWrapped)) return null;
  const striped = () => root.classList.contains('dg-striped');
  const wrapped = () => !root.classList.contains('dg-nowrap');
  return {
    get: () => ({
      ...(offerStriped && { striped: striped() }),
      ...(offerWrapped && { wrapped: wrapped() }),
    }),
    apply(flags) {
      if (offerStriped && flags.striped !== undefined && flags.striped !== striped()) {
        root.classList.toggle('dg-striped', flags.striped);
        if (options.stripedStorageKey !== undefined) {
          writeJson(STRIPED_PREFIX + options.stripedStorageKey, flags.striped);
        }
      }
      if (offerWrapped && flags.wrapped !== undefined && flags.wrapped !== wrapped()) {
        root.classList.toggle('dg-nowrap', !flags.wrapped);
        if (options.textWrapStorageKey !== undefined) {
          writeJson(TEXT_WRAP_PREFIX + options.textWrapStorageKey, flags.wrapped);
        }
      }
    },
  };
}
