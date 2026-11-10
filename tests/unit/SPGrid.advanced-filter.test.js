import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPGrid, thaiLabels } from '../../src/index.js';

/** @type {import('../../src/types.js').Column[]} */
const columns = [
  { key: 'name', label: 'Name' },
  { key: 'amount', label: 'Amount', type: 'number' },
  { key: 'due', label: 'Due', type: 'date' },
  { key: 'status', label: 'Status', options: ['open', 'done', 'void'] },
  { key: 'ops', actions: [{ name: 'view', label: 'View' }] },
];
const rows = [
  { name: 'Ada', amount: 500, due: '2026-11-01', status: 'open' },
  { name: 'Grace', amount: 1500, due: '2026-11-15', status: 'done' },
  { name: 'Eve', amount: 2500, due: '2026-11-20', status: 'void' },
  { name: 'Alan', amount: 900, due: '2026-12-01', status: 'open' },
];

/** @type {string[]} */
let clicked;
beforeEach(() => {
  clicked = [];
  URL.createObjectURL = vi.fn(() => 'blob:x');
  URL.revokeObjectURL = vi.fn();
  document.addEventListener('click', onClick);
});
afterEach(() => {
  document.removeEventListener('click', onClick);
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});
/** @param {MouseEvent} event */
const onClick = (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    event.preventDefault();
    clicked.push(event.target.download);
  }
};

const make = (options = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new SPGrid(el, { columns, rows, filterSummary: true, ...options });
  return { el, grid };
};
/** @param {HTMLElement} el */
const names = (el) =>
  [...el.querySelectorAll('tbody tr td:nth-child(1)')].map((c) => c.textContent);
/** @param {HTMLElement} el */
const chips = (el) => [...el.querySelectorAll('.spg-chip-text')].map((c) => c.textContent);
/** @type {any} */
const gt = { key: 'amount', op: 'gt', value: 800 };
/** @type {any} */
const open = { key: 'status', op: 'in', value: ['open'] };

describe('setAdvancedFilter', () => {
  it('filters the rows, on top of the search, and returns to page 1', () => {
    const { el, grid } = make({ pageSize: 2 });
    grid.setPage(2);
    grid.setAdvancedFilter({ logic: 'and', conditions: [gt, open] });
    expect(names(el)).toEqual(['Alan']);
    expect(grid.getPage()).toBe(1);
    grid.setFilter({ search: 'eve' });
    expect(names(el)).toEqual(['No data']);
    grid.setFilter(null);
    expect(names(el)).toEqual(['Alan']);
  });

  it('takes a single condition, an or group, and null to clear', () => {
    const { el, grid } = make();
    grid.setAdvancedFilter(gt);
    expect(names(el)).toEqual(['Grace', 'Eve', 'Alan']);
    grid.setAdvancedFilter({
      logic: 'or',
      conditions: [open, { key: 'name', op: 'equals', value: 'Eve' }],
    });
    expect(names(el)).toEqual(['Ada', 'Eve', 'Alan']);
    grid.setAdvancedFilter(null);
    expect(names(el)).toHaveLength(4);
    expect(grid.getAdvancedFilter()).toBeNull();
  });

  it('stores the normalized filter and hands out copies', () => {
    const { grid } = make();
    grid.setAdvancedFilter({
      logic: 'and',
      conditions: [gt, { key: 'name', op: 'contains', value: '' }],
    });
    const got = grid.getAdvancedFilter();
    expect(got).toEqual({ logic: 'and', conditions: [gt] });
    /** @type {any} */ (got).conditions.length = 0;
    expect(grid.getAdvancedFilter()).toEqual({ logic: 'and', conditions: [gt] });
  });

  it('throws for a bad condition and leaves the filter as it was', () => {
    const { grid } = make();
    grid.setAdvancedFilter(gt);
    expect(() => grid.setAdvancedFilter({ key: 'nope', op: 'equals', value: 1 })).toThrow(
      RangeError,
    );
    expect(() => grid.setAdvancedFilter({ key: 'name', op: 'gt', value: 1 })).toThrow(RangeError);
    expect(() => grid.setAdvancedFilter({ key: 'ops', op: 'isEmpty' })).toThrow(RangeError);
    expect(grid.getAdvancedFilter()).toEqual(gt);
  });

  it('is a no-op after destroy()', () => {
    const { grid } = make();
    grid.destroy();
    expect(() => grid.setAdvancedFilter(gt)).not.toThrow();
    expect(grid.getAdvancedFilter()).toBeNull();
  });
});

