// @ts-check
import { zipStore } from './zip.js';

const XML_HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const PKG_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const MAX_SHEET_NAME = 31;

/**
 * Escapes text for XML and drops characters XML 1.0 cannot hold.
 * @param {string} text
 * @returns {string}
 */
function xmlText(text) {
  return [...text]
    .filter((ch) => {
      const code = ch.charCodeAt(0);
      return code >= 0x20 || code === 0x09 || code === 0x0a || code === 0x0d;
    })
    .join('')
    .replace(/[￾￿]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {number} index 0-based
 * @returns {string} 'A', 'B', ... 'Z', 'AA', ...
 */
export function columnLetter(index) {
  let name = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  }
  return name;
}

/**
 * @param {string} name
 * @returns {string} A valid Excel sheet name (no `[]:*?/\`, at most 31 characters, never empty).
 */
export function sheetName(name) {
  return (
    name
      .replace(/[[\]:*?/\\]/g, ' ')
      .trim()
      .slice(0, MAX_SHEET_NAME) || 'Sheet1'
  );
}

/**
 * @param {unknown} value
 * @param {string} ref Cell reference, e.g. 'B2'.
 * @param {number} [style] Style index of `styles.xml`.
 * @returns {string} The `<c>` element, or '' for an empty cell.
 */
function cell(value, ref, style) {
  if (value === null || value === undefined || value === '') return '';
  const s = style ? ` s="${style}"` : '';
  if (typeof value === 'number' && Number.isFinite(value))
    return `<c r="${ref}"${s}><v>${value}</v></c>`;
  if (typeof value === 'boolean') return `<c r="${ref}"${s} t="b"><v>${value ? 1 : 0}</v></c>`;
  const text =
    value instanceof Date ? (Number.isNaN(+value) ? '' : value.toISOString()) : String(value);
  return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${xmlText(text)}</t></is></c>`;
}

/**
 * Builds a single-sheet .xlsx workbook. Pure. Numbers and booleans stay typed; everything else is text
 * (so nothing is ever read as a formula). The header row is bold.
 *
 * @param {{ sheetName?: string, headers: string[], rows: unknown[][] }} table
 * @returns {Uint8Array}
 */
export function buildXlsx({ sheetName: name = 'Sheet1', headers, rows }) {
  const sheetRows = [headers, ...rows].map((values, r) => {
    const cells = values
      .map((v, c) => cell(v, `${columnLetter(c)}${r + 1}`, r === 0 ? 1 : 0))
      .join('');
    return `<row r="${r + 1}">${cells}</row>`;
  });
  const sheet = `${XML_HEAD}<worksheet xmlns="${NS}"><sheetData>${sheetRows.join('')}</sheetData></worksheet>`;
  const rel = (/** @type {string} */ type, /** @type {string} */ target) =>
    `<Relationship Id="rId1" Type="${REL_NS}/${type}" Target="${target}"/>`;

  return zipStore([
    {
      name: '[Content_Types].xml',
      data:
        `${XML_HEAD}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '</Types>',
    },
    {
      name: '_rels/.rels',
      data: `${XML_HEAD}<Relationships xmlns="${PKG_REL_NS}">${rel('officeDocument', 'xl/workbook.xml')}</Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      data:
        `${XML_HEAD}<workbook xmlns="${NS}" xmlns:r="${REL_NS}"><sheets>` +
        `<sheet name="${xmlText(sheetName(name))}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data:
        `${XML_HEAD}<Relationships xmlns="${PKG_REL_NS}">${rel('worksheet', 'worksheets/sheet1.xml')}` +
        `<Relationship Id="rId2" Type="${REL_NS}/styles" Target="styles.xml"/></Relationships>`,
    },
    {
      name: 'xl/styles.xml',
      data:
        `${XML_HEAD}<styleSheet xmlns="${NS}">` +
        '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
        '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
        '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>' +
        '</styleSheet>',
    },
    { name: 'xl/worksheets/sheet1.xml', data: sheet },
  ]);
}
