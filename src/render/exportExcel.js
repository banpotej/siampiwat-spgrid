// @ts-check
import { isActionColumn } from '../core/columns.js';
import { selectedRows } from '../core/selection.js';
import { computeView } from '../core/view.js';
import { buildXlsx } from '../core/xlsx.js';

/** @typedef {import('../types.js').GridState} GridState */
/** @typedef {import('../types.js').ExportOptions} ExportOptions */

export const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * The data columns to export: all of them, or only `keys`, in the grid's column order.
 *
 * @param {import('../types.js').Column[]} columns
 * @param {string[] | undefined} keys
 * @returns {import('../types.js').Column[]}
 * @throws {RangeError} `keys` is empty, or holds a key that is not a data column
 */
function pickColumns(columns, keys) {
  if (keys === undefined) return columns;
  const unknown = keys.find((key) => !columns.some((c) => c.key === key));
  if (unknown !== undefined) throw new RangeError(`exportExcel: "${unknown}" is not a data column`);
  if (keys.length === 0) throw new RangeError('exportExcel: columns is empty');
  return columns.filter((c) => keys.includes(c.key));
}

/**
 * The rows an export writes: the grid's filtered and sorted rows, every page. A given `search` replaces the grid's
 * search text and its search column limit with a plain text search over the visible data columns. With `selectedOnly`
 * only the selected rows among them (keyed by `rowKey`).
 *
 * @param {GridState} state
 * @param {{ locale?: string, hidden?: string[], search?: string, selectedOnly?: boolean, rowKey?: string }} options
 * @returns {import('../types.js').Row[]}
 */
export function exportRows(state, { locale, hidden, search, selectedOnly, rowKey }) {
  const view =
    search === undefined
      ? state
      : { ...state, searchColumn: null, filter: { ...state.filter, search } };
  const { rows } = computeView({ ...view, pageSize: null }, { locale, hidden });
  if (!selectedOnly) return rows;
  const chosen = new Set(selectedRows(rows, state.selected, rowKey));
  return rows.filter((row) => chosen.has(row));
}

/**
 * The filtered and sorted rows (all pages) of the data columns as an .xlsx Blob. Values are the raw
 * row values, not `column.render` output (which is HTML).
 *
 * @param {GridState} state
 * @param {{ locale?: string, sheetName?: string, hidden?: string[], columns?: string[], search?: string, selectedOnly?: boolean, rowKey?: string }} options
 * `hidden`: as for `computeView`, so the rows match what the grid shows. `columns`: keys of the data columns to export
 * (default all). `search`, `selectedOnly` and `rowKey`: see `exportRows`.
 * @returns {Blob}
 */
export function buildExcelBlob(
  state,
  { locale, sheetName, hidden, columns: keys, search, selectedOnly, rowKey },
) {
  const columns = pickColumns(
    state.columns.filter((c) => !isActionColumn(c)),
    keys,
  );
  const rows = exportRows(state, { locale, hidden, search, selectedOnly, rowKey });
  const bytes = buildXlsx({
    sheetName,
    headers: columns.map((c) => c.label ?? c.key),
    rows: rows.map((row) => columns.map((c) => row[c.key])),
  });
  return new Blob([/** @type {BlobPart} */ (bytes)], { type: XLSX_TYPE });
}

/**
 * Builds the workbook and triggers the browser download.
 *
 * @param {GridState} state
 * @param {{ locale?: string, hidden?: string[], rowKey?: string } & ExportOptions} options
 * @returns {Blob}
 * @throws {RangeError} `columns` is empty, or holds a key that is not a data column
 */
export function exportExcel(
  state,
  { locale, hidden, rowKey, filename = 'export.xlsx', sheetName, columns, search, selectedOnly },
) {
  const blob = buildExcelBlob(state, {
    locale,
    sheetName,
    hidden,
    columns,
    search,
    selectedOnly,
    rowKey,
  });
  downloadBlob(blob, cleanFilename(filename));
  return blob;
}

// eslint-disable-next-line no-control-regex
const UNSAFE_NAME_CHARS = /[\\/:*?"<>|\u0000-\u001f]/g;

/**
 * A safe download name: characters a file name cannot hold are dropped, `.xlsx` is added when missing, and a name
 * that is empty after that falls back to 'export.xlsx'.
 *
 * @param {unknown} name
 * @returns {string}
 */
export function cleanFilename(name) {
  const clean = String(name ?? '')
    .replace(UNSAFE_NAME_CHARS, '')
    .trim();
  if (/\.xlsx$/i.test(clean) && clean.length > 5) return clean;
  return `${clean.replace(/\.xlsx$/i, '') || 'export'}.xlsx`;
}

/**
 * The name the `exportFilename` option gives (a string, or a function called for each export); undefined when unset.
 *
 * @param {string | (() => string) | undefined} option
 * @returns {string | undefined}
 */
export const resolveFilename = (option) => (typeof option === 'function' ? option() : option);

/**
 * @param {Blob} blob
 * @param {string} filename
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
