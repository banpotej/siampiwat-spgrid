import { afterEach, describe, expect, it, vi } from 'vitest';
import { btn, ids, make, nav, navText, rows, summary, th } from './helpers/pagination.js';

afterEach(() => vi.useRealTimers());

describe('enabling pagination', () => {
  it('is disabled by default: all rows, no pager', () => {
    const { el, grid } = make({ pageSize: undefined });
    expect(ids(el)).toHaveLength(25);
    expect(el.querySelector('nav')).toBeNull();
    expect(el.querySelector('.spg-summary')).toBeNull();
    expect(grid.getPageSize()).toBeNull();
  });

  it('options.pageSize shows one page and a pager', () => {
    const { el } = make();
    expect(ids(el)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
    expect(nav(el).tagName).toBe('NAV');
  });

  it('throws RangeError for an invalid options.pageSize or pageSizeOptions', () => {
    for (const pageSize of [0, -1, 1.5, NaN]) {
      expect(() => make({ pageSize })).toThrow(RangeError);
    }
    expect(() => make({ pageSizeOptions: [10, 0] })).toThrow(RangeError);
  });
});

describe('pager markup', () => {
  it('is a labelled <nav> with First, Prev, page buttons, Next and Last', () => {
    const { el } = make();
    expect(nav(el).getAttribute('aria-label')).toBe('Pagination');
    expect(navText(el)).toEqual(['First page', 'Previous', '1', '2', '3', 'Next', 'Last page']);
    expect(nav(el).querySelectorAll('button')).toHaveLength(7);
  });

  it('uses and escapes labels.pagination / prev / next', () => {
    const { el } = make({ labels: { pagination: 'หน้า "x"', prev: '<b>ก่อน</b>', next: 'ถัดไป' } });
    expect(nav(el).getAttribute('aria-label')).toBe('หน้า "x"');
    expect(navText(el)).toEqual(['First page', '<b>ก่อน</b>', '1', '2', '3', 'ถัดไป', 'Last page']);
    expect(el.querySelector('b')).toBeNull();
  });

  it('marks only the current page with aria-current="page"', () => {
    const { el, grid } = make();
    expect(el.querySelectorAll('[aria-current]')).toHaveLength(1);
    expect(btn(el, '[aria-current="page"]').textContent).toBe('1');
    grid.setPage(2);
    expect(el.querySelectorAll('[aria-current]')).toHaveLength(1);
    expect(btn(el, '[aria-current="page"]').textContent).toBe('2');
  });

  it('disables Prev on the first page and Next on the last', () => {
    const { el, grid } = make();
    expect(btn(el, '[data-action="prev"]').disabled).toBe(true);
    expect(btn(el, '[data-action="next"]').disabled).toBe(false);
    grid.setPage(2);
    expect(btn(el, '[data-action="prev"]').disabled).toBe(false);
    expect(btn(el, '[data-action="next"]').disabled).toBe(false);
    grid.setPage(3);
    expect(btn(el, '[data-action="next"]').disabled).toBe(true);
  });

  it('builds the buttons from getPageWindow (ellipsis for long ranges)', () => {
    const { el, grid } = make({ pageSize: 1 });
    expect(navText(el)).toEqual([
      'First page',
      'Previous',
      '1',
      '2',
      '3',
      '4',
      '5',
      '…',
      '25',
      'Next',
      'Last page',
    ]);
    grid.setPage(13);
    expect(navText(el)).toEqual([
      'First page',
      'Previous',
      '1',
      '…',
      '12',
      '13',
      '14',
      '…',
      '25',
      'Next',
      'Last page',
    ]);
  });

  it('clicking Prev/Next/page buttons changes the page', () => {
    const { el, grid } = make();
    btn(el, '[data-action="next"]').click();
    expect(ids(el)[0]).toBe('11');
    btn(el, '[data-page="3"]').click();
    expect(grid.getPage()).toBe(3);
    expect(ids(el)).toEqual(['21', '22', '23', '24', '25']);
    btn(el, '[data-action="prev"]').click();
    expect(grid.getPage()).toBe(2);
  });

  it('ignores clicks on disabled buttons', () => {
    const { el, grid } = make();
    const prev = btn(el, '[data-action="prev"]');
    prev.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(grid.getPage()).toBe(1);
  });
});

describe('summary', () => {
  it('shows "Showing X–Y of Z"', () => {
    const { el, grid } = make();
    expect(summary(el)).toBe('Showing 1–10 of 25');
    grid.setPage(3);
    expect(summary(el)).toBe('Showing 21–25 of 25');
  });

  it('counts the filtered rows, and shows "0 of 0" when empty', () => {
    const { el, grid } = make();
    grid.setFilter({ search: 'user 2' }); // ids 2, 12, 20-25
    expect(summary(el)).toBe('Showing 1–8 of 8');
    grid.setFilter({ search: 'zzz' });
    expect(summary(el)).toBe('Showing 0 of 0');
  });

  it('uses labels.summary(from, to, total), escaped', () => {
    const summaryLabel = vi.fn((from, to, total) => `<i>${from}-${to}/${total}</i>`);
    const { el, grid } = make({ labels: { summary: summaryLabel } });
    expect(summary(el)).toBe('<i>1-10/25</i>');
    expect(el.querySelector('.spg-summary i')).toBeNull();
    grid.setFilter({ search: 'zzz' });
    expect(summaryLabel).toHaveBeenLastCalledWith(0, 0, 0);
  });
});

describe('page state', () => {
  it('setSort, setFilter and header clicks reset to page 1', () => {
    const { el, grid } = make();
    grid.setPage(3);
    grid.setSort({ key: 'id', direction: 'desc' });
    expect(grid.getPage()).toBe(1);
    grid.setPage(2);
    grid.setFilter({ search: 'user' });
    expect(grid.getPage()).toBe(1);
    grid.setPage(2);
    th(el, 1).click();
    expect(grid.getPage()).toBe(1);
  });

  it('typing in the search box resets to page 1', () => {
    vi.useFakeTimers();
    const { el, grid } = make({ searchable: true });
    grid.setPage(3);
    const input = /** @type {HTMLInputElement} */ (el.querySelector('input[type="search"]'));
    input.value = 'user 1';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    vi.advanceTimersByTime(200);
    expect(grid.getPage()).toBe(1);
    expect(summary(el)).toBe('Showing 1–10 of 12');
  });

  it('setRows keeps the page but clamps it into range', () => {
    const { el, grid } = make();
    grid.setPage(3);
    grid.setRows(rows.slice(0, 12));
    expect(grid.getPage()).toBe(2);
    expect(ids(el)).toEqual(['11', '12']);
    grid.setRows(rows); // the clamped page sticks; it does not spring back to 3
    expect(grid.getPage()).toBe(2);
    grid.setRows([...rows].reverse());
    expect(grid.getPage()).toBe(2);
  });

  it('setRows to an empty list shows page 1 of 1', () => {
    const { el, grid } = make();
    grid.setPage(3);
    grid.setRows([]);
    expect(grid.getPage()).toBe(1);
    expect(navText(el)).toEqual(['First page', 'Previous', '1', 'Next', 'Last page']);
  });
});

describe('page size select', () => {
  it('is not rendered without pageSizeOptions', () => {
    expect(make().el.querySelector('select')).toBeNull();
  });

  it('renders a select with the options and the current size selected', () => {
    const { el } = make({ pageSizeOptions: [10, 20, 50] });
    const select = /** @type {HTMLSelectElement} */ (el.querySelector('select'));
    expect([...select.options].map((o) => o.value)).toEqual(['10', '20', '50']);
    expect(select.value).toBe('10');
    expect(el.querySelector('label')?.textContent).toContain('Rows per page');
  });

  it('adds the current pageSize when it is not among the options', () => {
    const { el } = make({ pageSize: 5, pageSizeOptions: [20, 10] });
    const select = /** @type {HTMLSelectElement} */ (el.querySelector('select'));
    expect([...select.options].map((o) => o.value)).toEqual(['5', '10', '20']);
    expect(select.value).toBe('5');
  });

  it('uses labels.pageSize', () => {
    const { el } = make({ pageSizeOptions: [10], labels: { pageSize: 'แถวต่อหน้า' } });
    expect(el.querySelector('label')?.textContent).toContain('แถวต่อหน้า');
  });

  it('changing it re-pages and resets to page 1', () => {
    const { el, grid } = make({ pageSizeOptions: [10, 20, 50] });
    grid.setPage(3);
    const select = /** @type {HTMLSelectElement} */ (el.querySelector('select'));
    select.value = '20';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(grid.getPageSize()).toBe(20);
    expect(grid.getPage()).toBe(1);
    expect(ids(el)).toHaveLength(20);
    expect(navText(el)).toEqual(['First page', 'Previous', '1', '2', 'Next', 'Last page']);
    expect(/** @type {HTMLSelectElement} */ (el.querySelector('select')).value).toBe('20');
  });
});
