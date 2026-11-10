import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPGrid } from '../../src/index.js';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'qty', label: 'Qty' },
  { key: 'note', label: 'Note' },
  { key: 'act', actions: [{ name: 'edit', label: 'Edit' }] },
];
const rows = [{ name: 'Ada', qty: 1, note: 'first' }];

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

/** @param {Blob} blob */
const text = async (blob) => new TextDecoder().decode(new Uint8Array(await blob.arrayBuffer()));

const make = (options = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new SPGrid(el, { columns, rows, exportButton: true, ...options });
  return { el, grid };
};
/** @param {HTMLElement} el */
const openDialog = (el) => {
  /** @type {HTMLButtonElement} */ (el.querySelector('button.spg-export')).click();
  return /** @type {HTMLElement | null} */ (el.querySelector('.spg-modal'));
};
/** @param {HTMLElement} el */
const modalOf = (el) => {
  const modal = openDialog(el);
  if (!modal) throw new Error('modal did not open');
  return modal;
};

describe('exportExcel({ columns })', () => {
  it('exports only the chosen data columns, in the grid order', async () => {
    const { grid } = make();
    const xml = await text(grid.exportExcel({ columns: ['note', 'name'] }));
    expect(xml).toContain('<t xml:space="preserve">Name</t>');
    expect(xml).toContain('<t xml:space="preserve">Note</t>');
    expect(xml).not.toContain('Qty');
    expect(xml.indexOf('Name')).toBeLessThan(xml.indexOf('Note'));
  });

  it('throws a RangeError for an empty list, an unknown key or an action column', () => {
    const { grid } = make();
    expect(() => grid.exportExcel({ columns: [] })).toThrow(RangeError);
    expect(() => grid.exportExcel({ columns: ['nope'] })).toThrow(RangeError);
    expect(() => grid.exportExcel({ columns: ['act'] })).toThrow(RangeError);
    expect(clicked).toEqual([]);
  });
});

describe('exportColumnSelect', () => {
  it('downloads at once when the option is off', () => {
    const { el } = make();
    expect(openDialog(el)).toBeNull();
    expect(clicked).toEqual(['export.xlsx']);
  });

  it('opens a modal listing the data columns, all ticked, without downloading', () => {
    const { el } = make({ exportColumnSelect: true });
    const modal = modalOf(el);
    expect(clicked).toEqual([]);
    expect(modal.querySelector('.spg-modal-title')?.textContent).toBe('Choose fields to export');
    const boxes = [...modal.querySelectorAll('input[type=checkbox]')];
    expect(boxes.map((b) => /** @type {HTMLInputElement} */ (b).dataset.key)).toEqual([
      'name',
      'qty',
      'note',
    ]);
    expect(boxes.every((b) => /** @type {HTMLInputElement} */ (b).checked)).toBe(true);
  });

  it('exports only the ticked fields and closes', async () => {
    const { el } = make({ exportColumnSelect: true });
    const spy = vi.spyOn(SPGrid.prototype, 'exportExcel');
    const modal = modalOf(el);
    const qty = /** @type {HTMLInputElement} */ (modal.querySelector('input[data-key=qty]'));
    qty.checked = false; // not click(): this file's document click hook calls preventDefault
    qty.dispatchEvent(new Event('change', { bubbles: true }));
    /** @type {HTMLButtonElement} */ (modal.querySelector('.spg-modal-ok')).click();
    expect(spy).toHaveBeenCalledWith({ columns: ['name', 'note'] });
    expect(clicked).toEqual(['export.xlsx']);
    expect(el.querySelector('.spg-modal')).toBeNull();
  });

  it('disables Export while nothing is ticked; Select all brings it back', () => {
    const { el } = make({ exportColumnSelect: true });
    const modal = modalOf(el);
    const ok = /** @type {HTMLButtonElement} */ (modal.querySelector('.spg-modal-ok'));
    /** @type {HTMLButtonElement} */ (modal.querySelector('[data-bulk=none]')).click();
    expect(ok.disabled).toBe(true);
    /** @type {HTMLButtonElement} */ (modal.querySelector('[data-bulk=all]')).click();
    expect(ok.disabled).toBe(false);
  });

  it('Cancel, Esc and the backdrop close it without downloading', () => {
    const { el } = make({ exportColumnSelect: true });
    openDialog(el);
    /** @type {HTMLButtonElement} */ (el.querySelector('.spg-modal-cancel')).click();
    expect(el.querySelector('.spg-modal')).toBeNull();
    const modal = modalOf(el);
    modal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(el.querySelector('.spg-modal')).toBeNull();
    openDialog(el)?.click();
    expect(el.querySelector('.spg-modal')).toBeNull();
    expect(clicked).toEqual([]);
  });

  it('uses the labels option for its text', () => {
    const { el } = make({
      exportColumnSelect: true,
      labels: { exportFields: 'Fields', exportExcel: 'Go' },
    });
    const modal = modalOf(el);
    expect(modal.querySelector('.spg-modal-title')?.textContent).toBe('Fields');
    expect(modal.querySelector('.spg-modal-ok')?.textContent).toBe('Go');
  });
});

