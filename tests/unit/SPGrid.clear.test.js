import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPGrid } from '../../src/index.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const columns = [{ key: 'name', label: 'Name' }];
const rows = [{ name: 'Ada' }, { name: 'Grace' }, { name: 'Eve' }];

/** @param {object} [options] */
const make = (options = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new SPGrid(el, { columns, rows, searchable: true, ...options });
  return { el, grid };
};
/** @param {HTMLElement} el */
const input = (el) => /** @type {HTMLInputElement} */ (el.querySelector('input.spg-search'));
/** @param {HTMLElement} el */
const clear = (el) => /** @type {HTMLButtonElement} */ (el.querySelector('.spg-search-clear'));
/** @param {HTMLElement} el @param {string} value */
const type = (el, value) => {
  input(el).value = value;
  input(el).dispatchEvent(new Event('input', { bubbles: true }));
};
/** @param {HTMLElement} el */
const names = (el) =>
  [...el.querySelectorAll('tbody tr:not(.spg-empty) td')].map((td) => td.textContent);

afterEach(() => {
  document.body.innerHTML = '';
});

describe('clear search button', () => {
  it('is hidden until the input has text, then hidden again when it is emptied', () => {
    const { el } = make();
    expect(clear(el).hidden).toBe(true);
    type(el, 'a');
    expect(clear(el).hidden).toBe(false); // immediately, not after the debounce
    type(el, '');
    expect(clear(el).hidden).toBe(true);
  });

  it('follows setFilter', () => {
    const { el, grid } = make();
    grid.setFilter({ search: 'ada' });
    expect(clear(el).hidden).toBe(false);
    grid.setFilter(null);
    expect(clear(el).hidden).toBe(true);
  });

  it('clears the filter at once through the normal flow and refocuses the input', () => {
    const onFilterChange = vi.fn();
    const { el, grid } = make({ onFilterChange });
    type(el, 'ada');
    vi.advanceTimersByTime(200);
    expect(names(el)).toEqual(['Ada']);
    expect(onFilterChange).toHaveBeenCalledTimes(1);

    clear(el).focus();
    clear(el).click();
    expect(input(el).value).toBe('');
    expect(clear(el).hidden).toBe(true);
    expect(grid.getFilter()).toBeNull();
    expect(names(el)).toEqual(['Ada', 'Grace', 'Eve']); // no debounce wait
    expect(onFilterChange).toHaveBeenCalledTimes(2);
    expect(onFilterChange).toHaveBeenLastCalledWith(null);
    expect(document.activeElement).toBe(input(el));
  });

  it('drops a pending debounced search instead of re-applying it', () => {
    const { el, grid } = make();
    type(el, 'ada');
    clear(el).click(); // before the debounce fires
    vi.advanceTimersByTime(1000);
    expect(grid.getFilter()).toBeNull();
    expect(names(el)).toHaveLength(3);
  });

  it('is not rendered, and nothing breaks, when the grid is not searchable', () => {
    const { el } = make({ searchable: false });
    expect(el.querySelector('.spg-search-clear')).toBeNull();
  });

  it('stops working after destroy()', () => {
    const { el, grid } = make();
    const button = clear(el);
    grid.destroy();
    expect(() => button.click()).not.toThrow();
    expect(el.innerHTML).toBe('');
  });
});
