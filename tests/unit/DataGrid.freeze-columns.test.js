import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataGrid, thaiLabels } from '../../src/index.js';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

const columns = ['a', 'b', 'c', 'd'].map((key) => ({ key, label: key.toUpperCase() }));
const rows = [
  { a: 1, b: 2, c: 3, d: 4 },
  { a: 5, b: 6, c: 7, d: 8 },
];

/** @param {object} [extra] */
const make = (extra = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new DataGrid(el, { columns, rows, ...extra });
  const root = /** @type {HTMLElement} */ (el.querySelector('.dg-root'));
  return { el, root, grid };
};
/** @param {HTMLElement} el The labels of the header cells that are frozen. */
const frozenHeads = (el) =>
  [...el.querySelectorAll('thead th.dg-frozen')].map((th) => th.textContent?.trim());
/** @param {HTMLElement} el */
const open = (el) => /** @type {HTMLButtonElement} */ (el.querySelector('.dg-columns-btn')).click();
/** @param {HTMLElement} el */
const select = (el) =>
  /** @type {HTMLSelectElement | null} */ (el.querySelector('select[data-choice="freezeColumns"]'));
/** @param {HTMLElement} el @param {string} count */
const choose = (el, count) => {
  open(el);
  /** @type {HTMLSelectElement} */ (select(el)).value = count;
  /** @type {HTMLButtonElement} */ (el.querySelector('.dg-modal-ok')).click();
};

describe('freezeColumns option', () => {
  it('freezes nothing by default', () => {
    const { el, root } = make();
    expect(el.querySelectorAll('.dg-frozen')).toHaveLength(0);
    expect(root.hasAttribute('data-freeze')).toBe(false);
  });

  it('freezes the header and every body cell of the first columns', () => {
    const { el } = make({ freezeColumns: 2 });
    expect(frozenHeads(el)).toEqual(['A', 'B']);
    for (const tr of el.querySelectorAll('tbody tr')) {
      expect([...tr.children].map((td) => td.classList.contains('dg-frozen'))).toEqual([
        true,
        true,
        false,
        false,
      ]);
    }
  });

  it('marks only the last frozen column with dg-frozen-last', () => {
    const { el } = make({ freezeColumns: 2 });
    const last = [...el.querySelectorAll('.dg-frozen-last')];
    expect(last).toHaveLength(3); // the header cell and the two body cells of column B
    expect(last.map((cell) => /** @type {HTMLTableCellElement} */ (cell).cellIndex)).toEqual([
      1, 1, 1,
    ]);
  });

  it('offsets each frozen column by the widths before it', () => {
    /** @type {Record<string, number>} */
    const widths = { A: 100, B: 60, C: 80, D: 40 };
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      /** @this {HTMLElement} */ function () {
        return /** @type {DOMRect} */ ({ width: widths[this.textContent?.trim() ?? ''] ?? 0 });
      },
    );
    const { el } = make({ freezeColumns: 3 });
    const starts = [...el.querySelectorAll('thead th')].map((th) =>
      /** @type {HTMLElement} */ (th).style.getPropertyValue('--dgi-freeze-start'),
    );
    expect(starts).toEqual(['0px', '100px', '160px', '']);
    const bodyStarts = [...(el.querySelector('tbody tr')?.children ?? [])].map((td) =>
      /** @type {HTMLElement} */ (td).style.getPropertyValue('--dgi-freeze-start'),
    );
    expect(bodyStarts).toEqual(['0px', '100px', '160px', '']);
  });

  it('always leaves one column free, even when asked for more than there are', () => {
    expect(frozenHeads(make({ freezeColumns: 4 }).el)).toEqual(['A', 'B', 'C']);
    expect(frozenHeads(make({ freezeColumns: 99 }).el)).toEqual(['A', 'B', 'C']);
  });

  it('counts the shown columns, and follows the column order', () => {
    const hidden = make({ freezeColumns: 2, hiddenColumns: ['a'] });
    expect(frozenHeads(hidden.el)).toEqual(['B', 'C']);
    const moved = make({ freezeColumns: 1 });
    moved.grid.setColumnOrder(['c', 'a']);
    expect(frozenHeads(moved.el)).toEqual(['C']);
  });

  it('keeps the frozen columns across renders (sort, filter, paging)', () => {
    const { el, grid } = make({ freezeColumns: 1 });
    grid.setRows([{ a: 9, b: 9, c: 9, d: 9 }]);
    expect(el.querySelectorAll('tbody td.dg-frozen')).toHaveLength(1);
    grid.setRows([]);
    expect(frozenHeads(el)).toEqual(['A']);
    expect(el.querySelectorAll('tbody td.dg-frozen')).toHaveLength(0); // the "no data" row is not a column
  });

  it('leaves group header rows alone', () => {
    const { el } = make({ freezeColumns: 1, groupBy: ['a'] });
    expect(el.querySelectorAll('tr.dg-group-row .dg-frozen')).toHaveLength(0);
    expect(el.querySelectorAll('tbody tr[data-row-index] td.dg-frozen')).toHaveLength(2);
  });

  it.each([-1, 1.5, '2', Number.NaN, null])('throws a RangeError for %j', (freezeColumns) => {
    expect(() => make({ freezeColumns })).toThrow(RangeError);
  });

  it('moves the frozen cells again when a column is resized', () => {
    const { el } = make({ freezeColumns: 2, resizableColumns: true });
    const handle = /** @type {HTMLElement} */ (
      el.querySelector('thead th:nth-child(1) .dg-resize')
    );
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      /** @this {HTMLElement} */ function () {
        return /** @type {DOMRect} */ ({ width: parseFloat(this.style.width) || 100 });
      },
    );
    handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    const second = /** @type {HTMLElement} */ (el.querySelector('thead th:nth-child(2)'));
    expect(second.style.getPropertyValue('--dgi-freeze-start')).toBe('110px');
  });
});

