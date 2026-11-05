import { describe, expect, it, vi } from 'vitest';
import { SPGrid } from '../../src/index.js';

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'score', label: 'Score', sortable: true },
];
const roles = ['Engineer', 'Admiral', 'Tester'];
// ids 1..20; role cycles Engineer/Admiral/Tester; score = id * 10; `secret` is not a column
const rows = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  name: `Person ${i + 1}`,
  role: roles[i % 3],
  score: (i + 1) * 10,
  secret: 'engineer',
}));

/** @param {object} [options] */
const make = (options = {}) => {
  const el = document.createElement('div');
  const grid = new SPGrid(el, { columns, rows, pageSize: 3, ...options });
  return { el, grid };
};
/** @param {HTMLElement} el */
const ids = (el) =>
  [...el.querySelectorAll('tbody tr:not(.spg-empty) td:first-child')].map((td) =>
    Number(td.textContent),
  );
/** @param {HTMLElement} el */
const summary = (el) => el.querySelector('.spg-summary')?.textContent;
/** @param {HTMLElement} el */
const pages = (el) => [...el.querySelectorAll('nav button[data-page]')].map((b) => b.textContent);

describe('filter -> sort -> paginate', () => {
  it('filters first, sorts the result, then slices the page', () => {
    const { el, grid } = make();
    grid.setFilter({ search: 'engineer' }); // ids 1,4,7,10,13,16,19 (not the hidden `secret`)
    expect(summary(el)).toBe('Showing 1–3 of 7');
    grid.setSort({ key: 'score', direction: 'desc' }); // 19,16,13,10,7,4,1
    expect(ids(el)).toEqual([19, 16, 13]);
    grid.setPage(2);
    expect(ids(el)).toEqual([10, 7, 4]);
    expect(summary(el)).toBe('Showing 4–6 of 7');
    grid.setPage(3);
    expect(ids(el)).toEqual([1]);
    expect(summary(el)).toBe('Showing 7–7 of 7');
    expect(pages(el)).toEqual(['1', '2', '3']);
  });

  it('sorting is applied before paging, not within the page', () => {
    const { el, grid } = make();
    grid.setSort({ key: 'id', direction: 'desc' });
    expect(ids(el)).toEqual([20, 19, 18]);
    grid.setPage(7);
    expect(ids(el)).toEqual([2, 1]);
  });

  it('changing the filter or sort goes back to page 1', () => {
    const { el, grid } = make();
    grid.setPage(3);
    grid.setFilter({ search: 'tester' }); // ids 3,6,9,12,15,18
    expect(grid.getPage()).toBe(1);
    expect(ids(el)).toEqual([3, 6, 9]);
    grid.setPage(2);
    grid.setSort({ key: 'id', direction: 'desc' });
    expect(grid.getPage()).toBe(1);
    expect(ids(el)).toEqual([18, 15, 12]);
    grid.setFilter(null);
    expect(grid.getPage()).toBe(1);
    expect(ids(el)).toEqual([20, 19, 18]);
  });

  it('combines search, column filter, sort and page size change', () => {
    const { el, grid } = make({ pageSizeOptions: [3, 5] });
    grid.setFilter({ search: 'person', columnFilters: { role: 'er' } }); // Engineer, Tester
    grid.setSort({ key: 'name', direction: 'asc' });
    expect(summary(el)).toBe('Showing 1–3 of 13');
    const select = /** @type {HTMLSelectElement} */ (el.querySelector('select'));
    select.value = '5';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(ids(el)).toHaveLength(5);
    expect(summary(el)).toBe('Showing 1–5 of 13');
    expect(grid.getFilter()).toEqual({ search: 'person', columnFilters: { role: 'er' } });
    expect(grid.getSort()).toEqual({ key: 'name', direction: 'asc' });
  });

  it('setRows keeps filter, sort and page, clamping the page', () => {
    const { el, grid } = make();
    grid.setFilter({ search: 'tester' });
    grid.setSort({ key: 'id', direction: 'desc' });
    grid.setPage(2);
    grid.setRows(rows.slice(0, 10)); // testers: 3,6,9 -> one page
    expect(grid.getPage()).toBe(1);
    expect(ids(el)).toEqual([9, 6, 3]);
    expect(grid.getFilter()).toEqual({ search: 'tester' });
    expect(grid.getSort()).toEqual({ key: 'id', direction: 'desc' });
  });

  it('keeps one event per user-visible change across all three features', () => {
    const { grid } = make();
    const events = vi.fn();
    grid.on('filterChange', () => events('filter'));
    grid.on('sortChange', () => events('sort'));
    grid.on('pageChange', () => events('page'));
    grid.setPage(2);
    grid.setFilter({ search: 'engineer' }); // filter + page reset
    grid.setSort({ key: 'id', direction: 'desc' }); // sort only (already page 1)
    expect(events.mock.calls.map(([e]) => e)).toEqual(['page', 'filter', 'page', 'sort']);
  });
});

describe('empty state with a pager', () => {
  it('shows one "No data" row plus a 0 of 0 pager', () => {
    const { el, grid } = make();
    grid.setFilter({ search: 'zzz' });
    const trs = el.querySelectorAll('tbody tr');
    expect(trs).toHaveLength(1);
    expect(trs[0].classList.contains('spg-empty')).toBe(true);
    expect(trs[0].querySelector('td')?.colSpan).toBe(columns.length);
    expect(el.querySelector('[role="status"]')?.textContent).toBe('No data');
    expect(summary(el)).toBe('Showing 0 of 0');
    expect(pages(el)).toEqual(['1']);
    expect(el.querySelector('nav [aria-current="page"]')?.textContent).toBe('1');
    expect(
      /** @type {HTMLButtonElement} */ (el.querySelector('[data-action="prev"]')).disabled,
    ).toBe(true);
    expect(
      /** @type {HTMLButtonElement} */ (el.querySelector('[data-action="next"]')).disabled,
    ).toBe(true);
  });

  it('recovers when the filter is cleared', () => {
    const { el, grid } = make();
    grid.setFilter({ search: 'zzz' });
    grid.setFilter(null);
    expect(ids(el)).toEqual([1, 2, 3]);
    expect(summary(el)).toBe('Showing 1–3 of 20');
    expect(el.querySelector('[role="status"]')?.textContent).toBe('');
  });

  it('a grid with no rows at all is empty with a pager', () => {
    const { el } = make({ rows: [] });
    expect(el.querySelector('tbody td')?.textContent).toBe('No data');
    expect(summary(el)).toBe('Showing 0 of 0');
  });
});
