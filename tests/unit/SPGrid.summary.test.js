import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPGrid, thaiLabels } from '../../src/index.js';
import { removeFilterPart } from '../../src/core/filter.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const columns = [
  { key: 'name', label: 'ชื่อ\nName' },
  { key: 'role', label: 'Role' },
];
const rows = [
  { name: 'Ada', role: 'Engineer' },
  { name: 'Adam', role: 'Admiral' },
  { name: 'Eve', role: 'Tester' },
];

/** @param {object} [options] */
const make = (options = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new SPGrid(el, { columns, rows, filterSummary: true, ...options });
  return { el, grid };
};
/** @param {HTMLElement} el */
const summary = (el) => /** @type {HTMLElement | null} */ (el.querySelector('.spg-summary'));
/** @param {HTMLElement} el */
const chips = (el) => [...el.querySelectorAll('.spg-chip-text')].map((c) => c.textContent);
/** @param {HTMLElement} el */
const count = (el) => el.querySelector('.spg-summary-count')?.textContent;

describe('removeFilterPart (core)', () => {
  it('drops the search or one column filter and normalizes the rest', () => {
    const filter = { search: 'a', columnFilters: { role: 'x', name: 'y' } };
    expect(removeFilterPart(filter, { type: 'search' })).toEqual({
      columnFilters: { role: 'x', name: 'y' },
    });
    expect(removeFilterPart(filter, { type: 'column', key: 'role' })).toEqual({
      search: 'a',
      columnFilters: { name: 'y' },
    });
    expect(removeFilterPart({ search: 'a' }, { type: 'search' })).toBeNull();
    expect(removeFilterPart(null, { type: 'search' })).toBeNull();
  });
});

describe('filter summary', () => {
  it('is rendered only with filterSummary, and stays hidden while nothing is filtered', () => {
    expect(summary(make({ filterSummary: false }).el)).toBeNull();
    const { el, grid } = make();
    expect(summary(el)?.hidden).toBe(true);
    expect(summary(el)?.textContent).toBe('');
    grid.setFilter({ search: 'ada' });
    expect(summary(el)?.hidden).toBe(false);
  });

  it('shows how many rows matched out of all rows, and one chip for the search', () => {
    const { el, grid } = make();
    grid.setFilter({ search: 'ada' });
    expect(count(el)).toBe('Found 2 of 3');
    expect(chips(el)).toEqual(['Search: "ada"']);
  });

  it('counts the rows before paging', () => {
    const { el, grid } = make({ pageSize: 1 });
    grid.setFilter({ search: 'ada' });
    expect(el.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(count(el)).toBe('Found 2 of 3');
  });

  it('names the column the search is limited to (a multi-line header on one line)', () => {
    const { el, grid } = make();
    grid.setSearchColumn('name');
    grid.setFilter({ search: 'ada' });
    expect(chips(el)).toEqual(['ชื่อ / Name: "ada"']);
  });

  it('has a chip for each column filter, beside the search chip', () => {
    const { el, grid } = make();
    grid.setFilter({ search: 'a', columnFilters: { role: 'er', name: 'ชื่อ' } });
    expect(chips(el)).toEqual(['Search: "a"', 'Role: "er"', 'ชื่อ / Name: "ชื่อ"']);
  });

  it('uses labels.filterSummary, labels.search and labels.removeFilter (Thai included)', () => {
    const { el, grid } = make({ labels: thaiLabels });
    grid.setFilter({ search: 'ada' });
    expect(count(el)).toBe('พบ 2 จาก 3 รายการ');
    expect(chips(el)).toEqual(['ค้นหา: "ada"']);
    const remove = /** @type {HTMLButtonElement} */ (el.querySelector('.spg-chip-remove'));
    expect(remove.getAttribute('aria-label')).toBe('ลบตัวกรอง ค้นหา: "ada"');
    expect(remove.title).toBe('ลบตัวกรอง ค้นหา: "ada"');
    const custom = make({
      labels: {
        filterSummary: (/** @type {number} */ a, /** @type {number} */ b) => `${a}/${b}`,
        removeFilter: (/** @type {string} */ t) => `x ${t}`,
      },
    });
    custom.grid.setFilter({ search: 'ada' });
    expect(count(custom.el)).toBe('2/3');
  });

  it('escapes the search text, the column key and the labels', () => {
    const { el, grid } = make({ labels: { search: '<i>S</i>' } });
    grid.setFilter({ search: '<b>"x"</b>' });
    const summaryEl = /** @type {HTMLElement} */ (summary(el));
    expect(summaryEl.querySelector('b, i')).toBeNull();
    expect(chips(el)).toEqual(['<i>S</i>: "<b>"x"</b>"']);
    const remove = summaryEl.querySelector('.spg-chip-remove');
    expect(remove?.getAttribute('aria-label')).toBe('Remove filter <i>S</i>: "<b>"x"</b>"');
  });

  it('removes the search text, the box content and the column choice with the search chip', () => {
    const { el, grid } = make({ searchable: true, searchColumnSelect: true });
    const box = /** @type {HTMLInputElement} */ (el.querySelector('input.spg-search'));
    grid.setSearchColumn('role');
    grid.setFilter({ search: 'er' });
    expect(box.value).toBe('er');
    /** @type {HTMLElement} */ (el.querySelector('.spg-chip-remove')).click();
    expect(grid.getFilter()).toBeNull();
    expect(grid.getSearchColumn()).toBeNull();
    expect(box.value).toBe('');
    expect(/** @type {HTMLSelectElement} */ (el.querySelector('select')).value).toBe('');
    expect(el.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(summary(el)?.hidden).toBe(true);
  });

  it('removes a column filter and keeps the search', () => {
    const { el, grid } = make();
    grid.setFilter({ search: 'a', columnFilters: { role: 'er' } });
    /** @type {HTMLElement} */ (el.querySelector('.spg-chip-remove[data-key="role"]')).click();
    expect(grid.getFilter()).toEqual({ search: 'a' });
    expect(chips(el)).toEqual(['Search: "a"']);
  });

  it('emits filterChange once for a removal', () => {
    const { el, grid } = make();
    grid.setFilter({ search: 'ada' });
    const spy = vi.fn();
    grid.on('filterChange', spy);
    /** @type {HTMLElement} */ (el.querySelector('.spg-chip-remove')).click();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(null);
  });

  it('reports the empty text and an updated count when setRows changes the data', () => {
    const { el, grid } = make();
    grid.setFilter({ search: 'ada' });
    grid.setRows([{ name: 'Ada', role: 'x' }]);
    expect(count(el)).toBe('Found 1 of 1');
  });

  it('removes its listener on destroy', () => {
    const { el, grid } = make();
    const host = /** @type {HTMLElement} */ (summary(el));
    const remove = vi.spyOn(host, 'removeEventListener');
    grid.destroy();
    expect(remove.mock.calls.map(([type]) => type)).toContain('click');
  });
});
