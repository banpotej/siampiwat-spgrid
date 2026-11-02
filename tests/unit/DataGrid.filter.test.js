import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataGrid } from '../../src/index.js';

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'role', label: 'Role' },
];
const rows = [
  { id: 1, name: 'Ada', role: 'Engineer', secret: 'zebra' },
  { id: 2, name: 'Grace', role: 'Admiral', secret: 'zebra' },
  { id: 3, name: 'Eve', role: 'Tester', secret: 'zebra' },
];

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

/** @param {object} [options] */
const make = (options = {}) => {
  const el = document.createElement('div');
  const grid = new DataGrid(el, { columns, rows, searchable: true, ...options });
  return { el, grid };
};
/** @param {HTMLElement} el */
const input = (el) => /** @type {HTMLInputElement} */ (el.querySelector('input[type="search"]'));
/** @param {HTMLElement} el @param {string} value */
const type = (el, value) => {
  input(el).value = value;
  input(el).dispatchEvent(new Event('input', { bubbles: true }));
};
/** @param {HTMLElement} el */
const names = (el) =>
  [...el.querySelectorAll('tbody tr:not(.dg-empty)')].map(
    (tr) => tr.querySelectorAll('td')[1].textContent,
  );
/** @param {HTMLElement} el @param {number} col */
const th = (el, col) => /** @type {HTMLElement} */ (el.querySelectorAll('th')[col]);

