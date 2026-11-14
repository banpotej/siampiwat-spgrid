import { afterEach, describe, expect, it, vi } from 'vitest';
import { SPGrid, thaiLabels } from '../../src/index.js';

/** @type {import('../../src/types.js').Column[]} */
const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'age', label: 'Age', type: 'number' },
  { key: 'ops', actions: [{ name: 'open', label: 'Open' }] },
];
const rows = [
  { id: 1, name: 'Bo', age: 30 },
  { id: 2, name: 'Al', age: 40 },
  { id: 3, name: 'Cy', age: 20 },
  { id: 4, name: 'Di', age: 50 },
];

/** @param {object} [options] */
const make = (options = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new SPGrid(el, { columns, rows, rowKey: 'id', selectable: true, ...options });
  return { el, grid };
};
/** @param {HTMLElement} el */
const trs = (el) => [...el.querySelectorAll('tbody tr[data-row-index]')];
/** @param {HTMLElement} el @param {number} i @returns {HTMLInputElement} */
const box = (el, i) =>
  /** @type {HTMLInputElement} */ (trs(el)[i].querySelector('input.spg-select'));
/** @param {HTMLElement} el @returns {HTMLInputElement} */
const all = (el) => /** @type {HTMLInputElement} */ (el.querySelector('input.spg-select-all'));
/** @param {HTMLElement} el */
const ids = (el) =>
  [...el.querySelectorAll('tbody tr[data-row-index]')].map((tr) => tr.getAttribute('data-row-id'));
/** @param {HTMLElement} input @param {boolean} checked */
const check = (input, checked) => {
  /** @type {HTMLInputElement} */ (input).checked = checked;
  input.dispatchEvent(new Event('change', { bubbles: true }));
};
/** @param {HTMLElement} target @param {string} key */
const press = (target, key) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
const names = (/** @type {import('../../src/types.js').Row[]} */ list) => list.map((r) => r.name);

afterEach(() => {
  document.body.innerHTML = '';
});

describe('the selection column', () => {
  it('adds a header checkbox and a checkbox per row before the data columns', () => {
    const { el } = make();
    const heads = [...el.querySelectorAll('thead th')];
    expect(heads.length).toBe(4);
    expect(heads[0].classList.contains('spg-select-col')).toBe(true);
    expect(all(el).getAttribute('aria-label')).toBe('Select all rows on this page');
    expect(el.querySelectorAll('tbody input.spg-select').length).toBe(4);
    expect(box(el, 0).getAttribute('aria-label')).toBe('Select row');
    expect(box(el, 0).getAttribute('tabindex')).toBe('-1');
    expect(trs(el)[0].children[1].textContent).toBe('Bo');
  });

  it('is absent without the option, and for selectable: false', () => {
    for (const options of [{ selectable: undefined }, { selectable: false }]) {
      const { el } = make(options);
      expect(el.querySelector('.spg-select-col')).toBeNull();
      expect(el.querySelector('input.spg-select')).toBeNull();
      expect(trs(el)[0].hasAttribute('aria-selected')).toBe(false);
    }
  });

  it("'single' has no header checkbox, only a name", () => {
    const { el } = make({ selectable: 'single' });
    expect(el.querySelector('input.spg-select-all')).toBeNull();
    expect(el.querySelector('.spg-select-name')?.textContent).toBe('Select');
  });

  it('rejects an unknown mode', () => {
    expect(() => make({ selectable: 'all' })).toThrow(RangeError);
  });

  it('is translated by labels, and spans group headers and the empty row', () => {
    const { el, grid } = make({ labels: thaiLabels, groupBy: ['name'] });
    expect(all(el).getAttribute('aria-label')).toBe('เลือกทุกแถวในหน้านี้');
    expect(
      el.querySelector('tr.spg-group-row td, tr.spg-group-row th')?.getAttribute('colspan'),
    ).toBe('4');
    grid.setFilter({ search: 'zzz-nothing' });
    expect(el.querySelector('tr.spg-empty td')?.getAttribute('colspan')).toBe('4');
  });
});

