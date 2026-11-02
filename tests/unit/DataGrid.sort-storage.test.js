import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataGrid } from '../../src/index.js';

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'age', label: 'Age', sortable: true },
  { key: 'ops', actions: [{ name: 'open', label: 'Open' }] },
];
const rows = [
  { name: 'Bo', age: 30 },
  { name: 'Al', age: 40 },
  { name: 'Cy', age: 20 },
];
const KEY = 'datagrid:sort:po';
const AGE_ASC = { key: 'age', direction: 'asc' };

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

/** @param {object} [options] */
const make = (options = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new DataGrid(el, { columns, rows, sortStorageKey: 'po', ...options });
  return { el, grid };
};
/** @param {HTMLElement} el */
const names = (el) =>
  [...el.querySelectorAll('tbody tr td:first-child')].map((td) => td.textContent);
const saved = () => JSON.parse(/** @type {string} */ (localStorage.getItem(KEY)));

describe('defaultSort', () => {
  it('sorts at start and is reported by getSort', () => {
    const { el, grid } = make({ defaultSort: { key: 'age', direction: 'desc' } });
    expect(names(el)).toEqual(['Al', 'Bo', 'Cy']);
    expect(grid.getSort()).toEqual({ key: 'age', direction: 'desc' });
  });

  it('throws on an unknown or action column and on a bad direction', () => {
    expect(() => make({ defaultSort: { key: 'nope', direction: 'asc' } })).toThrow(RangeError);
    expect(() => make({ defaultSort: { key: 'ops', direction: 'asc' } })).toThrow(RangeError);
    expect(() => make({ defaultSort: { key: 'age', direction: 'up' } })).toThrow(TypeError);
  });

  it('is where resetView goes back to, and sortChange fires only when it differs', () => {
    const { grid } = make({ defaultSort: AGE_ASC });
    const spy = vi.fn();
    grid.on('sortChange', spy);
    grid.resetView();
    expect(spy).not.toHaveBeenCalled();
    grid.setSort({ key: 'name', direction: 'desc' });
    grid.resetView();
    expect(grid.getSort()).toEqual(AGE_ASC);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe('sortStorageKey (localStorage)', () => {
  it('saves every change under datagrid:sort:<key>', () => {
    const { grid } = make();
    expect(localStorage.getItem(KEY)).toBeNull();
    grid.setSort({ key: 'name', direction: 'asc' });
    expect(saved()).toEqual({ key: 'name', direction: 'asc' });
    grid.setSort(null);
    expect(saved()).toBeNull();
  });

  it('restores the saved sort on the next grid, ahead of defaultSort', () => {
    make().grid.setSort({ key: 'name', direction: 'desc' });
    const { el } = make({ defaultSort: AGE_ASC });
    expect(names(el)).toEqual(['Cy', 'Bo', 'Al']);
  });

  it('remembers that the sort was cleared', () => {
    make({ defaultSort: AGE_ASC }).grid.setSort(null);
    expect(make({ defaultSort: AGE_ASC }).grid.getSort()).toBeNull();
  });

  it('writes the default back on resetView', () => {
    const { grid } = make({ defaultSort: AGE_ASC });
    grid.setSort({ key: 'name', direction: 'asc' });
    grid.resetView();
    expect(saved()).toEqual(AGE_ASC);
  });

  it('ignores unusable saved values and uses defaultSort', () => {
    const bad = [
      '{not json',
      '{"key":"gone","direction":"asc"}',
      '{"key":"age","direction":"x"}',
      '"x"',
    ];
    for (const value of bad) {
      localStorage.setItem(KEY, value);
      expect(make({ defaultSort: AGE_ASC }).grid.getSort()).toEqual(AGE_ASC);
    }
  });

  it('keeps grids with other keys apart and saves nothing without a key', () => {
    make({ sortStorageKey: 'a' }).grid.setSort({ key: 'name', direction: 'asc' });
    expect(make({ sortStorageKey: 'b' }).grid.getSort()).toBeNull();
    localStorage.clear();
    make({ sortStorageKey: undefined }).grid.setSort({ key: 'name', direction: 'asc' });
    expect(localStorage.length).toBe(0);
  });

  it('still works when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const { grid } = make({ defaultSort: AGE_ASC });
    expect(grid.getSort()).toEqual(AGE_ASC);
    expect(() => grid.setSort({ key: 'name', direction: 'asc' })).not.toThrow();
  });
});
