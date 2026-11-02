import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataGrid, thaiLabels } from '../../src/index.js';
import { normalizeHidden, restoreHidden, visibleColumns } from '../../src/core/columnVisibility.js';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'city', label: 'City' },
  { key: 'ops', actions: [{ name: 'open', label: 'Open' }] },
];
const rows = [
  { name: 'Ada', role: 'Engineer', city: 'London' },
  { name: 'Grace', role: 'Admiral', city: 'NYC' },
];

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

/** @param {object} [options] */
const make = (options = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new DataGrid(el, { columns, rows, columnPicker: true, ...options });
  return { el, grid };
};
/** @param {HTMLElement} el */
const headers = (el) => [...el.querySelectorAll('th')].map((th) => th.dataset.key);
const open = (/** @type {HTMLElement} */ el) =>
  /** @type {HTMLButtonElement} */ (el.querySelector('.dg-columns-btn')).click();
const dialog = (/** @type {HTMLElement} */ el) => el.querySelector('.dg-modal');
/** @param {HTMLElement} el @param {string} key The checkbox in the open modal. */
const box = (el, key) =>
  /** @type {HTMLInputElement} */ (
    el.querySelector(`.dg-settings input[type="checkbox"][data-key="${key}"]`)
  );
const apply = (/** @type {HTMLElement} */ el) =>
  /** @type {HTMLButtonElement} */ (el.querySelector('.dg-modal-ok')).click();
/** Open the modal, flip one checkbox and apply (the hide/show round trip). */
const toggle = (/** @type {HTMLElement} */ el, /** @type {string} */ key) => {
  open(el);
  box(el, key).click();
  apply(el);
};
const press = (/** @type {HTMLElement} */ target, /** @type {string} */ k) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const saved = () => localStorage.getItem('datagrid:columns:po');

describe('core/columnVisibility', () => {
  it('normalizeHidden returns column order without duplicates and rejects bad input', () => {
    expect(normalizeHidden(columns, ['city', 'name', 'city'])).toEqual(['name', 'city']);
    expect(() => normalizeHidden(columns, ['nope'])).toThrow(RangeError);
    expect(() => normalizeHidden(columns, ['ops'])).toThrow(RangeError);
    expect(() => normalizeHidden(columns, ['name', 'role', 'city'])).toThrow(/at least one/);
  });

  it('restoreHidden drops what is unusable instead of throwing', () => {
    expect(restoreHidden(columns, ['role', 'gone'])).toEqual(['role']);
    expect(restoreHidden(columns, ['name', 'role', 'city'])).toEqual([]);
    expect(restoreHidden(columns, 'junk')).toEqual([]);
    expect(restoreHidden(columns, null)).toEqual([]);
  });

  it('visibleColumns keeps action columns and the same array when nothing is hidden', () => {
    expect(visibleColumns(columns, [])).toBe(columns);
    expect(visibleColumns(columns, ['role']).map((c) => c.key)).toEqual(['name', 'city', 'ops']);
  });
});