describe('exportExcel({ search })', () => {
  const people = [
    { name: 'Ada', qty: 1, note: 'first' },
    { name: 'Grace', qty: 2, note: 'second' },
    { name: 'Eve', qty: 3, note: 'third' },
  ];

  it('filters the rows for this export only', async () => {
    const { grid } = make({ rows: people });
    const xml = await text(grid.exportExcel({ search: 'grace' }));
    expect(xml).toContain('Grace');
    expect(xml).not.toContain('Ada');
    expect(grid.getFilter()).toBeNull();
  });

  it('replaces the grid search; an empty string exports every row; column filters still apply', async () => {
    const { grid } = make({ rows: people });
    grid.setFilter({ search: 'ada', columnFilters: { note: 'second' } });
    expect(await text(grid.exportExcel({ search: '' }))).toContain('Grace');
    expect(await text(grid.exportExcel({ search: '' }))).not.toContain('Eve');
    expect(await text(grid.exportExcel({ search: 'ada' }))).not.toContain('Ada');
  });
});

describe('exportColumnSelect search box', () => {
  const people = [
    { name: 'Ada', qty: 1, note: 'first' },
    { name: 'Grace', qty: 2, note: 'second' },
    { name: 'Eve', qty: 3, note: 'third' },
  ];
  /** @param {HTMLElement} modal */
  const box = (modal) =>
    /** @type {HTMLInputElement} */ (modal.querySelector('.spg-export-search'));
  /** @param {HTMLElement} modal @param {string} value */
  const type = (modal, value) => {
    box(modal).value = value;
    box(modal).dispatchEvent(new Event('input', { bubbles: true }));
  };
  const count = (/** @type {HTMLElement} */ modal) =>
    modal.querySelector('.spg-export-count')?.textContent;

  it('starts with the grid search and the number of rows it leaves', () => {
    const { el, grid } = make({ rows: people, searchable: true, exportColumnSelect: true });
    grid.setFilter({ search: 'a' });
    const modal = modalOf(el);
    expect(box(modal).value).toBe('a');
    expect(count(modal)).toBe('2 rows will be exported');
  });

  it('updates the count as the user types, and clearing it counts every row', () => {
    const { el } = make({ rows: people, exportColumnSelect: true });
    const modal = modalOf(el);
    expect(count(modal)).toBe('3 rows will be exported');
    type(modal, 'grace');
    expect(count(modal)).toBe('1 row will be exported');
    type(modal, 'zzz');
    expect(count(modal)).toBe('0 rows will be exported');
  });

  it('passes search to exportExcel only when the user changed the text', () => {
    const { el } = make({ rows: people, exportColumnSelect: true });
    const spy = vi.spyOn(SPGrid.prototype, 'exportExcel');
    const modal = modalOf(el);
    type(modal, 'grace');
    /** @type {HTMLButtonElement} */ (modal.querySelector('.spg-modal-ok')).click();
    expect(spy).toHaveBeenCalledWith({ columns: ['name', 'qty', 'note'], search: 'grace' });
  });

  it('Enter in the box exports', () => {
    const { el } = make({ rows: people, exportColumnSelect: true });
    const modal = modalOf(el);
    type(modal, 'eve');
    box(modal).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(clicked).toEqual(['export.xlsx']);
    expect(el.querySelector('.spg-modal')).toBeNull();
  });

  it('leaves the grid itself untouched', () => {
    const { el, grid } = make({ rows: people, exportColumnSelect: true });
    const modal = modalOf(el);
    type(modal, 'grace');
    /** @type {HTMLButtonElement} */ (modal.querySelector('.spg-modal-ok')).click();
    expect(grid.getFilter()).toBeNull();
    expect(el.querySelectorAll('tbody tr')).toHaveLength(3);
  });
});

