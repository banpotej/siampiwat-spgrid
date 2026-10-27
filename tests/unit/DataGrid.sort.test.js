import { describe, expect, it, vi } from 'vitest';
import { DataGrid } from '../../src/index.js';

describe('DataGrid sorting', () => {
  const sortCols = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'note', label: 'Note' },
  ];
  const rows = [
    { id: 2, name: 'b', note: 'x' },
    { id: 3, name: 'a', note: 'z' },
    { id: 1, name: 'c', note: 'y' },
  ];
  /** @param {object} [options] */
  const make = (options = {}) => {
    const el = document.createElement('div');
    const grid = new DataGrid(el, { columns: sortCols, rows, ...options });
    return { el, grid };
  };
  /** @param {HTMLElement} el @param {number} col */
  const th = (el, col) => /** @type {HTMLElement} */ (el.querySelectorAll('th')[col]);
  /** @param {HTMLElement} el @param {number} [col] */
  const column = (el, col = 0) =>
    [...el.querySelectorAll('tbody tr')].map((tr) => tr.querySelectorAll('td')[col].textContent);
  /** @param {HTMLElement} el */
  const click = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  /** @param {HTMLElement} el @param {string} key */
  const press = (el, key) =>
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));

  it('cycles asc -> desc -> none on header click and reorders rows', () => {
    const { el } = make();
    expect(column(el)).toEqual(['2', '3', '1']);
    click(th(el, 0));
    expect(column(el)).toEqual(['1', '2', '3']);
    click(th(el, 0));
    expect(column(el)).toEqual(['3', '2', '1']);
    click(th(el, 0));
    expect(column(el)).toEqual(['2', '3', '1']);
  });

  it('sorts only one column at a time', () => {
    const { el, grid } = make();
    click(th(el, 0));
    click(th(el, 1));
    expect(grid.getSort()).toEqual({ key: 'name', direction: 'asc' });
    expect(column(el, 1)).toEqual(['a', 'b', 'c']);
    expect(th(el, 0).hasAttribute('aria-sort')).toBe(false);
  });

  it('ignores clicks on non-sortable columns', () => {
    const { el, grid } = make();
    click(th(el, 2));
    expect(grid.getSort()).toBeNull();
    expect(column(el)).toEqual(['2', '3', '1']);
  });

  it('sorts on Enter and Space, ignores other keys', () => {
    const { el, grid } = make();
    press(th(el, 0), 'Enter');
    expect(grid.getSort()).toEqual({ key: 'id', direction: 'asc' });
    const space = press(th(el, 0), ' ');
    expect(space).toBe(false); // default prevented, so the page does not scroll
    expect(grid.getSort()).toEqual({ key: 'id', direction: 'desc' });
    press(th(el, 0), 'a');
    expect(grid.getSort()).toEqual({ key: 'id', direction: 'desc' });
    press(th(el, 2), 'Enter');
    expect(grid.getSort()).toEqual({ key: 'id', direction: 'desc' });
  });

  it('keeps focus on the sorted header after re-render', () => {
    const { el } = make();
    document.body.append(el);
    th(el, 1).focus();
    press(th(el, 1), 'Enter');
    expect(document.activeElement).toBe(th(el, 1));
    el.remove();
  });

  it('sets aria-sort on the active header only and tabindex on sortable ones', () => {
    const { el } = make();
    expect([...el.querySelectorAll('th')].map((t) => t.getAttribute('tabindex'))).toEqual([
      '0',
      '0',
      null,
    ]);
    expect(el.querySelector('[aria-sort]')).toBeNull();
    click(th(el, 1));
    expect(th(el, 1).getAttribute('aria-sort')).toBe('ascending');
    expect(el.querySelectorAll('[aria-sort]')).toHaveLength(1);
    click(th(el, 1));
    expect(th(el, 1).getAttribute('aria-sort')).toBe('descending');
    click(th(el, 1));
    expect(el.querySelector('[aria-sort]')).toBeNull();
  });

  it('honours the locale option', () => {
    const { el } = make({
      columns: [{ key: 's', sortable: true }],
      rows: [{ s: 'z' }, { s: 'รค' }, { s: 'a' }],
      locale: 'sv',
    });
    click(th(el, 0));
    expect(column(el)).toEqual(['a', 'z', 'รค']);
  });

  it('getSort/setSort read and write the sort state', () => {
    const { el, grid } = make();
    expect(grid.getSort()).toBeNull();
    grid.setSort({ key: 'name', direction: 'desc' });
    expect(grid.getSort()).toEqual({ key: 'name', direction: 'desc' });
    expect(column(el, 1)).toEqual(['c', 'b', 'a']);
    grid.setSort(null);
    expect(grid.getSort()).toBeNull();
    expect(column(el)).toEqual(['2', '3', '1']);
  });

  it('setSort rejects unknown columns and bad directions', () => {
    const { grid } = make();
    expect(() => grid.setSort({ key: 'nope', direction: 'asc' })).toThrow(RangeError);
    expect(() => grid.setSort(/** @type {any} */ ({ key: 'id', direction: 'up' }))).toThrow(
      TypeError,
    );
  });

  it('setRows keeps the active sort', () => {
    const { el, grid } = make();
    grid.setSort({ key: 'id', direction: 'asc' });
    grid.setRows([
      { id: 9, name: 'q', note: '' },
      { id: 4, name: 'r', note: '' },
    ]);
    expect(column(el)).toEqual(['4', '9']);
  });

  it('does not mutate the rows passed in', () => {
    const input = [...rows];
    const { grid } = make({ rows: input });
    grid.setSort({ key: 'id', direction: 'asc' });
    expect(input).toEqual(rows);
  });

  it('calls options.onSortChange with { key, direction } or null', () => {
    const onSortChange = vi.fn();
    const { el } = make({ onSortChange });
    click(th(el, 0));
    click(th(el, 0));
    click(th(el, 0));
    expect(onSortChange.mock.calls).toEqual([
      [{ key: 'id', direction: 'asc' }],
      [{ key: 'id', direction: 'desc' }],
      [null],
    ]);
  });

  it('emits sortChange to on() listeners; on() returns an unsubscribe', () => {
    const { el, grid } = make();
    const fn = vi.fn();
    const off = grid.on('sortChange', fn);
    expect(typeof off).toBe('function');
    click(th(el, 1));
    expect(fn).toHaveBeenCalledWith({ key: 'name', direction: 'asc' });
    off();
    click(th(el, 1));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('emits for setSort, but not when the sort is unchanged', () => {
    const { grid } = make();
    const fn = vi.fn();
    grid.on('sortChange', fn);
    grid.setSort({ key: 'id', direction: 'asc' });
    grid.setSort({ key: 'id', direction: 'asc' });
    grid.setRows([{ id: 1, name: 'a', note: '' }]);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('destroy removes the header listeners, clears the container and goes inert', () => {
    const onSortChange = vi.fn();
    const { el, grid } = make({ onSortChange });
    const thead = /** @type {HTMLElement} */ (el.querySelector('thead'));
    const remove = vi.spyOn(thead, 'removeEventListener');
    const header = th(el, 0);
    grid.destroy();
    expect(remove.mock.calls.map(([type]) => type).sort()).toEqual(['click', 'keydown']);
    expect(el.innerHTML).toBe('');
    click(header);
    press(header, 'Enter');
    grid.setRows([{ id: 1, name: 'a', note: '' }]);
    grid.setSort({ key: 'id', direction: 'asc' });
    expect(el.innerHTML).toBe('');
    expect(onSortChange).not.toHaveBeenCalled();
  });
});
