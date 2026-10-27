import { afterEach, describe, expect, it, vi } from 'vitest';
import { btn, ids, make, nav, rows } from './helpers/pagination.js';

afterEach(() => vi.useRealTimers());

describe('API', () => {
  it('getPage / setPage clamp into range', () => {
    const { grid } = make();
    expect(grid.getPage()).toBe(1);
    grid.setPage(2);
    expect(grid.getPage()).toBe(2);
    grid.setPage(99);
    expect(grid.getPage()).toBe(3);
    grid.setPage(-5);
    expect(grid.getPage()).toBe(1);
    grid.setPage(NaN);
    expect(grid.getPage()).toBe(1);
  });

  it('getPageSize / setPageSize', () => {
    const { el, grid } = make();
    expect(grid.getPageSize()).toBe(10);
    grid.setPage(2);
    grid.setPageSize(5);
    expect(grid.getPageSize()).toBe(5);
    expect(grid.getPage()).toBe(1);
    expect(ids(el)).toHaveLength(5);
  });

  it('setPageSize rejects invalid sizes with RangeError', () => {
    const { grid } = make();
    for (const n of [0, -1, 1.5, NaN, Infinity, '10', null]) {
      expect(() => grid.setPageSize(/** @type {any} */ (n))).toThrow(RangeError);
    }
    expect(grid.getPageSize()).toBe(10);
  });

  it('setPageSize turns pagination on for a grid that had it off', () => {
    const { el, grid } = make({ pageSize: undefined });
    grid.setPageSize(10);
    expect(ids(el)).toHaveLength(10);
    expect(nav(el)).not.toBeNull();
  });

  it('setPage is a no-op while pagination is off', () => {
    const { el, grid } = make({ pageSize: undefined });
    grid.setPage(2);
    expect(grid.getPage()).toBe(1);
    expect(ids(el)).toHaveLength(25);
  });
});

describe('pageChange events', () => {
  it('fires once per change with { page, pageSize } via options and on()', () => {
    const onPageChange = vi.fn();
    const { el, grid } = make({ onPageChange });
    const fn = vi.fn();
    grid.on('pageChange', fn);
    btn(el, '[data-action="next"]').click();
    expect(onPageChange.mock.calls).toEqual([[{ page: 2, pageSize: 10 }]]);
    expect(fn.mock.calls).toEqual([[{ page: 2, pageSize: 10 }]]);
  });

  it('also fires when pageSize changes', () => {
    const { grid } = make();
    const fn = vi.fn();
    grid.on('pageChange', fn);
    grid.setPageSize(20);
    expect(fn.mock.calls).toEqual([[{ page: 1, pageSize: 20 }]]);
    grid.setPage(2);
    grid.setPageSize(5);
    expect(fn).toHaveBeenLastCalledWith({ page: 1, pageSize: 5 });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not fire when nothing changed', () => {
    const { grid } = make();
    const fn = vi.fn();
    grid.on('pageChange', fn);
    grid.setPage(1);
    grid.setPageSize(10);
    grid.setPage(99);
    grid.setPage(99);
    grid.setRows([...rows]); // still 3 pages
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('fires when a filter/sort reset or setRows clamp moves the page', () => {
    const { grid } = make();
    const fn = vi.fn();
    grid.setPage(3);
    grid.on('pageChange', fn);
    grid.setSort({ key: 'id', direction: 'asc' });
    expect(fn).toHaveBeenLastCalledWith({ page: 1, pageSize: 10 });
    grid.setPage(2);
    grid.setRows(rows.slice(0, 5));
    expect(fn).toHaveBeenLastCalledWith({ page: 1, pageSize: 10 });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('stays silent on a grid without pagination', () => {
    const { grid } = make({ pageSize: undefined });
    const fn = vi.fn();
    grid.on('pageChange', fn);
    grid.setFilter({ search: 'user 1' });
    grid.setRows([]);
    expect(fn).not.toHaveBeenCalled();
  });

  it('on() returns an unsubscribe function', () => {
    const { grid } = make();
    const fn = vi.fn();
    const off = grid.on('pageChange', fn);
    grid.setPage(2);
    off();
    grid.setPage(3);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('delegation, focus and destroy', () => {
  it('uses ONE click listener on the pager container, however often it re-renders', () => {
    const spy = vi.spyOn(EventTarget.prototype, 'addEventListener');
    const { el, grid } = make({ pageSize: 1 });
    /** @param {string} type */
    const onPager = (type) =>
      spy.mock.calls.filter(
        ([t], i) =>
          t === type &&
          /** @type {any} */ (spy.mock.contexts[i]).classList?.contains('dg-pager-host'),
      ).length;
    expect(onPager('click')).toBe(1);
    for (let i = 0; i < 5; i++) btn(el, '[data-action="next"]').click();
    grid.setPage(1);
    expect(onPager('click')).toBe(1);
    spy.mockRestore();
  });

  it('keeps the pager container itself across renders', () => {
    const { el, grid } = make();
    const host = nav(el).parentElement;
    grid.setPage(2);
    grid.setSort({ key: 'id', direction: 'desc' });
    expect(nav(el).parentElement).toBe(host);
  });

  it('keeps focus on the clicked page button after re-render', () => {
    const { el } = make();
    document.body.append(el);
    btn(el, '[data-page="2"]').focus();
    btn(el, '[data-page="2"]').click();
    expect(document.activeElement).toBe(btn(el, '[data-page="2"]'));
    expect(document.activeElement?.getAttribute('aria-current')).toBe('page');
    el.remove();
  });

  it('keeps focus on Next while it is enabled', () => {
    const { el } = make();
    document.body.append(el);
    btn(el, '[data-action="next"]').focus();
    btn(el, '[data-action="next"]').click();
    expect(document.activeElement).toBe(btn(el, '[data-action="next"]'));
    el.remove();
  });

  it('moves focus to the nav when Next or Prev becomes disabled', () => {
    const { el, grid } = make();
    document.body.append(el);
    grid.setPage(2);
    btn(el, '[data-action="next"]').focus();
    btn(el, '[data-action="next"]').click(); // now the last page
    expect(btn(el, '[data-action="next"]').disabled).toBe(true);
    expect(document.activeElement).toBe(nav(el));
    btn(el, '[data-page="2"]').click();
    btn(el, '[data-action="prev"]').focus();
    btn(el, '[data-action="prev"]').click(); // back to page 1
    expect(document.activeElement).toBe(nav(el));
    el.remove();
  });

  it('keeps focus on the page size select after changing it', () => {
    const { el } = make({ pageSizeOptions: [10, 20] });
    document.body.append(el);
    const select = /** @type {HTMLSelectElement} */ (el.querySelector('select'));
    select.focus();
    select.value = '20';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.activeElement).toBe(el.querySelector('select'));
    el.remove();
  });

  it('destroy removes the pager listeners, clears the container and goes inert', () => {
    const onPageChange = vi.fn();
    const { el, grid } = make({ onPageChange, pageSizeOptions: [10, 20] });
    const host = /** @type {HTMLElement} */ (nav(el).parentElement);
    const remove = vi.spyOn(host, 'removeEventListener');
    const next = btn(el, '[data-action="next"]');
    grid.destroy();
    expect(remove.mock.calls.map(([t]) => t).sort()).toEqual(['change', 'click']);
    expect(el.innerHTML).toBe('');
    next.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    grid.setPage(2);
    grid.setPageSize(20);
    grid.setRows([]);
    expect(el.innerHTML).toBe('');
    expect(onPageChange).not.toHaveBeenCalled();
  });
});