describe('selecting with the mouse', () => {
  it('a row checkbox selects the row, sets aria-selected and the is-selected class', () => {
    const { el, grid } = make();
    expect(trs(el).map((tr) => tr.getAttribute('aria-selected'))).toEqual([
      'false',
      'false',
      'false',
      'false',
    ]);
    check(box(el, 1), true);
    expect(names(grid.getSelectedRows())).toEqual(['Al']);
    expect(trs(el)[1].getAttribute('aria-selected')).toBe('true');
    expect(trs(el)[1].classList.contains('is-selected')).toBe(true);
    expect(box(el, 1).checked).toBe(true);
    check(box(el, 1), false);
    expect(grid.getSelectedRows()).toEqual([]);
    expect(trs(el)[1].classList.contains('is-selected')).toBe(false);
  });

  it('the header checkbox selects every row of the page, and is half-checked for part of it', () => {
    const { el, grid } = make({ pageSize: 2 });
    check(all(el), true);
    expect(names(grid.getSelectedRows())).toEqual(['Bo', 'Al']);
    expect(all(el).checked).toBe(true);
    grid.setPage(2);
    expect(all(el).checked).toBe(false);
    expect(all(el).indeterminate).toBe(false);
    check(box(el, 0), true);
    expect(all(el).indeterminate).toBe(true);
    check(box(el, 1), true);
    expect(all(el).checked).toBe(true);
    check(all(el), false);
    expect(names(grid.getSelectedRows())).toEqual(['Bo', 'Al']); // page 1 is still selected
  });

  it("'single' keeps one row: selecting another moves it", () => {
    const { el, grid } = make({ selectable: 'single' });
    check(box(el, 0), true);
    check(box(el, 2), true);
    expect(names(grid.getSelectedRows())).toEqual(['Cy']);
    expect(box(el, 0).checked).toBe(false);
    check(box(el, 2), false);
    expect(grid.getSelectedRows()).toEqual([]);
  });

  it('does not activate the row', () => {
    const onRowActivate = vi.fn();
    const { el } = make({ onRowActivate });
    box(el, 0).dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(onRowActivate).not.toHaveBeenCalled();
  });
});

describe('selecting with the keyboard', () => {
  it('Space on a focused row toggles it', () => {
    const { el, grid } = make();
    const tr = /** @type {HTMLElement} */ (trs(el)[2]);
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    tr.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(names(grid.getSelectedRows())).toEqual(['Cy']);
    press(/** @type {HTMLElement} */ (trs(el)[2]), ' ');
    expect(grid.getSelectedRows()).toEqual([]);
  });

  it('Space inside a control of the row is left alone', () => {
    const { el, grid } = make();
    const open = /** @type {HTMLElement} */ (el.querySelector('tbody button'));
    press(open, ' ');
    expect(grid.getSelectedRows()).toEqual([]);
  });

  it('keeps focus on the row (or its box) across the redraw', () => {
    const { el } = make();
    /** @type {HTMLElement} */ (trs(el)[1]).focus();
    press(/** @type {HTMLElement} */ (document.activeElement), ' ');
    expect(document.activeElement).toBe(trs(el)[1]);
    box(el, 2).focus();
    check(box(el, 2), true);
    expect(document.activeElement).toBe(box(el, 2));
    all(el).focus();
    check(all(el), true);
    expect(document.activeElement).toBe(all(el));
  });
});

describe('getSelectedRows / setSelectedRows', () => {
  it('returns the grid row objects in row order, whatever the sort or page', () => {
    const { grid } = make({ pageSize: 2 });
    grid.setSelectedRows([rows[3], rows[0]]);
    grid.setSort({ key: 'name', direction: 'asc' });
    expect(grid.getSelectedRows()).toEqual([rows[0], rows[3]]);
    expect(grid.getSelectedRows()[0]).toBe(rows[0]);
  });

  it('matches by rowKey, so a partial row is enough, and ignores unknown rows', () => {
    const { el, grid } = make();
    grid.setSelectedRows([{ id: 2 }, { id: 99 }]);
    expect(names(grid.getSelectedRows())).toEqual(['Al']);
    expect(box(el, 1).checked).toBe(true);
    grid.setSelectedRows([]);
    expect(grid.getSelectedRows()).toEqual([]);
  });

  it('matches by identity without a rowKey', () => {
    const { grid } = make({ rowKey: undefined });
    grid.setSelectedRows([{ ...rows[0] }, rows[1]]);
    expect(grid.getSelectedRows()).toEqual([rows[1]]);
  });

  it("throws without the option, or for several rows in 'single' mode", () => {
    expect(() => make({ selectable: undefined }).grid.setSelectedRows([])).toThrow(RangeError);
    expect(make({ selectable: undefined }).grid.getSelectedRows()).toEqual([]);
    expect(() => make({ selectable: 'single' }).grid.setSelectedRows(rows)).toThrow(RangeError);
  });

  it('survives filtering and sorting', () => {
    const { el, grid } = make();
    grid.setSelectedRows([rows[0]]);
    grid.setFilter({ search: 'Al' });
    expect(ids(el)).toEqual(['2']);
    expect(names(grid.getSelectedRows())).toEqual(['Bo']);
    grid.setFilter(null);
    expect(box(el, 0).checked).toBe(true);
  });

  it('does nothing after destroy', () => {
    const { grid } = make();
    grid.destroy();
    expect(() => grid.setSelectedRows([rows[0]])).not.toThrow();
  });
});

