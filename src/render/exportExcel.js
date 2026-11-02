// @ts-check
import { isActionColumn } from '../core/columns.js';
import { computeView } from '../core/view.js';
import { buildXlsx } from '../core/xlsx.js';

/** @typedef {import('../types.js').GridState} GridState */
/** @typedef {import('../types.js').ExportOptions} ExportOptions */

export const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * The filtered and sorted rows (all pages) of the data columns as an .xlsx Blob. Values are the raw
 * row values, not `column.render` output (which is HTML).
 *
 * @param {GridState} state
 * @param {{ locale?: string, sheetName?: string, hidden?: string[] }} options `hidden`: as for `computeView`, so the
 * rows match what the grid shows.
 * @returns {Blob}
 */
export function buildExcelBlob(state, { locale, sheetName, hidden }) {
  const columns = state.columns.filter((c) => !isActionColumn(c));
  const { rows } = computeView({ ...state, pageSize: null }, { locale, hidden });
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
 * @param {{ locale?: string, hidden?: string[] } & ExportOptions} options
 * @returns {Blob}
 */
export function exportExcel(state, { locale, hidden, filename = 'export.xlsx', sheetName }) {
  const blob = buildExcelBlob(state, { locale, sheetName, hidden });
  downloadBlob(blob, /\.xlsx$/i.test(filename) ? filename : `${filename}.xlsx`);
  return blob;
}

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
