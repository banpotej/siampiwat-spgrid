import { beforeEach, describe, expect, it } from 'vitest';
import { SPGrid, thaiLabels } from '../../src/index.js';
import { columnOptions } from '../../src/core/columns.js';
import { filterRows } from '../../src/core/filter.js';

beforeEach(() => localStorage.clear());

/** @type {import('../../src/types.js').Column[]} */
const columns = [
  { key: 'name', label: 'Name' },
  {
    key: 'status',
    label: 'Status',
    type: 'badge',
    badges: { Approved: { tone: 'success' }, 'Not Approved': { label: 'Rejected' } },
  },
  { key: 'tier', label: 'Tier', options: ['gold', { value: 'silver', label: 'Silver <b>' }] },
  { key: 'note', label: 'Note' },
];
const rows = [
  { name: 'A', status: 'Approved', tier: 'gold', note: 'x' },
  { name: 'B', status: 'Not Approved', tier: 'silver', note: 'y' },
  { name: 'C', status: 'Approved', tier: 'silver', note: 'z' },
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
  const value = /** @type {HTMLSelectElement} */ (el.querySelector('.spg-search-value'));
  const column = /** @type {HTMLSelectElement} */ (el.querySelector('.spg-search-column'));
  return { el, grid, input, value, column };
};
/** @param {HTMLSelectElement} select @param {string} v */
const choose = (select, v) => {
  select.value = v;
  select.dispatchEvent(new Event('change', { bubbles: true }));
};
const names = (/** @type {HTMLElement} */ el) =>
  [...el.querySelectorAll('tbody tr')].map((tr) => tr.querySelector('td')?.textContent);

describe('columnOptions', () => {
  it('reads options, then badges, and is null for anything else', () => {
    expect(columnOptions(columns[2])).toEqual([
      { value: 'gold', label: 'gold' },
      { value: 'silver', label: 'Silver <b>' },
    ]);
    expect(columnOptions(columns[1])).toEqual([
      { value: 'Approved', label: 'Approved' },
      { value: 'Not Approved', label: 'Rejected' },
    ]);
    expect(columnOptions(columns[0])).toBeNull();
    expect(columnOptions({ key: 'x', options: [] })).toBeNull();
    expect(columnOptions({ key: 'x', type: 'badge' })).toBeNull();
    expect(columnOptions({ key: 'x', options: ['a'], actions: [] })).toBeNull();
    expect(columnOptions(undefined)).toBeNull();
  });
});

describe('filterRows exact', () => {
  it('matches the whole cell, case-insensitively, instead of a substring', () => {
    const f = { search: 'approved', columns: ['status'] };
    expect(filterRows(rows, f)).toHaveLength(3);
    expect(filterRows(rows, { ...f, exact: true }).map((r) => r.name)).toEqual(['A', 'C']);
    const padded = { search: ' APPROVED ', columns: ['status'], exact: true };
    expect(filterRows(rows, padded)).toHaveLength(2);
    expect(filterRows([{ status: null }], { ...f, exact: true })).toEqual([]);
  });
});

describe('enum search column', () => {
  it('shows the text box until an enum column is chosen, then a select of its values', () => {
    const { input, value, column } = make();
    expect(input.hidden).toBe(false);
    expect(value.hidden).toBe(true);
    choose(column, 'status');
    expect(input.hidden).toBe(true);
    expect(value.hidden).toBe(false);
    expect([...value.options].map((o) => [o.value, o.textContent])).toEqual([
      ['', 'All'],
      ['Approved', 'Approved'],
      ['Not Approved', 'Rejected'],
    ]);
    choose(column, 'name');
    expect(input.hidden).toBe(false);
    expect(value.hidden).toBe(true);
  });

  it('filters at once on the exact value, so Approved does not catch Not Approved', () => {
    const { el, grid, input, value, column } = make();
    choose(column, 'status');
    choose(value, 'Approved');
    expect(names(el)).toEqual(['A', 'C']);
    expect(input.value).toBe('Approved');
    expect(grid.getFilter()).toEqual({ search: 'Approved', searchColumn: 'status' });
    choose(value, 'Not Approved');
    expect(names(el)).toEqual(['B']);
    choose(value, '');
    expect(names(el)).toEqual(['A', 'B', 'C']);
    expect(grid.getFilter()).toBeNull();
  });

  it('works for an options column and keeps the label as text (escaped)', () => {
    const { el, value, column } = make();
    choose(column, 'tier');
    expect(value.options[2].textContent).toBe('Silver <b>');
    expect(el.querySelector('.spg-search-value b')).toBeNull();
    choose(value, 'silver');
    expect(names(el)).toEqual(['B', 'C']);
  });

  it('starts over when the kind of column changes, and keeps the text between plain columns', () => {
    const { el, grid, input, column } = make();
    grid.setFilter({ search: 'A' });
    choose(column, 'note');
    expect(grid.getFilter()?.search).toBe('A');
    choose(column, 'status');
    expect(grid.getFilter()).toBeNull();
    expect(input.value).toBe('');
    expect(names(el)).toHaveLength(3);
  });

  it('mirrors setFilter into the select, and Clear empties it', () => {
    const { el, grid, value, column } = make();
    grid.setSearchColumn('status');
    grid.setFilter({ search: 'approved' });
    expect(value.value).toBe('Approved');
    expect(names(el)).toEqual(['A', 'C']);
    /** @type {HTMLButtonElement} */ (el.querySelector('.spg-search-clear')).click();
    expect(value.value).toBe('');
    expect(grid.getFilter()).toBeNull();
    expect(column.value).toBe('status');
  });

  it('is undone by resetView()', () => {
    const { grid, input, value, column } = make();
    choose(column, 'status');
    choose(value, 'Approved');
    grid.resetView();
    expect(column.value).toBe('');
    expect(input.hidden).toBe(false);
    expect(value.hidden).toBe(true);
    expect(grid.getFilter()).toBeNull();
  });

  it('uses the Thai All label and is absent without searchColumnSelect', () => {
    expect(make({ labels: thaiLabels }).value.options[0].textContent).toBe('ทั้งหมด');
    expect(make({ searchColumnSelect: false }).value).toBeNull();
  });

  it('marks the whole matching cell (not pieces of its text), and only with highlightSearch', () => {
    const { el, value, column } = make();
    choose(column, 'status');
    choose(value, 'Not Approved');
    const cells = el.querySelectorAll('td.spg-match');
    expect(cells).toHaveLength(1);
    expect(cells[0].textContent).toContain('Rejected');
    expect(el.querySelector('mark.spg-mark')).toBeNull();
    choose(column, 'name');
    expect(el.querySelector('td.spg-match')).toBeNull();
    const off = make({ highlightSearch: false });
    choose(off.column, 'status');
    choose(off.value, 'Approved');
    expect(off.el.querySelector('td.spg-match')).toBeNull();
  });

  it('has no clear icon in the field while the value select is shown', () => {
    const { el, grid, column, value } = make();
    const clear = /** @type {HTMLElement} */ (el.querySelector('.spg-search-clear'));
    grid.setFilter({ search: 'x' });
    expect(clear.hidden).toBe(false);
    choose(column, 'status');
    expect(clear.hidden).toBe(true);
    choose(value, 'Approved');
    expect(clear.hidden).toBe(true);
    choose(column, 'name');
    grid.setFilter({ search: 'x' });
    expect(clear.hidden).toBe(false);
  });
});
