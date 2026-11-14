import { afterEach, describe, expect, it, vi } from 'vitest';
import { SPGrid, thaiLabels } from '../../src/index.js';

/** @type {import('../../src/types.js').Column[]} */
const columns = [
  { key: 'name', label: 'Name' },
  { key: 'dept', label: 'Dept' },
];
const rows = [
  { id: 1, name: 'Ada', dept: 'A' },
  { id: 2, name: 'Bo', dept: 'B' },
  { id: 3, name: 'Cy', dept: 'A' },
  { id: 4, name: 'Di', dept: 'B' },
];
const actions = [
  { name: 'approve', label: 'อนุมัติ', confirm: true, primary: true },
  { name: 'return', label: 'ส่งกลับ' },
];

/** @param {object} [options] */
const make = (options = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new SPGrid(el, {
    columns,
    rows,
    rowKey: 'id',
    selectable: true,
    selectionActions: actions,
    labels: thaiLabels,
    ...options,
  });
  return { el, grid };
};
/** @param {HTMLElement} el */
const bar = (el) => /** @type {HTMLElement} */ (el.querySelector('.spg-selection-bar'));
/** @param {HTMLElement} el @param {string} name */
const action = (el, name) =>
  /** @type {HTMLButtonElement} */ (el.querySelector(`.spg-sel-action[data-action="${name}"]`));