describe('filter events and getFilter', () => {
  it('reports the conditions in getFilter() and in filterChange, once per change', () => {
    const { grid } = make();
    const seen = vi.fn();
    grid.on('filterChange', seen);
    grid.setAdvancedFilter(gt);
    grid.setAdvancedFilter(gt);
    expect(seen).toHaveBeenCalledTimes(1);
    expect(seen).toHaveBeenCalledWith({ conditions: gt });
    expect(grid.getFilter()).toEqual({ conditions: gt });
    grid.setAdvancedFilter(null);
    expect(seen).toHaveBeenLastCalledWith(null);
  });

  it('setFilter() leaves the conditions alone, even when given them back', () => {
    const { grid } = make();
    grid.setAdvancedFilter(gt);
    grid.setFilter({ search: 'a' });
    expect(grid.getFilter()).toEqual({ search: 'a', conditions: gt });
    grid.setFilter(grid.getFilter());
    grid.setFilter(null);
    expect(grid.getAdvancedFilter()).toEqual(gt);
  });

  it('resetView() clears the conditions', () => {
    const { el, grid } = make();
    grid.setAdvancedFilter(gt);
    grid.resetView();
    expect(grid.getAdvancedFilter()).toBeNull();
    expect(names(el)).toHaveLength(4);
  });
});

describe('export', () => {
  it('writes only the rows the conditions leave', async () => {
    const { grid } = make();
    grid.setAdvancedFilter(open);
    const bytes = new Uint8Array(await grid.exportExcel().arrayBuffer());
    const text = new TextDecoder().decode(bytes);
    expect(text).toContain('Ada');
    expect(text).toContain('Alan');
    expect(text).not.toContain('Grace');
  });
});

describe('filter summary', () => {
  it('shows one chip per condition of an and group and counts the rows', () => {
    const { el, grid } = make();
    grid.setAdvancedFilter({ logic: 'and', conditions: [gt, open] });
    expect(chips(el)).toEqual(['Amount greater than 800', 'Status is one of open']);
    expect(el.querySelector('.spg-summary-count')?.textContent).toBe('Found 1 of 4');
  });

  it('shows an or group, a between and an enum label as one line', () => {
    const { el, grid } = make();
    grid.setAdvancedFilter({
      logic: 'or',
      conditions: [
        { key: 'amount', op: 'between', value: [1000, ''] },
        { key: 'name', op: 'isEmpty' },
      ],
    });
    expect(chips(el)).toEqual(['Amount between 1000 – … or Name is empty']);
  });

  it('removing a chip drops that condition; the last one clears the filter', () => {
    const { el, grid } = make();
    grid.setAdvancedFilter({ logic: 'and', conditions: [gt, open] });
    /** @type {HTMLElement} */ (el.querySelector('.spg-chip-remove[data-index="0"]')).click();
    expect(grid.getAdvancedFilter()).toEqual({ logic: 'and', conditions: [open] });
    /** @type {HTMLElement} */ (el.querySelector('.spg-chip-remove')).click();
    expect(grid.getAdvancedFilter()).toBeNull();
    expect(el.querySelector('.spg-chip')).toBeNull();
  });

  it('removing the chip of an or group clears all of it', () => {
    const { el, grid } = make();
    grid.setAdvancedFilter({ logic: 'or', conditions: [gt, open] });
    /** @type {HTMLElement} */ (el.querySelector('.spg-chip-remove')).click();
    expect(grid.getAdvancedFilter()).toBeNull();
  });

  it('reads in Thai with thaiLabels', () => {
    const { el, grid } = make({ labels: thaiLabels });
    grid.setAdvancedFilter({ logic: 'or', conditions: [gt, open] });
    expect(chips(el)[0]).toBe('Amount มากกว่า 800 หรือ Status เป็นหนึ่งใน open');
  });
});
