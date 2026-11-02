import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataGrid, thaiLabels } from '../../src/index.js';
import { computeView } from '../../src/core/view.js';

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'ผู้ตรวจรับ\nRole' },
  { key: 'ops', label: 'Ops', actions: [{ name: 'view', label: 'View' }] },
];
const rows = [
  { id: 1, name: 'Ada', role: 'Engineer' },
  { id: 2, name: 'Grace', role: 'Admiral' },
  { id: 3, name: 'Eve', role: 'Ada Tester' },
];

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

/** @param {object} [options] */
const make = (options = {}) => {
  const el = document.createElement('div');
  const grid = new DataGrid(el, {
    columns,
    rows,
    searchable: true,
    searchColumnSelect: true,
    ...options,
  });
  return { el, grid };
};
/** @param {HTMLElement} el */
const select = (el) =>
  /** @type {HTMLSelectElement} */ (el.querySelector('select.dg-search-column'));
/** @param {HTMLElement} el @param {string} value */
const type = (el, value) => {
  const input = /** @type {HTMLInputElement} */ (el.querySelector('input[type="search"]'));
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  vi.advanceTimersByTime(250);
};
/** @param {HTMLElement} el @param {string} value */
const choose = (el, value) => {
  select(el).value = value;
  select(el).dispatchEvent(new Event('change', { bubbles: true }));
};
/** @param {HTMLElement} el */
const names = (el) =>
  [...el.querySelectorAll('tbody tr:not(.dg-empty)')].map(
    (tr) => tr.querySelectorAll('td')[1].textContent,
  );

describe('search column select', () => {
  it('is not rendered unless searchColumnSelect is on (or without searchable)', () => {
    expect(select(make({ searchColumnSelect: false }).el)).toBeNull();
    expect(select(make({ searchable: false }).el)).toBeNull();
  });

  it('lists "All columns" then each data column, flattening multi-line headers, skipping action columns', () => {
    const { el } = make();
    const options = [...select(el).options].map((o) => [o.value, o.textContent]);
    expect(options).toEqual([
      ['', 'All columns'],
      ['id', 'ID'],
      ['name', 'Name'],
      ['role', 'ผู้ตรวจรับ / Role'],
    ]);
    expect(select(el).getAttribute('aria-label')).toBe('Search in');
  });

  it('uses the labels option for its texts', () => {
    const { el } = make({ labels: thaiLabels });
    expect(select(el).getAttribute('aria-label')).toBe('ค้นหาใน');
    expect(select(el).options[0].textContent).toBe('ทุกคอลัมน์');
  });

  it('escapes column keys and labels', () => {
    const { el } = make({ columns: [{ key: 'a"><b>', label: '<i>x</i>' }], rows: [] });
    expect(el.querySelector('select i, select b')).toBeNull();
    expect(select(el).options[1].value).toBe('a"><b>');
    expect(select(el).options[1].textContent).toBe('<i>x</i>');
  });

  it('searches every column by default', () => {
    const { el } = make();
    type(el, 'ada');
    expect(names(el)).toEqual(['Ada', 'Eve']);
  });

  it('limits the search to the chosen column and re-filters at once', () => {
    const { el, grid } = make();
    type(el, 'ada');
    choose(el, 'name');
    expect(names(el)).toEqual(['Ada']);
    expect(grid.getSearchColumn()).toBe('name');
    choose(el, '');
    expect(names(el)).toEqual(['Ada', 'Eve']);
    expect(grid.getSearchColumn()).toBeNull();
  });

  it('keeps the chosen column when the search text is cleared and typed again', () => {
    const { el } = make();
    choose(el, 'role');
    type(el, 'ada');
    expect(names(el)).toEqual(['Eve']);
    type(el, '');
    type(el, 'ada');
    expect(names(el)).toEqual(['Eve']);
  });

  it('goes back to page 1 when the column changes', () => {
    const { el, grid } = make({ pageSize: 1 });
    grid.setPage(3);
    choose(el, 'name');
    expect(grid.getPage()).toBe(1);
  });

  it('emits filterChange once with searchColumn only while a search is active', () => {
    const { el, grid } = make();
    const spy = vi.fn();
    grid.on('filterChange', spy);
    choose(el, 'name');
    expect(spy).not.toHaveBeenCalled();
    type(el, 'ada');
    expect(spy).toHaveBeenLastCalledWith({ search: 'ada', searchColumn: 'name' });
    choose(el, 'role');
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenLastCalledWith({ search: 'ada', searchColumn: 'role' });
  });

  it('getFilter leaves searchColumn out when there is no search text', () => {
    const { grid } = make();
    grid.setSearchColumn('name');
    expect(grid.getFilter()).toBeNull();
    grid.setFilter({ columnFilters: { role: 'eng' } });
    expect(grid.getFilter()).toEqual({ columnFilters: { role: 'eng' } });
  });

  it('setSearchColumn moves the select, validates the key and ignores action columns', () => {
    const { el, grid } = make();
    grid.setSearchColumn('role');
    expect(select(el).value).toBe('role');
    expect(() => grid.setSearchColumn('nope')).toThrow(RangeError);
    expect(() => grid.setSearchColumn('ops')).toThrow(RangeError);
    expect(grid.getSearchColumn()).toBe('role');
    grid.setSearchColumn(null);
    expect(select(el).value).toBe('');
  });

  it('works without the select (API only) and does nothing after destroy', () => {
    const { el, grid } = make({ searchColumnSelect: false });
    type(el, 'ada');
    grid.setSearchColumn('name');
    expect(names(el)).toEqual(['Ada']);
    grid.destroy();
    expect(() => grid.setSearchColumn('role')).not.toThrow();
    expect(grid.getSearchColumn()).toBe('name');
  });

  it('stops listening after destroy', () => {
    const { el, grid } = make();
    const spy = vi.fn();
    grid.on('filterChange', spy);
    const sel = select(el);
    grid.destroy();
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('computeView with searchColumn', () => {
  const base = { columns, rows, sort: null, page: 1, pageSize: null };
  it('limits the global search to that column', () => {
    const filter = { search: 'ada' };
    expect(computeView({ ...base, filter, searchColumn: 'name' }).rows).toHaveLength(1);
    expect(computeView({ ...base, filter, searchColumn: null }).rows).toHaveLength(2);
    expect(computeView({ ...base, filter }).rows).toHaveLength(2);
  });
});
