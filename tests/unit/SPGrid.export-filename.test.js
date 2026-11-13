import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPGrid, thaiLabels } from '../../src/index.js';

const columns = [{ key: 'name', label: 'Name' }];
const rows = [{ name: 'Ada' }];

/** @type {string[]} */
let clicked;
beforeEach(() => {
  clicked = [];
  URL.createObjectURL = vi.fn(() => 'blob:x');
  URL.revokeObjectURL = vi.fn();
  document.addEventListener('click', onClick);
});
afterEach(() => {
  document.removeEventListener('click', onClick);
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});
/** @param {MouseEvent} event */
const onClick = (event) => {
  event.preventDefault();
  if (event.target instanceof HTMLAnchorElement) clicked.push(event.target.download);
};

/** @param {object} [options] */
const make = (options = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new SPGrid(el, { columns, rows, exportButton: true, ...options });
  return { el, grid };
};
/** @param {HTMLElement} el */
const press = (el) =>
  /** @type {HTMLButtonElement} */ (el.querySelector('button.spg-export')).click();
/** @param {HTMLElement} el */
const nameBox = (el) =>
  /** @type {HTMLInputElement | null} */ (el.querySelector('.spg-export-name'));
/** @param {HTMLElement} el */
const confirm = (el) =>
  /** @type {HTMLButtonElement} */ (el.querySelector('.spg-modal-ok')).click();

describe('exportFilename option', () => {
  it('names the download of the Export button and of exportExcel()', () => {
    const { el, grid } = make({ exportFilename: 'report' });
    press(el);
    grid.exportExcel();
    expect(clicked).toEqual(['report.xlsx', 'report.xlsx']);
  });

  it('keeps an .xlsx the name already has, whatever its case', () => {
    make({ exportFilename: 'a.XLSX' }).grid.exportExcel();
    expect(clicked).toEqual(['a.XLSX']);
  });

  it('is called for each export when it is a function', () => {
    let n = 0;
    const { grid } = make({ exportFilename: () => `po-${++n}` });
    grid.exportExcel();
    grid.exportExcel();
    expect(clicked).toEqual(['po-1.xlsx', 'po-2.xlsx']);
  });

  it('is beaten by the filename of an exportExcel() call', () => {
    make({ exportFilename: 'report' }).grid.exportExcel({ filename: 'other' });
    expect(clicked).toEqual(['other.xlsx']);
  });

  it('drops characters a file name cannot hold, and falls back when nothing is left', () => {
    const { grid } = make();
    grid.exportExcel({ filename: 'a/b\\c:d*e?f"g<h>i|j' });
    grid.exportExcel({ filename: '  /:  ' });
    grid.exportExcel({ filename: '' });
    expect(clicked).toEqual(['abcdefghij.xlsx', 'export.xlsx', 'export.xlsx']);
  });

  it('is still export.xlsx by default', () => {
    press(make().el);
    expect(clicked).toEqual(['export.xlsx']);
  });
});

describe('the file name box of the export dialog', () => {
  it('is there with exportColumnSelect only, and starts with the option, no extension', () => {
    expect(nameBox(make().el)).toBeNull();
    const { el } = make({ exportColumnSelect: true, exportFilename: 'report.xlsx' });
    press(el);
    expect(nameBox(el)?.value).toBe('report');
    expect(el.querySelector('.spg-export-name')?.closest('label')?.textContent).toContain(
      'File name',
    );
  });

  it('starts with "export" when the option is not set, and exports under that name untouched', () => {
    const { el } = make({ exportColumnSelect: true });
    press(el);
    expect(nameBox(el)?.value).toBe('export');
    confirm(el);
    expect(clicked).toEqual(['export.xlsx']);
  });

  it('exports under the name the user typed', () => {
    const { el } = make({ exportColumnSelect: true, exportFilename: 'report' });
    press(el);
    const box = /** @type {HTMLInputElement} */ (nameBox(el));
    box.value = ' my file ';
    confirm(el);
    expect(clicked).toEqual(['my file.xlsx']);
  });

  it('uses the default name when the user clears the box', () => {
    const { el } = make({ exportColumnSelect: true, exportFilename: 'report' });
    press(el);
    /** @type {HTMLInputElement} */ (nameBox(el)).value = '   ';
    confirm(el);
    expect(clicked).toEqual(['report.xlsx']);
  });

  it('exports on Enter in the box', () => {
    const { el } = make({ exportColumnSelect: true });
    press(el);
    const box = /** @type {HTMLInputElement} */ (nameBox(el));
    box.value = 'quick';
    box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(clicked).toEqual(['quick.xlsx']);
  });

  it('uses labels.exportFilename', () => {
    const { el } = make({ exportColumnSelect: true, labels: thaiLabels });
    press(el);
    expect(el.querySelector('.spg-export-name')?.closest('label')?.textContent).toContain(
      'ชื่อไฟล์',
    );
  });
});