describe('search box', () => {
  it('renders an accessible <input type="search"> above the table when searchable', () => {
    const { el } = make();
    expect(input(el).getAttribute('aria-label')).toBe('Search');
    const table = /** @type {Node} */ (el.querySelector('table'));
    expect(
      input(el).compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('uses options.labels.search and escapes it', () => {
    const { el } = make({ labels: { search: 'ค้นหา "x" <b>' } });
    expect(input(el).getAttribute('aria-label')).toBe('ค้นหา "x" <b>');
    expect(el.querySelector('b')).toBeNull();
  });

  it('is not rendered unless searchable', () => {
    const { el } = make({ searchable: false });
    expect(input(el)).toBeNull();
  });

  it('filters after the debounce (default 200ms); empty input restores all rows', () => {
    const { el } = make();
    type(el, 'ada');
    vi.advanceTimersByTime(199);
    expect(names(el)).toEqual(['Ada', 'Grace', 'Eve']);
    vi.advanceTimersByTime(1);
    expect(names(el)).toEqual(['Ada']);
    type(el, '');
    vi.advanceTimersByTime(200);
    expect(names(el)).toEqual(['Ada', 'Grace', 'Eve']);
  });

  it('honours options.searchDebounce and restarts the timer on each keystroke', () => {
    const { el } = make({ searchDebounce: 50 });
    type(el, 'a');
    vi.advanceTimersByTime(40);
    type(el, 'ada');
    vi.advanceTimersByTime(40);
    expect(names(el)).toHaveLength(3);
    vi.advanceTimersByTime(10);
    expect(names(el)).toEqual(['Ada']);
  });

  it('keeps the same input element, focus and caret while filtering', () => {
    const { el } = make();
    document.body.append(el);
    const box = input(el);
    box.focus();
    type(el, 'ada');
    box.setSelectionRange(1, 1);
    vi.advanceTimersByTime(200);
    expect(input(el)).toBe(box);
    expect(document.activeElement).toBe(box);
    expect(box.value).toBe('ada');
    expect(box.selectionStart).toBe(1);
    el.remove();
  });

  it('keeps what the user typed even if it is only whitespace', () => {
    const { el, grid } = make();
    type(el, '  ');
    vi.advanceTimersByTime(200);
    expect(input(el).value).toBe('  ');
    expect(grid.getFilter()).toBeNull();
  });
});

describe('filtering rules', () => {
  it('only searches keys of options.columns, not hidden row fields', () => {
    const { el } = make();
    type(el, 'zebra');
    vi.advanceTimersByTime(200);
    expect(names(el)).toEqual([]);
  });

  it('filters first, then sorts; setRows keeps both', () => {
    const { el, grid } = make();
    grid.setSort({ key: 'name', direction: 'desc' });
    grid.setFilter({ search: 'e' }); // Grace, Ada(Engineer), Eve
    expect(names(el)).toEqual(['Grace', 'Eve', 'Ada']);
    grid.setFilter({ search: 'er' }); // Ada, Eve
    expect(names(el)).toEqual(['Eve', 'Ada']);
    grid.setRows([
      { id: 7, name: 'Zed', role: 'Server' },
      { id: 8, name: 'Bob', role: 'Nope' },
      { id: 9, name: 'Cy', role: 'Tester' },
    ]);
    expect(names(el)).toEqual(['Zed', 'Cy']);
    expect(grid.getSort()).toEqual({ key: 'name', direction: 'desc' });
    expect(grid.getFilter()).toEqual({ search: 'er' });
  });

  it('a header click sorts only the filtered rows', () => {
    const { el } = make();
    type(el, 'er');
    vi.advanceTimersByTime(200);
    th(el, 1).click();
    th(el, 1).click();
    expect(names(el)).toEqual(['Eve', 'Ada']);
  });

  it('does not mutate the rows passed in', () => {
    const input = [...rows];
    const { grid } = make({ rows: input });
    grid.setFilter({ search: 'ada' });
    expect(input).toEqual(rows);
  });
});

describe('getFilter / setFilter', () => {
  it('starts as null', () => {
    expect(make().grid.getFilter()).toBeNull();
  });

  it('setFilter updates the rows and the input value; null clears both', () => {
    const { el, grid } = make();
    grid.setFilter({ search: 'ada' });
    expect(input(el).value).toBe('ada');
    expect(names(el)).toEqual(['Ada']);
    grid.setFilter(null);
    expect(input(el).value).toBe('');
    expect(names(el)).toEqual(['Ada', 'Grace', 'Eve']);
    expect(grid.getFilter()).toBeNull();
  });

  it('supports columnFilters and returns a copy', () => {
    const { el, grid } = make();
    grid.setFilter({ columnFilters: { role: 'eng' } });
    expect(names(el)).toEqual(['Ada']);
    const got = /** @type {any} */ (grid.getFilter());
    expect(got).toEqual({ columnFilters: { role: 'eng' } });
    got.columnFilters.role = 'x';
    expect(grid.getFilter()).toEqual({ columnFilters: { role: 'eng' } });
  });

  it('combines search and columnFilters with AND', () => {
    const { el, grid } = make();
    grid.setFilter({ search: 'e', columnFilters: { role: 'test' } });
    expect(names(el)).toEqual(['Eve']);
  });

  it('rejects unknown columnFilters keys', () => {
    const { grid } = make();
    expect(() => grid.setFilter({ columnFilters: { nope: 'x' } })).toThrow(RangeError);
  });

  it('works without a search box', () => {
    const { el, grid } = make({ searchable: false });
    grid.setFilter({ search: 'ada' });
    expect(names(el)).toEqual(['Ada']);
  });
});

describe('filterChange events', () => {
  it('fires once per change (not per keystroke) via options and on()', () => {
    const onFilterChange = vi.fn();
    const { el, grid } = make({ onFilterChange });
    const fn = vi.fn();
    grid.on('filterChange', fn);
    for (const v of ['a', 'ad', 'ada']) type(el, v);
    vi.advanceTimersByTime(200);
    expect(onFilterChange.mock.calls).toEqual([[{ search: 'ada' }]]);
    expect(fn.mock.calls).toEqual([[{ search: 'ada' }]]);
    type(el, '');
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenLastCalledWith(null);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('on() returns an unsubscribe function', () => {
    const { grid } = make();
    const fn = vi.fn();
    const off = grid.on('filterChange', fn);
    grid.setFilter({ search: 'a' });
    off();
    grid.setFilter({ search: 'b' });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not fire when the filter is unchanged or only setRows/sort changes', () => {
    const { grid } = make();
    const fn = vi.fn();
    grid.on('filterChange', fn);
    grid.setFilter({ search: 'a' });
    grid.setFilter({ search: 'a' });
    grid.setRows([]);
    grid.setSort({ key: 'id', direction: 'asc' });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not disturb sortChange', () => {
    const { grid } = make();
    const sort = vi.fn();
    grid.on('sortChange', sort);
    grid.setFilter({ search: 'a' });
    expect(sort).not.toHaveBeenCalled();
  });
});

describe('empty state', () => {
  it('shows a single "No data" row spanning all columns', () => {
    const { el, grid } = make();
    grid.setFilter({ search: 'zzz' });
    const trs = el.querySelectorAll('tbody tr');
    expect(trs).toHaveLength(1);
    const td = /** @type {HTMLTableCellElement} */ (trs[0].querySelector('td'));
    expect(td.colSpan).toBe(columns.length);
    expect(td.textContent).toBe('No data');
    grid.setFilter(null);
    expect(el.querySelectorAll('tbody tr')).toHaveLength(3);
  });

  it('announces it through a polite live region and clears it afterwards', () => {
    const { el, grid } = make();
    const live = /** @type {HTMLElement} */ (el.querySelector('[aria-live="polite"]'));
    expect(live.textContent).toBe('');
    grid.setFilter({ search: 'zzz' });
    expect(el.querySelector('[aria-live="polite"]')).toBe(live);
    expect(live.textContent).toBe('No data');
    grid.setFilter(null);
    expect(live.textContent).toBe('');
  });

  it('uses options.labels.empty (escaped)', () => {
    const { el } = make({ rows: [], labels: { empty: 'ไม่พบ <i>' } });
    expect(el.querySelector('tbody td')?.textContent).toBe('ไม่พบ <i>');
    expect(el.querySelector('i')).toBeNull();
  });
});

describe('destroy', () => {
  it('removes the input listener, clears the debounce timer and goes inert', () => {
    const onFilterChange = vi.fn();
    const { el, grid } = make({ onFilterChange });
    const toolbar = /** @type {HTMLElement} */ (el.querySelector('.dg-toolbar'));
    const remove = vi.spyOn(toolbar, 'removeEventListener');
    const box = input(el);
    type(el, 'ada');
    expect(vi.getTimerCount()).toBe(1);
    grid.destroy();
    expect(remove.mock.calls.map(([t]) => t)).toEqual(['input', 'click', 'change', 'keydown']);
    expect(vi.getTimerCount()).toBe(0);
    expect(el.innerHTML).toBe('');

    box.value = 'x';
    box.dispatchEvent(new Event('input', { bubbles: true }));
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(1000);
    grid.setFilter({ search: 'x' });
    grid.setRows([]);
    expect(el.innerHTML).toBe('');
    expect(onFilterChange).not.toHaveBeenCalled();
  });
});

describe('title', () => {
  it('shows the escaped grid name first in the toolbar, with or without a search box', () => {
    for (const searchable of [true, false]) {
      const el = document.createElement('div');
      new DataGrid(el, {
        columns: [{ key: 'a', label: 'A' }],
        rows: [],
        searchable,
        title: '<b>PO</b>',
      });
      const title = el.querySelector('.dg-toolbar > .dg-heading > h2.dg-title');
      expect(title?.textContent).toBe('<b>PO</b>');
      expect(el.querySelector('.dg-title b')).toBeNull();
    }
  });

  it('renders no toolbar without a title or search', () => {
    const el = document.createElement('div');
    new DataGrid(el, { columns: [{ key: 'a', label: 'A' }], rows: [] });
    expect(el.querySelector('.dg-toolbar, .dg-title')).toBeNull();
  });
});

describe('description', () => {
  const make = (extra = {}) => {
    const el = document.createElement('div');
    new DataGrid(el, { columns: [{ key: 'a', label: 'A' }], rows: [], ...extra });
    return el;
  };

  it('shows the escaped text below the toolbar, with a toggle that hides and shows it', () => {
    const el = make({ title: 'PO', description: '<i>about</i>' });
    const desc = /** @type {HTMLElement} */ (el.querySelector('.dg-root > .dg-desc'));
    const toggle = /** @type {HTMLButtonElement} */ (el.querySelector('.dg-desc-toggle'));
    expect(desc.textContent).toBe('<i>about</i>');
    expect(desc.querySelector('i')).toBeNull();
    expect(toggle.getAttribute('aria-label')).toBe('Show or hide description');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(desc.hidden).toBe(false);
    toggle.click();
    expect(desc.hidden).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    expect(desc.hidden).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('works without a title and renders nothing when not given', () => {
    expect(make({ description: 'x' }).querySelector('.dg-heading .dg-desc-toggle')).not.toBeNull();
    expect(make({ title: 'PO' }).querySelector('.dg-desc, .dg-desc-toggle')).toBeNull();
  });
});
