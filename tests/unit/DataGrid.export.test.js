import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataGrid } from '../../src/index.js';
import { columnLetter, sheetName } from '../../src/core/xlsx.js';
import { crc32 } from '../../src/core/zip.js';

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'qty', label: 'Qty' },
  { key: 'act', actions: [{ name: 'edit', label: 'Edit' }] },
];
const rows = [
  { name: 'Grace', qty: 3 },
  { name: 'Ada', qty: 1 },
  { name: 'Eve <&>', qty: 2 },
];

/** @param {Blob} blob */
const readBytes = async (blob) => new Uint8Array(await blob.arrayBuffer());
/** @param {Uint8Array} bytes */
const asText = (bytes) => new TextDecoder().decode(bytes);

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
  vi.restoreAllMocks();
});
/** @param {MouseEvent} event Records the download link and stops jsdom from navigating. */
const onClick = (event) => {
  event.preventDefault();
  if (event.target instanceof HTMLAnchorElement) clicked.push(event.target.download);
};

const make = (options = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  return new DataGrid(el, { columns, rows, ...options });
};

describe('exportExcel', () => {
  it('downloads an .xlsx zip named by the options', async () => {
    const blob = make().exportExcel({ filename: 'orders' });
    expect(clicked).toEqual(['orders.xlsx']);
    expect(blob.type).toContain('spreadsheetml.sheet');
    const bytes = await readBytes(blob);
    expect([...bytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });

  it('keeps an existing .xlsx extension and defaults the name', () => {
    const grid = make();
    grid.exportExcel({ filename: 'a.XLSX' });
    grid.exportExcel();
    expect(clicked).toEqual(['a.XLSX', 'export.xlsx']);
  });

  it('writes labels, data columns only, typed numbers and escaped text', async () => {
    const text = asText(await readBytes(make().exportExcel()));
    expect(text).toContain('<t xml:space="preserve">Name</t>');
    expect(text).not.toContain('Edit');
    expect(text).toContain('<c r="B2"><v>3</v></c>');
    expect(text).toContain('Eve &lt;&amp;&gt;');
  });

  it('exports the filtered and sorted rows of every page', async () => {
    const grid = make({ pageSize: 1 });
    grid.setSort({ key: 'name', direction: 'asc' });
    grid.setFilter({ search: 'a' });
    const text = asText(await readBytes(grid.exportExcel()));
    expect(text.indexOf('Ada')).toBeGreaterThan(-1);
    expect(text.indexOf('Ada')).toBeLessThan(text.indexOf('Grace'));
    expect(text).not.toContain('Eve');
  });
});

describe('helpers', () => {
  it('columnLetter', () => {
    expect([0, 25, 26, 27, 701, 702].map(columnLetter)).toEqual([
      'A',
      'Z',
      'AA',
      'AB',
      'ZZ',
      'AAA',
    ]);
  });

  it('sheetName strips forbidden characters and falls back', () => {
    expect(sheetName('a/b:c')).toBe('a b c');
    expect(sheetName('x'.repeat(40))).toHaveLength(31);
    expect(sheetName('  ')).toBe('Sheet1');
  });

  it('crc32 matches the standard check value', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });
});

describe('exportButton', () => {
  const button = (/** @type {HTMLElement} */ el) => el.querySelector('button.dg-export');

  it('is not rendered by default', () => {
    const el = document.createElement('div');
    new DataGrid(el, { columns, rows, searchable: true });
    expect(button(el)).toBeNull();
  });

  it('renders without a search box, with a label and icon, and downloads on click', () => {
    const el = document.createElement('div');
    document.body.append(el);
    new DataGrid(el, { columns, rows, exportButton: true, labels: { exportExcel: 'Excel!' } });
    const btn = /** @type {HTMLButtonElement} */ (button(el));
    expect(el.querySelector('.dg-search')).toBeNull();
    expect(btn.textContent).toBe('');
    expect(btn.getAttribute('aria-label')).toBe('Excel!');
    expect(btn.title).toBe('Excel!');
    expect(btn.querySelector('[data-icon="download"]')).not.toBeNull();
    btn.click();
    expect(clicked).toEqual(['export.xlsx']);
  });

  it('stops listening after destroy()', () => {
    const el = document.createElement('div');
    document.body.append(el);
    const grid = new DataGrid(el, { columns, rows, exportButton: true, searchable: true });
    const btn = /** @type {HTMLButtonElement} */ (button(el));
    grid.destroy();
    btn.click();
    expect(clicked).toEqual([]);
  });
});

describe('exportButton placement', () => {
  it('is the last part of the input group when searchable', () => {
    const el = document.createElement('div');
    new DataGrid(el, { columns, rows, searchable: true, searchButton: true, exportButton: true });
    expect(
      el.querySelector('.dg-input-group')?.lastElementChild?.classList.contains('dg-export'),
    ).toBe(true);
  });
});
