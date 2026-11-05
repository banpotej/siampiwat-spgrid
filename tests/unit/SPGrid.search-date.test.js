import { beforeEach, describe, expect, it } from 'vitest';
import { SPGrid, thaiLabels } from '../../src/index.js';
import { dayOf, parseDayRange } from '../../src/core/dates.js';
import { searchKind } from '../../src/core/columns.js';
import { filterRows } from '../../src/core/filter.js';

beforeEach(() => localStorage.clear());

/** @type {import('../../src/types.js').Column[]} */
const columns = [
  { key: 'name', label: 'Name' },
  { key: 'due', label: 'Due', type: 'date' },
  { key: 'status', label: 'Status', options: ['a', 'b'] },
];
const rows = [
  { name: 'A', due: '2026-10-01', status: 'a' },
  { name: 'B', due: '2026-10-15', status: 'b' },
  { name: 'C', due: new Date(2026, 9, 28, 23, 30), status: 'a' },
  { name: 'D', due: null, status: 'b' },
];

/** @param {object} [extra] */
const make = (extra = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new SPGrid(el, {
    columns,
    rows,
    searchable: true,
    searchColumnSelect: true,
    ...extra,
  });
  const input = /** @type {HTMLInputElement} */ (el.querySelector('.spg-search'));
  const column = /** @type {HTMLSelectElement} */ (el.querySelector('.spg-search-column'));
  const range = /** @type {HTMLElement} */ (el.querySelector('.spg-search-range'));
  const from = /** @type {HTMLInputElement} */ (el.querySelector('.spg-date-from'));
  const to = /** @type {HTMLInputElement} */ (el.querySelector('.spg-date-to'));
  return { el, grid, input, column, range, from, to };
};
/** @param {HTMLInputElement | HTMLSelectElement} control @param {string} v */
const set = (control, v) => {
  control.value = v;
  control.dispatchEvent(new Event('change', { bubbles: true }));
};
const names = (/** @type {HTMLElement} */ el) =>
  [...el.querySelectorAll('tbody tr')].map((tr) => tr.querySelector('td')?.textContent);

describe('core/dates', () => {
  it('dayOf gives the calendar day as shown, and null for anything unreadable', () => {
    expect(dayOf('2026-10-01')).toBe('2026-10-01');
    expect(dayOf(new Date(2026, 9, 28, 23, 30))).toBe('2026-10-28');
    expect(dayOf(new Date(2026, 0, 5).getTime())).toBe('2026-01-05');
    for (const bad of [null, undefined, '', 'nope', NaN]) expect(dayOf(bad)).toBeNull();
  });

  it('parseDayRange keeps only valid days', () => {
    expect(parseDayRange('2026-10-01..2026-10-15')).toEqual({
      from: '2026-10-01',
      to: '2026-10-15',
    });
    expect(parseDayRange('2026-10-01..')).toEqual({ from: '2026-10-01', to: '' });
    expect(parseDayRange('..2026-10-15')).toEqual({ from: '', to: '2026-10-15' });
    expect(parseDayRange('x..2026-1-1')).toEqual({ from: '', to: '' });
    expect(parseDayRange(null)).toEqual({ from: '', to: '' });
  });

  it('searchKind tells enum, date and text columns apart', () => {
    expect(searchKind(columns[2])).toBe('enum');
    expect(searchKind(columns[1])).toBe('date');
    expect(searchKind(columns[0])).toBe('text');
    expect(searchKind(undefined)).toBe('text');
  });
});

describe('filterRows range', () => {
  const f = (/** @type {string} */ search) => ({ search, columns: ['due'], range: true });
  const pick = (/** @type {string} */ search) => filterRows(rows, f(search)).map((r) => r.name);
  it('keeps the days between from and to, both inclusive, either side optional', () => {
    expect(pick('2026-10-01..2026-10-15')).toEqual(['A', 'B']);
    expect(pick('2026-10-02..')).toEqual(['B', 'C']);
    expect(pick('..2026-10-14')).toEqual(['A']);
    expect(pick('2026-10-28..2026-10-28')).toEqual(['C']);
  });

  it('never matches a blank date, and ignores a range without a valid day', () => {
    expect(pick('2026-01-01..2027-01-01')).not.toContain('D');
    expect(pick('junk..')).toHaveLength(4);
  });
});

describe('date search column', () => {
  it('shows two date boxes in place of the text box, and back', () => {
    const { input, column, range } = make();
    expect(range.hidden).toBe(true);
    set(column, 'due');
    expect(input.hidden).toBe(true);
    expect(range.hidden).toBe(false);
    expect(range.querySelectorAll('input[type="date"]')).toHaveLength(2);
    set(column, 'name');
    expect(input.hidden).toBe(false);
    expect(range.hidden).toBe(true);
  });

  it('filters as soon as a date is chosen, from, to or both', () => {
    const { el, grid, column, from, to } = make();
    set(column, 'due');
    set(from, '2026-10-10');
    expect(names(el)).toEqual(['B', 'C']);
    expect(grid.getFilter()).toEqual({ search: '2026-10-10..', searchColumn: 'due' });
    set(to, '2026-10-20');
    expect(names(el)).toEqual(['B']);
    expect(grid.getFilter()?.search).toBe('2026-10-10..2026-10-20');
    set(from, '');
    set(to, '');
    expect(names(el)).toHaveLength(4);
    expect(grid.getFilter()).toBeNull();
  });

  it('marks the whole cell and shows the clear icon while a range is set', () => {
    const { el, column, from } = make();
    const clear = /** @type {HTMLElement} */ (el.querySelector('.spg-search-clear'));
    set(column, 'due');
    expect(clear.hidden).toBe(true);
    set(from, '2026-10-10');
    expect(clear.hidden).toBe(false);
    expect(el.querySelectorAll('td.spg-match')).toHaveLength(2);
    expect(el.querySelector('mark.spg-mark')).toBeNull();
  });

  it('is cleared by the clear icon, and mirrored from setFilter', () => {
    const { el, grid, column, from, to } = make();
    set(column, 'due');
    grid.setFilter({ search: '2026-10-01..2026-10-15' });
    expect([from.value, to.value]).toEqual(['2026-10-01', '2026-10-15']);
    expect(names(el)).toEqual(['A', 'B']);
    /** @type {HTMLButtonElement} */ (el.querySelector('.spg-search-clear')).click();
    expect([from.value, to.value]).toEqual(['', '']);
    expect(grid.getFilter()).toBeNull();
    expect(column.value).toBe('due');
  });

  it('starts over when the kind of column changes, and by resetView()', () => {
    const { grid, column, input, range, from } = make();
    set(column, 'due');
    set(from, '2026-10-10');
    set(column, 'status');
    expect(grid.getFilter()).toBeNull();
    expect(range.hidden).toBe(true);
    set(column, 'due');
    set(from, '2026-10-10');
    grid.resetView();
    expect(column.value).toBe('');
    expect(input.hidden).toBe(false);
    expect(range.hidden).toBe(true);
    expect(grid.getFilter()).toBeNull();
  });

  it('uses the Thai labels, and is absent without searchColumnSelect', () => {
    const { from, to } = make({ labels: thaiLabels });
    expect([from.getAttribute('aria-label'), to.getAttribute('aria-label')]).toEqual([
      'ตั้งแต่',
      'ถึง',
    ]);
    expect(make({ searchColumnSelect: false }).range).toBeNull();
  });
});