describe('exportColumnSelect preview', () => {
  const many = Array.from({ length: 25 }, (_, i) => ({
    name: i === 3 ? '<b>Eve</b>' : `Person ${i}`,
    qty: i,
    note: i % 2 ? 'odd' : 'even',
  }));
  /** @param {HTMLElement} modal */
  const body = (modal) => [...modal.querySelectorAll('.spg-export-preview tbody tr')];
  /** @param {HTMLElement} modal */
  const heads = (modal) =>
    [...modal.querySelectorAll('.spg-export-preview th')].map((th) => th.textContent);
  /** @param {HTMLElement} modal @param {string} value */
  const type = (modal, value) => {
    const input = /** @type {HTMLInputElement} */ (modal.querySelector('.spg-export-search'));
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  };

  it('shows the first 10 rows of the export and says how many follow', () => {
    const { el } = make({ rows: many, exportColumnSelect: true });
    const modal = modalOf(el);
    expect(body(modal)).toHaveLength(10);
    expect(modal.querySelector('.spg-export-more')?.textContent).toBe('… and 15 more rows');
    expect(modal.querySelector('.spg-export-count')?.textContent).toBe('25 rows will be exported');
  });

  it('follows the search box and says so when nothing matches', () => {
    const { el } = make({ rows: many, exportColumnSelect: true });
    const modal = modalOf(el);
    type(modal, 'person 17');
    expect(body(modal)).toHaveLength(1);
    expect(modal.querySelector('.spg-export-more')?.textContent).toBe('');
    type(modal, 'zzz');
    expect(body(modal)).toHaveLength(0);
    expect(modal.querySelector('.spg-export-preview')?.textContent).toBe('No rows match');
  });

  it('shows only the ticked fields and follows the ticks', () => {
    const { el } = make({ rows: many, exportColumnSelect: true });
    const modal = modalOf(el);
    expect(heads(modal)).toEqual(['Name', 'Qty', 'Note']);
    const qty = /** @type {HTMLInputElement} */ (modal.querySelector('input[data-key=qty]'));
    qty.checked = false;
    qty.dispatchEvent(new Event('change', { bubbles: true }));
    expect(heads(modal)).toEqual(['Name', 'Note']);
    /** @type {HTMLButtonElement} */ (modal.querySelector('[data-bulk=none]')).click();
    expect(modal.querySelector('.spg-export-preview table')).toBeNull();
  });

  it('escapes cell text and leaves the grid alone', () => {
    const { el } = make({ rows: many, exportColumnSelect: true });
    const modal = modalOf(el);
    expect(modal.querySelector('.spg-export-preview b')).toBeNull();
    expect(modal.querySelector('.spg-export-preview')?.textContent).toContain('<b>Eve</b>');
  });

  it('writes a Date as an ISO string, like the file does', () => {
    const when = new Date('2026-11-04T00:00:00Z');
    const { el } = make({ rows: [{ name: 'Ada', qty: when, note: '' }], exportColumnSelect: true });
    expect(body(modalOf(el))[0].textContent).toContain('2026-11-04T00:00:00.000Z');
  });
});