describe('setRows', () => {
  it('keeps the rows that are still there (by rowKey) and drops the rest', () => {
    const { el, grid } = make();
    grid.setSelectedRows([rows[0], rows[1]]);
    grid.setRows([
      { id: 2, name: 'Al2', age: 41 },
      { id: 5, name: 'Ed', age: 10 },
    ]);
    expect(names(grid.getSelectedRows())).toEqual(['Al2']);
    expect(box(el, 0).checked).toBe(true);
    expect(box(el, 1).checked).toBe(false);
  });

  it('leaves the selection alone when nothing is lost', () => {
    const { grid } = make();
    grid.setSelectedRows([rows[0]]);
    const spy = vi.fn();
    grid.on('selectionChange', spy);
    grid.setRows([...rows]);
    expect(spy).not.toHaveBeenCalled();
  });

  it('without a rowKey a new row object is a new row', () => {
    const { grid } = make({ rowKey: undefined });
    grid.setSelectedRows([rows[0]]);
    grid.setRows(rows.map((r) => ({ ...r })));
    expect(grid.getSelectedRows()).toEqual([]);
  });
});

describe('selectionChange', () => {
  it('fires once per change with the selected rows, from the option and from on()', () => {
    const onSelectionChange = vi.fn();
    const { el, grid } = make({ onSelectionChange });
    const spy = vi.fn();
    const off = grid.on('selectionChange', spy);
    check(box(el, 0), true);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toEqual([rows[0]]);
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    check(all(el), true);
    expect(spy.mock.calls[1][0].length).toBe(4);
    off();
    check(all(el), false);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(onSelectionChange).toHaveBeenCalledTimes(3);
  });

  it('does not fire when setSelectedRows changes nothing', () => {
    const { grid } = make();
    grid.setSelectedRows([rows[0]]);
    const spy = vi.fn();
    grid.on('selectionChange', spy);
    grid.setSelectedRows([{ id: 1 }]);
    expect(spy).not.toHaveBeenCalled();
    grid.setSelectedRows([]);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('with other features', () => {
  it('freezeColumns keeps the checkbox column frozen with the first data column', () => {
    const { el } = make({ freezeColumns: 1 });
    const frozen = [...el.querySelectorAll('thead th.spg-frozen')].map((th) => th.className);
    expect(frozen.length).toBe(2);
    expect(el.querySelector('thead th.spg-select-col')?.classList.contains('spg-frozen')).toBe(
      true,
    );
  });

  it('highlights search matches in the right cells', () => {
    const { el, grid } = make();
    grid.setFilter({ search: 'Al' });
    expect(el.querySelector('tbody tr td:nth-child(2) mark')?.textContent).toBe('Al');
    expect(el.querySelector('tbody tr td:nth-child(1) mark')).toBeNull();
  });

  it('exports only the selected rows with selectedOnly', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const { grid } = make();
    const full = grid.exportExcel({ filename: 'a.xlsx' });
    grid.setSelectedRows([rows[1]]);
    const some = grid.exportExcel({ filename: 'b.xlsx', selectedOnly: true });
    grid.setSelectedRows([]);
    const none = grid.exportExcel({ filename: 'c.xlsx', selectedOnly: true });
    expect(some.size).toBeLessThan(full.size);
    expect(none.size).toBeLessThan(some.size);
    expect(grid.exportExcel({ filename: 'd.xlsx' }).size).toBe(full.size);
  });

  it('selectedOnly keeps the grid filter and sort: it exports the selected rows among those the export holds', () => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const { grid } = make();
    grid.setSelectedRows([rows[0], rows[1]]);
    grid.setFilter({ search: 'Al' });
    const filtered = grid.exportExcel({ selectedOnly: true });
    const unfiltered = (() => {
      grid.setFilter(null);
      return grid.exportExcel({ selectedOnly: true });
    })();
    expect(filtered.size).toBeLessThan(unfiltered.size);
  });
});