/** @param {HTMLElement} el @param {number} i */
const tick = (el, i) => {
  const box = /** @type {HTMLInputElement} */ (el.querySelectorAll('tbody input.spg-select')[i]);
  box.checked = !box.checked;
  box.dispatchEvent(new Event('change', { bubbles: true }));
};
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('the selection bar', () => {
  it('is hidden until a row is selected, then says how many and shows the actions', () => {
    const { el, grid } = make();
    expect(bar(el).hidden).toBe(true);
    tick(el, 0);
    tick(el, 2);
    expect(bar(el).hidden).toBe(false);
    expect(el.querySelector('.spg-sel-count')?.textContent).toBe('เลือกแล้ว 2 รายการ');
    expect([...el.querySelectorAll('.spg-sel-action')].map((b) => b.textContent)).toEqual([
      'อนุมัติ',
      'ส่งกลับ',
    ]);
    expect(action(el, 'approve').classList.contains('is-primary')).toBe(true);
    expect(bar(el).getAttribute('role')).toBe('toolbar');
    expect(bar(el).getAttribute('aria-label')).toBe('คำสั่งสำหรับรายการที่เลือก');
    grid.setSelectedRows([]);
    expect(bar(el).hidden).toBe(true);
  });

  it('follows setSelectedRows and keeps the count after the rows change', () => {
    const { el, grid } = make();
    grid.setSelectedRows([rows[0], rows[1], rows[2]]);
    expect(el.querySelector('.spg-sel-count')?.textContent).toBe('เลือกแล้ว 3 รายการ');
    grid.setRows(rows.slice(1));
    expect(el.querySelector('.spg-sel-count')?.textContent).toBe('เลือกแล้ว 2 รายการ');
  });

  it('Clear selection deselects every row', () => {
    const { el, grid } = make();
    grid.setSelectedRows(rows);
    /** @type {HTMLElement} */ (el.querySelector('.spg-sel-clear')).click();
    expect(grid.getSelectedRows()).toEqual([]);
    expect(bar(el).hidden).toBe(true);
  });

  it('an action without confirm reports { action, rows } at once', () => {
    const onSelectionAction = vi.fn();
    const { el, grid } = make({ onSelectionAction });
    const spy = vi.fn();
    grid.on('selectionAction', spy);
    tick(el, 1);
    action(el, 'return').click();
    expect(onSelectionAction).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toEqual({ action: 'return', rows: [rows[1]] });
  });

  it('an action with confirm asks first, and runs only on yes', async () => {
    const onSelectionAction = vi.fn();
    const { el } = make({ onSelectionAction });
    tick(el, 0);
    tick(el, 1);
    action(el, 'approve').click();
    const dialog = el.querySelector('.spg-modal');
    expect(dialog?.querySelector('.spg-modal-text')?.textContent).toBe(
      'ต้องการอนุมัติ 2 รายการใช่หรือไม่?',
    );
    expect(dialog?.querySelector('.spg-modal-ok')?.textContent).toBe('อนุมัติ');
    /** @type {HTMLElement} */ (el.querySelector('.spg-modal-cancel')).click();
    await flush();
    expect(onSelectionAction).not.toHaveBeenCalled();
    expect(el.querySelector('.spg-modal')).toBeNull();

    action(el, 'approve').click();
    /** @type {HTMLElement} */ (el.querySelector('.spg-modal-ok')).click();
    await flush();
    expect(onSelectionAction).toHaveBeenCalledTimes(1);
    expect(onSelectionAction.mock.calls[0][0].rows).toEqual([rows[0], rows[1]]);
  });

  it('uses the confirm text it was given, escaped', async () => {
    const { el } = make({
      selectionActions: [{ name: 'x', label: 'X', confirm: '<b>Sure?</b>' }],
    });
    tick(el, 0);
    action(el, 'x').click();
    const text = el.querySelector('.spg-modal-text');
    expect(text?.textContent).toBe('<b>Sure?</b>');
    expect(text?.querySelector('b')).toBeNull();
    /** @type {HTMLElement} */ (el.querySelector('.spg-modal-cancel')).click();
    await flush();
  });

  it('escapes an action label and name', () => {
    const { el } = make({
      selectionActions: [{ name: 'a"b', label: '<i>go</i>' }],
    });
    tick(el, 0);
    const button = /** @type {HTMLElement} */ (el.querySelector('.spg-sel-action'));
    expect(button.textContent).toBe('<i>go</i>');
    expect(button.querySelector('i')).toBeNull();
    expect(button.dataset.action).toBe('a"b');
  });

  it('reports the rows as they are after the question, not before', async () => {
    const onSelectionAction = vi.fn();
    const { el, grid } = make({ onSelectionAction });
    tick(el, 0);
    action(el, 'approve').click();
    grid.setSelectedRows([rows[3]]); // changed while the dialog was open
    /** @type {HTMLElement} */ (el.querySelector('.spg-modal-ok')).click();
    await flush();
    expect(onSelectionAction.mock.calls[0][0].rows).toEqual([rows[3]]);
  });

  it('does not run when nothing is selected any more', async () => {
    const onSelectionAction = vi.fn();
    const { el, grid } = make({ onSelectionAction });
    tick(el, 0);
    action(el, 'approve').click();
    grid.setSelectedRows([]);
    /** @type {HTMLElement} */ (el.querySelector('.spg-modal-ok')).click();
    await flush();
    expect(onSelectionAction).not.toHaveBeenCalled();
  });

  it('stops after destroy', () => {
    const { el, grid } = make();
    tick(el, 0);
    const button = action(el, 'return');
    grid.destroy();
    expect(() => button.click()).not.toThrow();
  });
});

describe('without a header row', () => {
  it('the bar is always there with a select-all box for the page', () => {
    const { el, grid } = make({ showHeader: false, selectionActions: undefined, pageSize: 2 });
    expect(bar(el).hidden).toBe(false);
    const all = /** @type {HTMLInputElement} */ (bar(el).querySelector('input.spg-bar-all'));
    expect(bar(el).querySelector('.spg-sel-all')?.textContent).toBe('เลือกทั้งหมดในหน้านี้');
    expect(el.querySelector('.spg-sel-count')?.hasAttribute('hidden')).toBe(true);
    all.checked = true;
    all.dispatchEvent(new Event('change', { bubbles: true }));
    expect(grid.getSelectedRows()).toEqual([rows[0], rows[1]]);
    expect(all.checked).toBe(true);
    expect(el.querySelector('.spg-sel-count')?.textContent).toBe('เลือกแล้ว 2 รายการ');
    grid.setPage(2);
    expect(all.checked).toBe(false);
    expect(all.indeterminate).toBe(false);
    tick(el, 0);
    expect(all.indeterminate).toBe(true);
    grid.setPage(1);
    expect(all.checked).toBe(true);
  });

  it("'single' has no select-all box, and with the header drawn there is no bar without actions", () => {
    const single = make({ showHeader: false, selectable: 'single', selectionActions: undefined });
    expect(single.el.querySelector('.spg-selection-bar')).toBeNull();
    expect(make({ selectionActions: undefined }).el.querySelector('.spg-selection-bar')).toBeNull();
    const withActions = make({ showHeader: false, selectable: 'single' });
    expect(withActions.el.querySelector('input.spg-bar-all')).toBeNull();
    expect(bar(withActions.el).hidden).toBe(true);
  });
});

