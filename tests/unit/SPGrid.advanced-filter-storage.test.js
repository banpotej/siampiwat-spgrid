import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPGrid } from '../../src/index.js';

/** @type {import('../../src/types.js').Column[]} */
const columns = [
  { key: 'name', label: 'Name' },
  { key: 'amount', label: 'Amount', type: 'number' },
];
const rows = [
  { name: 'Ada', amount: 500 },
  { name: 'Grace', amount: 1500 },
  { name: 'Eve', amount: 2500 },
];
const KEY = 'spgrid:advancedFilter:po';
/** @type {any} */
const GT = { key: 'amount', op: 'gt', value: 800 };

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

/** @param {object} [options] */
const make = (options = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new SPGrid(el, { columns, rows, advancedFilterStorageKey: 'po', ...options });
  return { el, grid };
};
/** @param {HTMLElement} el */
const names = (el) =>
  [...el.querySelectorAll('tbody tr td:first-child')].map((td) => td.textContent);
const saved = () => JSON.parse(/** @type {string} */ (localStorage.getItem(KEY)));

describe('advancedFilterStorageKey (localStorage)', () => {
  it('saves every change under spgrid:advancedFilter:<key>', () => {
    const { grid } = make();
    expect(localStorage.getItem(KEY)).toBeNull();
    grid.setAdvancedFilter(GT);
    expect(saved()).toEqual(GT);
    grid.setAdvancedFilter(null);
    expect(saved()).toBeNull();
  });

  it('restores the saved filter on the next grid', () => {
    make().grid.setAdvancedFilter(GT);
    const { el, grid } = make();
    expect(names(el)).toEqual(['Grace', 'Eve']);
    expect(grid.getAdvancedFilter()).toEqual(GT);
  });

  it('remembers that the filter was cleared', () => {
    const first = make().grid;
    first.setAdvancedFilter(GT);
    first.setAdvancedFilter(null);
    expect(make().grid.getAdvancedFilter()).toBeNull();
  });

  it('is cleared by resetView', () => {
    const { grid } = make();
    grid.setAdvancedFilter(GT);
    grid.resetView();
    expect(saved()).toBeNull();
  });

  it('ignores unusable saved values', () => {
    const bad = [
      '{not json',
      '"x"',
      '{"key":"gone","op":"gt","value":1}',
      '{"key":"name","op":"gt","value":1}',
    ];
    for (const value of bad) {
      localStorage.setItem(KEY, value);
      expect(make().grid.getAdvancedFilter()).toBeNull();
    }
  });

  it('keeps grids with other keys apart and saves nothing without a key', () => {
    make({ advancedFilterStorageKey: 'a' }).grid.setAdvancedFilter(GT);
    expect(make({ advancedFilterStorageKey: 'b' }).grid.getAdvancedFilter()).toBeNull();
    localStorage.clear();
    make({ advancedFilterStorageKey: undefined }).grid.setAdvancedFilter(GT);
    expect(localStorage.length).toBe(0);
  });

  it('still works when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const { grid } = make();
    expect(() => grid.setAdvancedFilter(GT)).not.toThrow();
  });
});

describe('the Advanced filter button after a restore', () => {
  it('is tinted (data-active) when the saved filter is applied at start, and not when there is none', () => {
    make({ advancedFilter: true }).grid.setAdvancedFilter(GT);
    const restored = make({ advancedFilter: true });
    expect(restored.el.querySelector('.spg-advfilter')?.hasAttribute('data-active')).toBe(true);
    restored.grid.setAdvancedFilter(null);
    expect(restored.el.querySelector('.spg-advfilter')?.hasAttribute('data-active')).toBe(false);
    const fresh = make({ advancedFilter: true });
    expect(fresh.el.querySelector('.spg-advfilter')?.hasAttribute('data-active')).toBe(false);
  });
});
