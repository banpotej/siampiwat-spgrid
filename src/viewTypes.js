// @ts-check

/** @typedef {import('./types.js').GridLines} GridLines */
/** @typedef {import('./types.js').LineStyle} LineStyle */

/**
 * @typedef {object} ViewSettings The look of the table, as `getViewSettings()` reports it and `setViewSettings()` takes it.
 * @property {boolean} [striped] Zebra rows.
 * @property {boolean} [wrapped] Long cell text wraps onto more lines.
 * @property {GridLines} [gridLines] Which lines the table draws.
 * @property {LineStyle} [lineStyle] How those lines are drawn.
 * @property {number} [freezeColumns] How many leading columns stay in place while the table scrolls sideways.
 */

/**
 * @typedef {object} ExportOptions
 * @property {string} [filename] Download name; default the `exportFilename` option, else 'export.xlsx' (`.xlsx` is appended when missing; characters a file name cannot hold are dropped).
 * @property {string} [sheetName] Worksheet name; default 'Sheet1'. Characters Excel forbids are replaced.
 * @property {string[]} [columns] Keys of the data columns to export; default every data column. They come out in the
 *   grid's column order, whatever the order here. Throws a RangeError for an empty list or a key that is not a data column.
 * @property {string} [search] Text to filter the rows by for this export only (whitespace-separated words are ANDed, over
 *   the visible data columns). It replaces the grid's search text and its search column; the per-column filters still apply.
 *   Default: the rows the grid is filtered to. The grid itself is not changed.
 */
export {};