describe('column picker', () => {
  it('is rendered only with columnPicker; the modal has one checkbox per data column (not the action column)', () => {
    expect(make({ columnPicker: false }).el.querySelector('.dg-columns-btn')).toBeNull();
    const { el } = make();
    const btn = /** @type {HTMLButtonElement} */ (el.querySelector('.dg-columns-btn'));
    expect(btn.type).toBe('button');
    expect(btn.getAttribute('aria-label')).toBe('Settings');
    expect(btn.title).toBe('Settings');
    expect(dialog(el)).toBeNull();
    open(el);
    expect(el.querySelectorAll('.dg-columns-item')).toHaveLength(3);
    expect(box(el, 'ops')).toBeNull();
    expect(el.querySelectorAll('.dg-columns-item input:checked')).toHaveLength(3);
    expect(el.querySelector('.dg-modal-box')?.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(box(el, 'name'));
  });

  it('works without searchable and sits beside the search group when there is one', () => {
    expect(make().el.querySelector('.dg-toolbar > .dg-columns-btn')).not.toBeNull();
    const { el } = make({ searchable: true });
    const toolbar = /** @type {HTMLElement} */ (el.querySelector('.dg-toolbar'));
    expect([...toolbar.children].map((c) => c.className)).toEqual(['dg-input-group']);
    expect(toolbar.querySelector('.dg-input-group')?.lastElementChild?.className).toBe(
      'dg-tool-btn dg-columns-btn',
    );
  });

  it('uses the labels and escapes column labels', () => {
    const thai = make({ labels: thaiLabels });
    expect(thai.el.querySelector('.dg-columns-btn')?.getAttribute('aria-label')).toBe('ตั้งค่า');
    open(thai.el);
    expect(thai.el.querySelector('.dg-modal-title')?.textContent).toBe('ตั้งค่า');
    expect(thai.el.querySelector('.dg-modal-ok')?.textContent).toBe('ตกลง');
    const { el } = make({ columns: [{ key: 'a', label: '<b>"A"</b>\nTwo' }, { key: 'b' }] });
    open(el);
    const item = /** @type {HTMLElement} */ (el.querySelector('.dg-columns-item'));
    expect(item.querySelector('b')).toBeNull();
    expect(item.textContent).toBe('<b>"A"</b> / Two');
  });

  it('marks the button aria-expanded while the modal is open and opens only one', () => {
    const { el } = make();
    const btn = /** @type {HTMLButtonElement} */ (el.querySelector('.dg-columns-btn'));
    expect(btn.getAttribute('aria-haspopup')).toBe('dialog');
    open(el);
    open(el);
    expect(el.querySelectorAll('.dg-modal')).toHaveLength(1);
    expect(btn.getAttribute('aria-expanded')).toBe('true');
  });

  it('discards the changes on Cancel, Escape and a click on the backdrop (focus back on the button)', () => {
    const { el, grid } = make();
    const btn = /** @type {HTMLButtonElement} */ (el.querySelector('.dg-columns-btn'));
    btn.focus();
    for (const close of [
      () => /** @type {HTMLButtonElement} */ (el.querySelector('.dg-modal-cancel')).click(),
      () => press(box(el, 'name'), 'Escape'),
      () => /** @type {HTMLElement} */ (dialog(el)).click(),
    ]) {
      open(el);
      box(el, 'role').click();
      close();
      expect(dialog(el)).toBeNull();
      expect(btn.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(btn);
    }
    expect(grid.getHiddenColumns()).toEqual([]);
  });

  it('keeps the modal open on a click inside it', () => {
    const { el } = make();
    open(el);
    box(el, 'name').click();
    expect(dialog(el)).not.toBeNull();
  });

  it('hides and shows a column on Apply, not before', () => {
    const { el, grid } = make();
    expect(headers(el)).toEqual(['name', 'role', 'city', 'ops']);
    open(el);
    box(el, 'role').click();
    expect(headers(el)).toEqual(['name', 'role', 'city', 'ops']);
    apply(el);
    expect(dialog(el)).toBeNull();
    expect(headers(el)).toEqual(['name', 'city', 'ops']);
    expect(el.querySelectorAll('tbody tr:first-child td')).toHaveLength(3);
    expect(grid.getHiddenColumns()).toEqual(['role']);
    toggle(el, 'role');
    expect(headers(el)).toEqual(['name', 'role', 'city', 'ops']);
    expect(grid.getHiddenColumns()).toEqual([]);
  });

  it('starts from the current hidden columns', () => {
    const { el } = make({ hiddenColumns: ['city'] });
    open(el);
    expect(box(el, 'city').checked).toBe(false);
    expect(box(el, 'name').checked).toBe(true);
  });

  it('disables the last checked checkbox so a column always stays', () => {
    const { el } = make();
    open(el);
    box(el, 'name').click();
    expect(box(el, 'role').disabled).toBe(false);
    box(el, 'role').click();
    expect(box(el, 'city').disabled).toBe(true);
    expect(box(el, 'city').checked).toBe(true);
    box(el, 'name').click();
    expect(box(el, 'city').disabled).toBe(false);
  });

  it('keeps Tab inside the modal, the close button being its last stop', () => {
    const { el } = make();
    open(el);
    const close = /** @type {HTMLButtonElement} */ (el.querySelector('.dg-modal-x'));
    close.focus();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    close.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(box(el, 'name'));
    const back = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    box(el, 'name').dispatchEvent(back);
    expect(back.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(close);
    // Apply is no longer the end of the ring: Tab from it goes on (natively) to the close button.
    const ok = /** @type {HTMLButtonElement} */ (el.querySelector('.dg-modal-ok'));
    ok.focus();
    const next = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    ok.dispatchEvent(next);
    expect(next.defaultPrevented).toBe(false);
  });

  it('dismisses an open modal on destroy', () => {
    const { el, grid } = make();
    open(el);
    expect(() => grid.destroy()).not.toThrow();
    expect(el.querySelector('.dg-modal')).toBeNull();
  });
});

describe('Columns button state', () => {
  const button = (/** @type {HTMLElement} */ el) => el.querySelector('.dg-columns-btn');

  it('is marked active while a column is hidden, and clears when all are shown again', () => {
    const { el, grid } = make();
    expect(button(el)?.hasAttribute('data-active')).toBe(false);
    grid.setHiddenColumns(['city']);
    expect(button(el)?.hasAttribute('data-active')).toBe(true);
    toggle(el, 'city');
    expect(button(el)?.hasAttribute('data-active')).toBe(false);
    toggle(el, 'role');
    expect(button(el)?.hasAttribute('data-active')).toBe(true);
    grid.resetView();
    expect(button(el)?.hasAttribute('data-active')).toBe(false);
  });

  it('starts active with hiddenColumns, or with columns restored from storage', () => {
    expect(button(make({ hiddenColumns: ['role'] }).el)?.hasAttribute('data-active')).toBe(true);
    make({ columnStorageKey: 'x' }).grid.setHiddenColumns(['city']);
    expect(button(make({ columnStorageKey: 'x' }).el)?.hasAttribute('data-active')).toBe(true);
  });
});

describe('hidden columns API', () => {
  it('starts from hiddenColumns and reports a copy', () => {
    const { el, grid } = make({ hiddenColumns: ['city'] });
    expect(headers(el)).toEqual(['name', 'role', 'ops']);
    open(el);
    expect(box(el, 'city').checked).toBe(false);
    grid.getHiddenColumns().push('x');
    expect(grid.getHiddenColumns()).toEqual(['city']);
  });

  it('setHiddenColumns updates the grid and the modal checkboxes, with or without the picker', () => {
    const { el, grid } = make();
    grid.setHiddenColumns(['name', 'city']);
    expect(headers(el)).toEqual(['role', 'ops']);
    open(el);
    expect(box(el, 'name').checked).toBe(false);
    expect(box(el, 'role').disabled).toBe(true);
    const bare = make({ columnPicker: false });
    bare.grid.setHiddenColumns(['name']);
    expect(headers(bare.el)).toEqual(['role', 'city', 'ops']);
  });

  it('throws on an unknown key, an action column or hiding everything, and changes nothing', () => {
    const { el, grid } = make();
    expect(() => grid.setHiddenColumns(['nope'])).toThrow(RangeError);
    expect(() => grid.setHiddenColumns(['ops'])).toThrow(RangeError);
    expect(() => grid.setHiddenColumns(['name', 'role', 'city'])).toThrow(RangeError);
    expect(headers(el)).toEqual(['name', 'role', 'city', 'ops']);
    expect(() => make({ hiddenColumns: ['nope'] })).toThrow(RangeError);
  });

  it('emits columnsChange (and calls onColumnsChange) only when the set changes', () => {
    const onColumnsChange = vi.fn();
    const { grid } = make({ onColumnsChange });
    const spy = vi.fn();
    grid.on('columnsChange', spy);
    grid.setHiddenColumns(['role']);
    grid.setHiddenColumns(['role']);
    grid.setHiddenColumns([]);
    expect(spy.mock.calls).toEqual([[['role']], [[]]]);
    expect(onColumnsChange).toHaveBeenCalledTimes(2);
  });

  it('keeps sort and page, and still sorts by a hidden column', () => {
    const sortable = columns.map((c) => ({ ...c, sortable: true }));
    const { el, grid } = make({ columns: sortable, pageSize: 1 });
    grid.setSort({ key: 'role', direction: 'asc' });
    grid.setHiddenColumns(['role']);
    expect(grid.getSort()).toEqual({ key: 'role', direction: 'asc' });
    expect(el.querySelector('tbody td')?.textContent).toBe('Grace'); // Admiral sorts first
  });

  it('is a no-op after destroy', () => {
    const { grid } = make();
    grid.destroy();
    expect(() => grid.setHiddenColumns(['role'])).not.toThrow();
  });
});

describe('search follows the visible columns', () => {
  /** @param {HTMLElement} el */
  const options = (el) =>
    [...el.querySelectorAll('select.dg-search-column option')].map((o) => ({
      value: /** @type {HTMLOptionElement} */ (o).value,
      off:
        /** @type {HTMLOptionElement} */ (o).hidden &&
        /** @type {HTMLOptionElement} */ (o).disabled,
    }));
  const search = () => make({ searchable: true, searchColumnSelect: true });

  it('hides the option of a hidden column in the search column select, and brings it back', () => {
    const { el, grid } = search();
    grid.setHiddenColumns(['role']);
    expect(options(el)).toEqual([
      { value: '', off: false },
      { value: 'name', off: false },
      { value: 'role', off: true },
      { value: 'city', off: false },
    ]);
    grid.setHiddenColumns([]);
    expect(options(el).every((o) => !o.off)).toBe(true);
  });

  it('is in step from the start (hiddenColumns, saved choice)', () => {
    const { el } = make({ searchable: true, searchColumnSelect: true, hiddenColumns: ['city'] });
    expect(options(el).find((o) => o.value === 'city')?.off).toBe(true);
  });

  it('searches only the visible columns when the search is on every column', () => {
    const { el, grid } = search();
    grid.setFilter({ search: 'engineer' });
    expect(el.querySelectorAll('tbody tr')).toHaveLength(1);
    grid.setHiddenColumns(['role']);
    expect(el.querySelectorAll('tbody tr:not(.dg-empty)')).toHaveLength(0);
    grid.setHiddenColumns([]);
    expect(el.querySelectorAll('tbody tr')).toHaveLength(1);
  });

  it('puts a search limited to a column that gets hidden back on every column', () => {
    const { el, grid } = search();
    const spy = vi.fn();
    grid.setSearchColumn('role');
    grid.setFilter({ search: 'engineer' });
    grid.on('filterChange', spy);
    grid.setHiddenColumns(['role']);
    expect(grid.getSearchColumn()).toBeNull();
    expect(/** @type {HTMLSelectElement} */ (el.querySelector('select')).value).toBe('');
    expect(spy).toHaveBeenCalled();
    grid.setHiddenColumns([]);
    grid.setSearchColumn('role');
    grid.setHiddenColumns(['city']);
    expect(grid.getSearchColumn()).toBe('role');
  });

  it('exports the rows the grid shows, so a hidden column is not searched there either', async () => {
    const { grid } = search();
    grid.setFilter({ search: 'engineer' });
    const all = grid.exportExcel({ filename: 'x.xlsx' }).size;
    grid.setHiddenColumns(['role']);
    expect(grid.exportExcel({ filename: 'x.xlsx' }).size).toBeLessThan(all);
  });
});

describe('columnStorageKey (localStorage)', () => {
  it('saves every change under datagrid:columns:<key>', () => {
    const { el } = make({ columnStorageKey: 'po' });
    expect(saved()).toBeNull();
    toggle(el, 'role');
    expect(JSON.parse(/** @type {string} */ (saved()))).toEqual(['role']);
    toggle(el, 'role');
    expect(JSON.parse(/** @type {string} */ (saved()))).toEqual([]);
  });

  it('restores the saved choice on the next grid, ahead of hiddenColumns', () => {
    localStorage.setItem('datagrid:columns:po', JSON.stringify(['city']));
    const { el, grid } = make({ columnStorageKey: 'po', hiddenColumns: ['name'] });
    expect(headers(el)).toEqual(['name', 'role', 'ops']);
    expect(grid.getHiddenColumns()).toEqual(['city']);
    open(el);
    expect(box(el, 'city').checked).toBe(false);
  });

  it('survives a reload end to end', () => {
    toggle(make({ columnStorageKey: 'po' }).el, 'name');
    expect(headers(make({ columnStorageKey: 'po' }).el)).toEqual(['role', 'city', 'ops']);
  });

  it('uses hiddenColumns when nothing is saved, and keeps grids with other keys apart', () => {
    const initial = make({ columnStorageKey: 'po', hiddenColumns: ['role'] });
    expect(headers(initial.el)).toEqual(['name', 'city', 'ops']);
    toggle(make({ columnStorageKey: 'a' }).el, 'name');
    expect(headers(make({ columnStorageKey: 'b' }).el)).toEqual(['name', 'role', 'city', 'ops']);
  });

  it('ignores saved keys that are no longer columns, bad JSON and an all-hidden list', () => {
    localStorage.setItem('datagrid:columns:po', JSON.stringify(['role', 'gone']));
    expect(make({ columnStorageKey: 'po' }).grid.getHiddenColumns()).toEqual(['role']);
    localStorage.setItem('datagrid:columns:po', '{not json');
    expect(make({ columnStorageKey: 'po' }).grid.getHiddenColumns()).toEqual([]);
    localStorage.setItem('datagrid:columns:po', JSON.stringify(['name', 'role', 'city']));
    expect(make({ columnStorageKey: 'po' }).grid.getHiddenColumns()).toEqual([]);
  });

  it('saves nothing without columnStorageKey', () => {
    toggle(make().el, 'role');
    expect(localStorage.length).toBe(0);
  });

  it('still works when localStorage throws (private mode, full quota)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const { el, grid } = make({ columnStorageKey: 'po', hiddenColumns: ['city'] });
    expect(grid.getHiddenColumns()).toEqual(['city']);
    expect(() => toggle(el, 'role')).not.toThrow();
    expect(headers(el)).toEqual(['name', 'ops']);
  });
});

describe('sort in the settings modal', () => {
  const sortable = columns.map((c) => ({ ...c, sortable: c.key !== 'ops' }));
  const sortKey = (/** @type {HTMLElement} */ el) =>
    /** @type {HTMLSelectElement} */ (el.querySelector('.dg-settings-sort-key'));
  const sortDir = (/** @type {HTMLElement} */ el) =>
    /** @type {HTMLSelectElement} */ (el.querySelector('.dg-settings-sort-dir'));
  const choose = (/** @type {HTMLSelectElement} */ select, /** @type {string} */ value) => {
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const names = (/** @type {HTMLElement} */ el) =>
    [...el.querySelectorAll('tbody tr td:first-child')].map((td) => td.textContent);

  it('is left out when no column is sortable', () => {
    const { el } = make();
    open(el);
    expect(el.querySelector('.dg-settings-sort')).toBeNull();
  });

  it('lists the sortable columns, starts from the current sort and disables the direction when unsorted', () => {
    const { el, grid } = make({ columns: sortable });
    open(el);
    expect([...sortKey(el).options].map((o) => o.value)).toEqual(['', 'name', 'role', 'city']);
    expect(sortKey(el).value).toBe('');
    expect(sortDir(el).disabled).toBe(true);
    press(box(el, 'name'), 'Escape');
    grid.setSort({ key: 'role', direction: 'desc' });
    open(el);
    expect(sortKey(el).value).toBe('role');
    expect(sortDir(el).value).toBe('desc');
    expect(sortDir(el).disabled).toBe(false);
  });

  it('sorts on Apply, not before, and clears the sort with "no sorting"', () => {
    const { el, grid } = make({ columns: sortable });
    open(el);
    choose(sortKey(el), 'name');
    choose(sortDir(el), 'desc');
    expect(grid.getSort()).toBeNull();
    apply(el);
    expect(grid.getSort()).toEqual({ key: 'name', direction: 'desc' });
    expect(names(el)).toEqual(['Grace', 'Ada']);
    open(el);
    choose(sortKey(el), '');
    apply(el);
    expect(grid.getSort()).toBeNull();
  });

  it('is saved with sortStorageKey like any other sort change', () => {
    const { el } = make({ columns: sortable, sortStorageKey: 'po' });
    open(el);
    choose(sortKey(el), 'city');
    apply(el);
    expect(JSON.parse(/** @type {string} */ (localStorage.getItem('datagrid:sort:po')))).toEqual({
      key: 'city',
      direction: 'asc',
    });
  });

  it('keeps the sort when the modal is cancelled', () => {
    const { el, grid } = make({ columns: sortable });
    open(el);
    choose(sortKey(el), 'name');
    press(box(el, 'name'), 'Escape');
    expect(grid.getSort()).toBeNull();
  });
});
