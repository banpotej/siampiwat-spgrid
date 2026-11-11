// @ts-check
import { readJson, writeJson } from '../utils/storage.js';
import { FREEZE_PREFIX, isFreezeCount } from './frozenColumns.js';

/** localStorage key prefixes of the remembered view settings. */
export const STRIPED_PREFIX = 'spgrid:striped:';
export const TEXT_WRAP_PREFIX = 'spgrid:textWrap:';
export const GRID_LINES_PREFIX = 'spgrid:gridLines:';
export const LINE_STYLE_PREFIX = 'spgrid:lineStyle:';

/** @typedef {import('../types.js').GridLines} GridLines */
/** @typedef {import('../types.js').LineStyle} LineStyle */

/** Every line style, in the order the settings select lists them ('default' follows the theme, `--spg-line-style`). */
export const LINE_STYLES = /** @type {const} */ (['default', 'solid', 'dashed', 'dotted']);

/** The root class that sets each style ('default' has none, so the theme decides). */
const STYLE_CLASS = {
  default: '',
  solid: 'spg-line-solid',
  dashed: 'spg-line-dashed',
  dotted: 'spg-line-dotted',
};

/** @param {LineStyle} style @returns {string} The class `.spg-root` carries for this style ('' for 'default'). */
export function lineStyleClass(style) {
  return STYLE_CLASS[style];
}

/**
 * The line style saved under `LINE_STYLE_PREFIX + storageKey`, or `fallback` when nothing usable is saved.
 *
 * @param {string | undefined} storageKey
 * @param {LineStyle} fallback
 * @returns {LineStyle}
 */
export function loadLineStyle(storageKey, fallback) {
  const saved = storageKey === undefined ? undefined : readJson(LINE_STYLE_PREFIX + storageKey);
  return LINE_STYLES.find((style) => style === saved) ?? fallback;
}

/** Every grid lines mode, in the order the settings select lists them. */
export const GRID_LINES = /** @type {const} */ ([
  'default',
  'horizontal',
  'vertical',
  'both',
  'none',
]);

/** The root class that draws each mode ('horizontal' only marks the choice: it looks like 'default'). */
const LINES_CLASS = {
  default: '',
  horizontal: 'spg-lines-horizontal',
  vertical: 'spg-lines-vertical',
  both: 'spg-bordered',
  none: 'spg-lines-none',
};

/** @param {GridLines} mode @returns {string} The class `.spg-root` carries for this mode ('' for 'default'). */
export function gridLinesClass(mode) {
  return LINES_CLASS[mode];
}

/**
 * The grid lines mode saved under `GRID_LINES_PREFIX + storageKey`, or `fallback` when nothing usable is saved.
 *
 * @param {string | undefined} storageKey
 * @param {GridLines} fallback
 * @returns {GridLines}
 */
export function loadGridLines(storageKey, fallback) {
  const saved = storageKey === undefined ? undefined : readJson(GRID_LINES_PREFIX + storageKey);
  return GRID_LINES.find((mode) => mode === saved) ?? fallback;
}

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
 * @property {GridLines} [gridLines] Which lines the table draws.
 * @property {LineStyle} [lineStyle] How those lines are drawn (solid, dashed, dotted).
 * @property {number} [freezeColumns] How many leading columns stay in place while the table scrolls sideways.
 */

/**
 * @param {ViewFlags} flags
 * @throws {TypeError} `striped` or `wrapped` is not a boolean
 * @throws {RangeError} `gridLines`, `lineStyle` or `freezeColumns` is not one of its allowed values
 */
export function assertViewFlags(flags) {
  if (flags === null || typeof flags !== 'object')
    throw new TypeError('view settings must be an object');
  for (const name of /** @type {const} */ (['striped', 'wrapped'])) {
    if (flags[name] !== undefined && typeof flags[name] !== 'boolean') {
      throw new TypeError(`${name} must be a boolean`);
    }
  }
  if (flags.gridLines !== undefined && !GRID_LINES.includes(flags.gridLines)) {
    throw new RangeError(`gridLines must be one of ${GRID_LINES.join(', ')}`);
  }
  if (flags.lineStyle !== undefined && !LINE_STYLES.includes(flags.lineStyle)) {
    throw new RangeError(`lineStyle must be one of ${LINE_STYLES.join(', ')}`);
  }
  if (flags.freezeColumns !== undefined && !isFreezeCount(flags.freezeColumns)) {
    throw new RangeError('freezeColumns must be a whole number, 0 or more');
  }
}

/** @typedef {NonNullable<ReturnType<typeof createViewSettings>>} ViewSettingsControl */

