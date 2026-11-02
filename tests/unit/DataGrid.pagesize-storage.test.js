import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataGrid } from '../../src/index.js';

const rows = Array.from({ length: 30 }, (_, i) => ({ n: i + 1 }));
const KEY = 'datagrid:pageSize:po';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

/** @param {object} [options] */
const make = (options = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new DataGrid(el, {
    columns: [{ key: 'n' }],
    rows,
    pageSize: 10,
    pageSizeOptions: [10, 20],
    pageSizeStorageKey: 'po',
    ...options,
  });
  return { el, grid };
};
/** @param {HTMLElement} el */
const shown = (el) => el.querySelectorAll('tbody tr').length;
/** @param {HTMLElement} el @param {string} value */
const choose = (el, value) => {
  const select = /** @type {HTMLSelectElement} */ (el.querySelector('.dg-page-size select'));
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
};

describe('pageSizeStorageKey (localStorage)', () => {
  it('saves the size when the user picks one, under datagrid:pageSize:<key>', () => {
    const { el } = make();
    expect(localStorage.getItem(KEY)).toBeNull();
    choose(el, '20');
    expect(localStorage.getItem(KEY)).toBe('20');
  });

  it('saves a size set through setPageSize', () => {
    make().grid.setPageSize(15);
    expect(localStorage.getItem(KEY)).toBe('15');
  });

  it('restores the saved size on the next grid, ahead of pageSize', () => {
    choose(make().el, '20');
    const { el, grid } = make();
    expect(grid.getPageSize()).toBe(20);
    expect(shown(el)).toBe(20);
  });

  it('keeps a saved size that is not in pageSizeOptions', () => {
    localStorage.setItem(KEY, '15');
    const { el, grid } = make();
    expect(grid.getPageSize()).toBe(15);
    expect(shown(el)).toBe(15);
  });

  it('uses pageSize when nothing usable is saved', () => {
    for (const bad of ['0', '-5', '2.5', '"20"', 'null', '{oops']) {
      localStorage.setItem(KEY, bad);
      expect(make().grid.getPageSize()).toBe(10);
    }
    localStorage.clear();
    expect(make().grid.getPageSize()).toBe(10);
  });

  it('keeps grids with other keys apart and saves nothing without a key', () => {
    choose(make({ pageSizeStorageKey: 'a' }).el, '20');
    expect(make({ pageSizeStorageKey: 'b' }).grid.getPageSize()).toBe(10);
    localStorage.clear();
    choose(make({ pageSizeStorageKey: undefined }).el, '20');
    expect(localStorage.length).toBe(0);
  });

  it('still works when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    const { el, grid } = make();
    expect(grid.getPageSize()).toBe(10);
    expect(() => choose(el, '20')).not.toThrow();
    expect(grid.getPageSize()).toBe(20);
  });
});
