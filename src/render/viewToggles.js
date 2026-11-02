// @ts-check
import { readJson, writeJson } from '../utils/storage.js';

/** localStorage key prefixes of the remembered view settings. */
export const STRIPED_PREFIX = 'datagrid:striped:';
export const TEXT_WRAP_PREFIX = 'datagrid:textWrap:';
export const GRID_LINES_PREFIX = 'datagrid:gridLines:';
export const LINE_STYLE_PREFIX = 'datagrid:lineStyle:';

/** @typedef {import('../types.js').GridLines} GridLines */
/** @typedef {import('../types.js').LineStyle} LineStyle */

/** Every line style, in the order the settings select lists them ('default' follows the theme, `--dg-line-style`). */
export const LINE_STYLES = /** @type {const} */ (['default', 'solid', 'dashed', 'dotted']);

/** The root class that sets each style ('default' has none, so the theme decides). */
const STYLE_CLASS = {
  default: '',
  solid: 'dg-line-solid',
  dashed: 'dg-line-dashed',
  dotted: 'dg-line-dotted',
};

/** @param {LineStyle} style @returns {string} The class `.dg-root` carries for this style ('' for 'default'). */
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
  horizontal: 'dg-lines-horizontal',
  vertical: 'dg-lines-vertical',
  both: 'dg-bordered',
  none: 'dg-lines-none',
};

/** @param {GridLines} mode @returns {string} The class `.dg-root` carries for this mode ('' for 'default'). */
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
 */

/**
 * The striped / wrapped look of one grid: the classes on its root and the choices saved in `localStorage`.
 *
 * @param {Element | null} root The `.dg-root` element.
 * @param {Pick<import('../types.js').DataGridOptions, 'stripedToggle' | 'textWrapToggle' | 'gridLinesToggle' | 'lineStyleToggle' | 'stripedStorageKey' | 'textWrapStorageKey' | 'gridLinesStorageKey' | 'lineStyleStorageKey'>} options
 * @returns {{ get: () => ViewFlags, apply: (flags: ViewFlags) => void } | null} null when no switch is offered.
 */
export function createViewSettings(root, options) {
  const offerStriped = options.stripedToggle === true;
  const offerWrapped = options.textWrapToggle === true;
  const offerLines = options.gridLinesToggle === true;
  const offerStyle = options.lineStyleToggle === true;
  if (!root || (!offerStriped && !offerWrapped && !offerLines && !offerStyle)) return null;
  const striped = () => root.classList.contains('dg-striped');
  const wrapped = () => !root.classList.contains('dg-nowrap');
  const lines = () =>
    GRID_LINES.find(
      (mode) => LINES_CLASS[mode] !== '' && root.classList.contains(LINES_CLASS[mode]),
    ) ?? 'default';
  const style = () =>
    LINE_STYLES.find(
      (name) => STYLE_CLASS[name] !== '' && root.classList.contains(STYLE_CLASS[name]),
    ) ?? 'default';
  return {
    get: () => ({
      ...(offerStriped && { striped: striped() }),
      ...(offerWrapped && { wrapped: wrapped() }),
      ...(offerLines && { gridLines: lines() }),
      ...(offerStyle && { lineStyle: style() }),
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
      if (offerLines && flags.gridLines !== undefined && flags.gridLines !== lines()) {
        if (!GRID_LINES.includes(flags.gridLines)) return;
        root.classList.remove(...GRID_LINES.map((mode) => LINES_CLASS[mode]).filter(Boolean));
        if (LINES_CLASS[flags.gridLines]) root.classList.add(LINES_CLASS[flags.gridLines]);
        if (options.gridLinesStorageKey !== undefined) {
          writeJson(GRID_LINES_PREFIX + options.gridLinesStorageKey, flags.gridLines);
        }
      }
      if (offerStyle && flags.lineStyle !== undefined && flags.lineStyle !== style()) {
        if (!LINE_STYLES.includes(flags.lineStyle)) return;
        root.classList.remove(...LINE_STYLES.map((name) => STYLE_CLASS[name]).filter(Boolean));
        if (STYLE_CLASS[flags.lineStyle]) root.classList.add(STYLE_CLASS[flags.lineStyle]);
        if (options.lineStyleStorageKey !== undefined) {
          writeJson(LINE_STYLE_PREFIX + options.lineStyleStorageKey, flags.lineStyle);
        }
      }
    },
  };
}