/**
 * The look of one grid: the classes on its root and the choices saved in `localStorage`.
 *
 * @param {Element | null} root The `.spg-root` element.
 * @param {Pick<import('../types.js').SPGridOptions, 'stripedToggle' | 'textWrapToggle' | 'gridLinesToggle' | 'lineStyleToggle' | 'freezeColumnsToggle' | 'stripedStorageKey' | 'textWrapStorageKey' | 'gridLinesStorageKey' | 'lineStyleStorageKey' | 'freezeColumnsStorageKey'>} options
 * @returns {{ get: () => ViewFlags, all: () => Required<ViewFlags>, apply: (flags: ViewFlags) => boolean } | null}
 *   null without a root. `get()` holds only the flags the settings modal offers (`{}` when none); `all()` holds every
 *   flag; `apply()` takes any of them, offered or not, and returns whether the frozen column count changed.
 */
export function createViewSettings(root, options) {
  if (!root) return null;
  const offerStriped = options.stripedToggle === true;
  const offerWrapped = options.textWrapToggle === true;
  const offerLines = options.gridLinesToggle === true;
  const offerStyle = options.lineStyleToggle === true;
  const offerFreeze = options.freezeColumnsToggle === true;
  const striped = () => root.classList.contains('spg-striped');
  const wrapped = () => !root.classList.contains('spg-nowrap');
  const lines = () =>
    GRID_LINES.find(
      (mode) => LINES_CLASS[mode] !== '' && root.classList.contains(LINES_CLASS[mode]),
    ) ?? 'default';
  const style = () =>
    LINE_STYLES.find(
      (name) => STYLE_CLASS[name] !== '' && root.classList.contains(STYLE_CLASS[name]),
    ) ?? 'default';
  const frozen = () => Number(root.getAttribute('data-freeze') ?? 0);
  return {
    get: () => ({
      ...(offerStriped && { striped: striped() }),
      ...(offerWrapped && { wrapped: wrapped() }),
      ...(offerLines && { gridLines: lines() }),
      ...(offerStyle && { lineStyle: style() }),
      ...(offerFreeze && { freezeColumns: frozen() }),
    }),
    all: () => ({
      striped: striped(),
      wrapped: wrapped(),
      gridLines: lines(),
      lineStyle: style(),
      freezeColumns: frozen(),
    }),
    apply(flags) {
      const before = frozen();
      if (flags.striped !== undefined && flags.striped !== striped()) {
        root.classList.toggle('spg-striped', flags.striped);
        if (options.stripedStorageKey !== undefined) {
          writeJson(STRIPED_PREFIX + options.stripedStorageKey, flags.striped);
        }
      }
      if (flags.wrapped !== undefined && flags.wrapped !== wrapped()) {
        root.classList.toggle('spg-nowrap', !flags.wrapped);
        if (options.textWrapStorageKey !== undefined) {
          writeJson(TEXT_WRAP_PREFIX + options.textWrapStorageKey, flags.wrapped);
        }
      }
      if (flags.gridLines !== undefined && flags.gridLines !== lines()) {
        if (!GRID_LINES.includes(flags.gridLines)) return false;
        root.classList.remove(...GRID_LINES.map((mode) => LINES_CLASS[mode]).filter(Boolean));
        if (LINES_CLASS[flags.gridLines]) root.classList.add(LINES_CLASS[flags.gridLines]);
        if (options.gridLinesStorageKey !== undefined) {
          writeJson(GRID_LINES_PREFIX + options.gridLinesStorageKey, flags.gridLines);
        }
      }
      if (flags.lineStyle !== undefined && flags.lineStyle !== style()) {
        if (!LINE_STYLES.includes(flags.lineStyle)) return false;
        root.classList.remove(...LINE_STYLES.map((name) => STYLE_CLASS[name]).filter(Boolean));
        if (STYLE_CLASS[flags.lineStyle]) root.classList.add(STYLE_CLASS[flags.lineStyle]);
        if (options.lineStyleStorageKey !== undefined) {
          writeJson(LINE_STYLE_PREFIX + options.lineStyleStorageKey, flags.lineStyle);
        }
      }
      if (isFreezeCount(flags.freezeColumns) && flags.freezeColumns !== frozen()) {
        if (flags.freezeColumns > 0) root.setAttribute('data-freeze', String(flags.freezeColumns));
        else root.removeAttribute('data-freeze');
        if (options.freezeColumnsStorageKey !== undefined) {
          writeJson(FREEZE_PREFIX + options.freezeColumnsStorageKey, flags.freezeColumns);
        }
      }
      return frozen() !== before;
    },
  };
}