describe('freezeColumnsToggle', () => {
  it('adds the Settings button and a select from 0 to one less than the columns, on the current count', () => {
    const { el } = make({ freezeColumnsToggle: true, freezeColumns: 2 });
    open(el);
    const field = /** @type {HTMLSelectElement} */ (select(el));
    expect([...field.options].map((o) => o.value)).toEqual(['0', '1', '2', '3']);
    expect([...field.options].map((o) => o.textContent)).toEqual(['None', '1', '2', '3']);
    expect(field.value).toBe('2');
    expect(field.closest('label')?.querySelector('span')?.textContent).toBe('Frozen columns');
  });

  it('is absent without the option', () => {
    const { el } = make({ gridLinesToggle: true });
    open(el);
    expect(select(el)).toBeNull();
  });

  it('still lists a count set higher from code, so Apply does not change it', () => {
    const { el, root } = make({ freezeColumnsToggle: true, freezeColumns: 9 });
    open(el);
    expect(select(el)?.value).toBe('9');
    /** @type {HTMLButtonElement} */ (el.querySelector('.dg-modal-ok')).click();
    expect(root.getAttribute('data-freeze')).toBe('9');
  });

  it('freezes on Apply only, and Cancel discards', () => {
    const { el, root } = make({ freezeColumnsToggle: true });
    open(el);
    /** @type {HTMLSelectElement} */ (select(el)).value = '2';
    /** @type {HTMLButtonElement} */ (el.querySelector('.dg-modal-cancel')).click();
    expect(frozenHeads(el)).toEqual([]);
    choose(el, '2');
    expect(frozenHeads(el)).toEqual(['A', 'B']);
    expect(root.getAttribute('data-freeze')).toBe('2');
    choose(el, '1');
    expect(frozenHeads(el)).toEqual(['A']);
    choose(el, '0');
    expect(frozenHeads(el)).toEqual([]);
    expect(root.hasAttribute('data-freeze')).toBe(false);
  });

  it('works beside the other settings in one Apply', () => {
    const { el, root } = make({ freezeColumnsToggle: true, lineStyleToggle: true });
    open(el);
    /** @type {HTMLSelectElement} */ (select(el)).value = '1';
    /** @type {HTMLSelectElement} */ (el.querySelector('select[data-choice="lineStyle"]')).value =
      'solid';
    /** @type {HTMLButtonElement} */ (el.querySelector('.dg-modal-ok')).click();
    expect(frozenHeads(el)).toEqual(['A']);
    expect(root.classList.contains('dg-line-solid')).toBe(true);
  });

  it('counts the columns whether or not the column picker is on, and hidden ones too', () => {
    const { el } = make({ freezeColumnsToggle: true, columnPicker: true, hiddenColumns: ['d'] });
    open(el);
    expect(select(el)?.options).toHaveLength(4);
  });

  it('is remembered under freezeColumnsStorageKey, ahead of the option; a bad saved value is ignored', () => {
    choose(make({ freezeColumnsToggle: true, freezeColumnsStorageKey: 'po' }).el, '2');
    expect(JSON.parse(localStorage.getItem('datagrid:freezeColumns:po') ?? 'null')).toBe(2);
    expect(frozenHeads(make({ freezeColumns: 1, freezeColumnsStorageKey: 'po' }).el)).toEqual([
      'A',
      'B',
    ]);
    choose(make({ freezeColumnsToggle: true, freezeColumnsStorageKey: 'po' }).el, '0');
    expect(frozenHeads(make({ freezeColumns: 1, freezeColumnsStorageKey: 'po' }).el)).toEqual([]);
    for (const bad of ['"two"', '-1', '1.5']) {
      localStorage.setItem('datagrid:freezeColumns:bad', bad);
      expect(frozenHeads(make({ freezeColumns: 1, freezeColumnsStorageKey: 'bad' }).el)).toEqual([
        'A',
      ]);
    }
  });

  it('survives resetView (it is a look setting, like the grid lines)', () => {
    const { el, grid } = make({ freezeColumns: 2 });
    grid.resetView();
    expect(frozenHeads(el)).toEqual(['A', 'B']);
  });

  it('has Thai texts in thaiLabels and can be relabelled', () => {
    const thai = make({ freezeColumnsToggle: true, labels: thaiLabels });
    open(thai.el);
    expect(select(thai.el)?.closest('label')?.querySelector('span')?.textContent).toBe(
      'ตรึงคอลัมน์',
    );
    expect(select(thai.el)?.options[0].textContent).toBe('ไม่ตรึง');
    const custom = make({
      freezeColumnsToggle: true,
      labels: { freezeColumns: 'Pinned', freezeColumnsNone: 'Off' },
    });
    open(custom.el);
    expect(select(custom.el)?.closest('label')?.querySelector('span')?.textContent).toBe('Pinned');
    expect(select(custom.el)?.options[0].textContent).toBe('Off');
  });
});