describe('option checks', () => {
  it('rejects selectionActions without selectable, an empty list, bad entries and repeated names', () => {
    expect(() => make({ selectable: undefined })).toThrow(RangeError);
    expect(() => make({ selectionActions: [] })).toThrow(TypeError);
    expect(() => make({ selectionActions: 'x' })).toThrow(TypeError);
    expect(() => make({ selectionActions: [{ name: 'a' }] })).toThrow(TypeError);
    expect(() => make({ selectionActions: [{ label: 'A' }] })).toThrow(TypeError);
    expect(() =>
      make({
        selectionActions: [
          { name: 'a', label: 'A' },
          { name: 'a', label: 'B' },
        ],
      }),
    ).toThrow(RangeError);
  });
});

describe('clearFiltersButton', () => {
  /** @param {object} [options] */
  const filtered = (options = {}) =>
    make({
      selectionActions: undefined,
      clearFiltersButton: true,
      searchable: true,
      searchColumnSelect: true,
      advancedFilter: true,
      ...options,
    });
  const button = (/** @type {HTMLElement} */ el) =>
    /** @type {HTMLButtonElement} */ (el.querySelector('.spg-clear-filters'));

  it('shows only while something filters the rows', () => {
    const { el, grid } = filtered();
    expect(button(el).hidden).toBe(true);
    grid.setFilter({ search: 'Ada' });
    expect(button(el).hidden).toBe(false);
    grid.setFilter(null);
    expect(button(el).hidden).toBe(true);
    grid.setAdvancedFilter({ key: 'dept', op: 'equals', value: 'A' });
    expect(button(el).hidden).toBe(false);
  });

  it('drops the search, the search column and the advanced filter, and keeps the sort', () => {
    const { el, grid } = filtered({
      columns: [{ key: 'name', label: 'Name', sortable: true }, columns[1]],
    });
    grid.setSort({ key: 'name', direction: 'desc' });
    grid.setSearchColumn('name');
    grid.setFilter({ search: 'A' });
    grid.setAdvancedFilter({ key: 'dept', op: 'equals', value: 'A' });
    button(el).click();
    expect(grid.getFilter()).toBeNull();
    expect(grid.getSearchColumn()).toBeNull();
    expect(grid.getAdvancedFilter()).toBeNull();
    expect(/** @type {HTMLInputElement} */ (el.querySelector('.spg-search')).value).toBe('');
    expect(grid.getSort()).toEqual({ key: 'name', direction: 'desc' });
    expect(button(el).hidden).toBe(true);
  });

  it('is named by labels.clearFilters, and absent by default', () => {
    expect(button(filtered().el).getAttribute('aria-label')).toBe(
      'ล้างทั้งหมด (คำค้นหาและตัวกรอง)',
    );
    expect(make({ selectionActions: undefined }).el.querySelector('.spg-clear-filters')).toBeNull();
  });
});

describe('the clear-search label', () => {
  it('says that only the search text is cleared', () => {
    const { el } = make({ selectionActions: undefined, searchable: true, searchButton: true });
    expect(el.querySelector('.spg-search-reset')?.getAttribute('aria-label')).toBe(
      'ล้างเฉพาะคำค้นหา',
    );
  });
});
