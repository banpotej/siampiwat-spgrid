import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SPGrid, thaiLabels } from '../../src/index.js';

beforeEach(() => localStorage.clear());

/** @type {import('../../src/types.js').Column[]} */
const columns = [
  { key: 'name', label: 'Project' },
  { key: 'dept', label: 'Department' },
  { key: 'status', label: 'Status', type: 'badge', badges: { ok: { label: 'On track' } } },
];
const rows = [
  { id: 1, name: 'Mobile', dept: 'Product', status: 'ok' },
  { id: 2, name: 'Search', dept: 'Engineering', status: 'ok' },
  { id: 3, name: 'Pricing', dept: 'Product', status: 'risk' },
  { id: 4, name: 'API', dept: 'Engineering', status: 'ok' },
  { id: 5, name: '<b>Evil</b>', dept: '<i>X</i>', status: 'ok' },
];

/** @param {object} [extra] */
const make = (extra = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new SPGrid(el, { columns, rows, rowKey: 'id', ...extra });
  return { el, grid };
};
/** @param {HTMLElement} el */
const headers = (el) =>
  [...el.querySelectorAll('tr.spg-group-row')].map((tr) => ({
    level: Number(/** @type {HTMLElement} */ (tr).dataset.level),
    text: tr.textContent?.replace(/\s+/g, ' ').trim(),
  }));
/** @param {HTMLElement} el */
const names = (el) =>
  [...el.querySelectorAll('tbody tr[data-row-index] td:first-child')].map((td) => td.textContent);
/** @param {HTMLElement} el @param {number} i */
const toggle = (el, i) =>
  /** @type {HTMLButtonElement} */ (el.querySelectorAll('.spg-group-toggle')[i]);

describe('groupBy option', () => {
  it('draws no group rows by default', () => {
    const { el, grid } = make();
    expect(el.querySelector('.spg-group-row')).toBeNull();
    expect(grid.getGroupBy()).toEqual([]);
  });

  it('puts a header with the value and row count before each group, in group order', () => {
    const { el } = make({ groupBy: ['dept'] });
    expect(headers(el).map((h) => h.text)).toEqual([
      '<i>X</i> (1)',
      'Engineering (2)',
      'Product (2)',
    ]);
    expect(names(el)).toEqual(['<b>Evil</b>', 'Search', 'API', 'Mobile', 'Pricing']);
  });

  it('escapes the value and shows a badge column the way its cells show it', () => {
    const { el } = make({ groupBy: ['status'] });
    expect(el.querySelector('tr.spg-group-row .spg-badge')?.textContent).toBe('On track');
    expect(make({ groupBy: ['dept'] }).el.querySelector('tr.spg-group-row i')).toBeNull();
  });

  it('nests a second level inside the first', () => {
    const { el } = make({ groupBy: ['dept', 'status'], rows: rows.slice(0, 4) });
    expect(headers(el)).toEqual([
      { level: 0, text: 'Engineering (2)' },
      { level: 1, text: 'On track (2)' },
      { level: 0, text: 'Product (2)' },
      { level: 1, text: 'On track (1)' },
      { level: 1, text: 'risk (1)' },
    ]);
  });

  it('keeps the sort inside each group and follows it on a group column', () => {
    const { el } = make({ groupBy: ['dept'], defaultSort: { key: 'name', direction: 'desc' } });
    expect(names(el)).toEqual(['<b>Evil</b>', 'Search', 'API', 'Pricing', 'Mobile']);
    const desc = make({ groupBy: ['dept'], defaultSort: { key: 'dept', direction: 'desc' } });
    expect(headers(desc.el).map((h) => h.text?.split(' ')[0])).toEqual([
      'Product',
      'Engineering',
      '<i>X</i>',
    ]);
  });

  it('can group by a hidden column', () => {
    const { el } = make({ groupBy: ['dept'], hiddenColumns: ['dept'] });
    expect(headers(el)).toHaveLength(3);
    expect(el.querySelector('th[data-key="dept"]')).toBeNull();
  });

  it('spans the header row over every column', () => {
    const { el } = make({ groupBy: ['dept'] });
    expect(el.querySelector('tr.spg-group-row td')?.getAttribute('colspan')).toBe('3');
  });

  it('throws for an unknown, repeated or non-array groupBy', () => {
    expect(() => make({ groupBy: ['nope'] })).toThrow(RangeError);
    expect(() => make({ groupBy: ['dept', 'dept'] })).toThrow(RangeError);
    expect(() => make({ groupBy: 'dept' })).toThrow(TypeError);
  });
});

describe('collapsing a group', () => {
  it('hides its rows on click, flips aria-expanded and expands again', () => {
    const { el } = make({ groupBy: ['dept'] });
    expect(toggle(el, 1).getAttribute('aria-expanded')).toBe('true');
    toggle(el, 1).click();
    expect(toggle(el, 1).getAttribute('aria-expanded')).toBe('false');
    expect(names(el)).toEqual(['<b>Evil</b>', 'Mobile', 'Pricing']);
    toggle(el, 1).click();
    expect(names(el)).toHaveLength(5);
    expect(toggle(el, 1).getAttribute('aria-expanded')).toBe('true');
  });

  it('keeps focus on the button that was used', () => {
    const { el } = make({ groupBy: ['dept'] });
    toggle(el, 2).focus();
    toggle(el, 2).click();
    expect(document.activeElement).toBe(toggle(el, 2));
  });

  it('hides inner groups with an outer one and keeps a group collapsed across renders', () => {
    const { el, grid } = make({ groupBy: ['dept', 'status'], rows: rows.slice(0, 4) });
    toggle(el, 0).click();
    expect(headers(el).map((h) => h.level)).toEqual([0, 0, 1, 1]);
    grid.setRows([...rows.slice(0, 4)]);
    expect(headers(el).map((h) => h.level)).toEqual([0, 0, 1, 1]);
  });

  it('activates the row that is shown, whatever collapsed before it', () => {
    const onRowActivate = vi.fn();
    const { el } = make({ groupBy: ['dept'], onRowActivate, rows: rows.slice(0, 4) });
    toggle(el, 0).click(); // Engineering: Search and API go
    const row = /** @type {HTMLElement} */ (el.querySelector('tbody tr[data-row-index]'));
    row.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(onRowActivate.mock.calls[0][0].row.name).toBe('Mobile');
    expect(el.querySelector('tr.spg-group-row')?.hasAttribute('tabindex')).toBe(false);
  });

  it('is not triggered by a click elsewhere in the table', () => {
    const { el } = make({ groupBy: ['dept'] });
    /** @type {HTMLElement} */ (el.querySelector('tbody tr[data-row-index] td')).click();
    expect(names(el)).toHaveLength(5);
  });
});

describe('getGroupBy and setGroupBy', () => {
  it('changes the grouping and returns a copy', () => {
    const { el, grid } = make();
    grid.setGroupBy(['status', 'dept']);
    expect(grid.getGroupBy()).toEqual(['status', 'dept']);
    expect(headers(el).filter((h) => h.level === 0)).toHaveLength(2);
    grid.getGroupBy().push('x');
    expect(grid.getGroupBy()).toEqual(['status', 'dept']);
    grid.setGroupBy([]);
    expect(el.querySelector('.spg-group-row')).toBeNull();
  });

  it('validates, and a failed call changes nothing', () => {
    const { el, grid } = make({ groupBy: ['dept'] });
    expect(() => grid.setGroupBy(['nope'])).toThrow(RangeError);
    expect(() => grid.setGroupBy(['dept', 'dept'])).toThrow(RangeError);
    expect(grid.getGroupBy()).toEqual(['dept']);
    expect(headers(el)).toHaveLength(3);
  });

  it('does nothing after destroy', () => {
    const { grid } = make();
    grid.destroy();
    expect(() => grid.setGroupBy(['dept'])).not.toThrow();
  });

  it('goes back to page 1', () => {
    const { grid } = make({ pageSize: 2 });
    grid.setPage(2);
    grid.setGroupBy(['dept']);
    expect(grid.getPage()).toBe(1);
  });

  it('puts group order before paging, so a group can run onto the next page', () => {
    const { el, grid } = make({ groupBy: ['dept'], pageSize: 2 });
    expect(names(el)).toEqual(['<b>Evil</b>', 'Search']);
    expect(headers(el).map((h) => h.text)).toEqual(['<i>X</i> (1)', 'Engineering (1)']);
    grid.setPage(2);
    expect(headers(el).map((h) => h.text)).toEqual(['Engineering (1)', 'Product (1)']);
  });
});

describe('groupByChange event', () => {
  it('fires with the new columns, for onGroupByChange and on(), only when they change', () => {
    const onGroupByChange = vi.fn();
    const { grid } = make({ onGroupByChange });
    const seen = vi.fn();
    grid.on('groupByChange', seen);
    grid.setGroupBy(['dept']);
    grid.setGroupBy(['dept']);
    expect(onGroupByChange).toHaveBeenCalledTimes(1);
    expect(onGroupByChange).toHaveBeenCalledWith(['dept']);
    expect(seen).toHaveBeenCalledWith(['dept']);
  });
});

describe('groupByStorageKey', () => {
  it('saves the columns, restores them over the option, and remembers ungrouping', () => {
    make({ groupByStorageKey: 'k' }).grid.setGroupBy(['status']);
    expect(localStorage.getItem('spgrid:groupBy:k')).toBe('["status"]');
    const restored = make({ groupByStorageKey: 'k', groupBy: ['dept'] });
    expect(restored.grid.getGroupBy()).toEqual(['status']);
    restored.grid.setGroupBy([]);
    expect(make({ groupByStorageKey: 'k', groupBy: ['dept'] }).grid.getGroupBy()).toEqual([]);
  });

  it('drops saved columns that are gone and ignores bad data', () => {
    localStorage.setItem('spgrid:groupBy:k', '["gone","dept","dept"]');
    expect(make({ groupByStorageKey: 'k' }).grid.getGroupBy()).toEqual(['dept']);
    localStorage.setItem('spgrid:groupBy:k', '"dept"');
    const bad = make({ groupByStorageKey: 'k', groupBy: ['status'] });
    expect(bad.grid.getGroupBy()).toEqual(['status']);
  });
});

describe('resetView', () => {
  it('goes back to the groupBy option', () => {
    const { grid } = make({ groupBy: ['dept'] });
    grid.setGroupBy(['status']);
    grid.resetView();
    expect(grid.getGroupBy()).toEqual(['dept']);
  });
});

describe('search in a grouped grid', () => {
  it('marks matches in the rows, not in the group headers', () => {
    const { grid, el } = make({ groupBy: ['dept'] });
    grid.setFilter({ search: 'Product' });
    expect(el.querySelector('tbody tr[data-row-index] mark')).not.toBeNull();
    expect(el.querySelector('tr.spg-group-row mark')).toBeNull();
    expect(headers(el).map((h) => h.text)).toEqual(['Product (2)']);
  });
});

describe('groupByToggle', () => {
  /** @param {HTMLElement} el */
  const open = (el) =>
    /** @type {HTMLButtonElement} */ (el.querySelector('.spg-columns-btn')).click();
  /** @param {HTMLElement} el */
  const selects = (el) =>
    /** @type {HTMLSelectElement[]} */ ([...el.querySelectorAll('select[data-group]')]);
  /** @param {HTMLElement} el */
  const apply = (el) =>
    /** @type {HTMLButtonElement} */ (el.querySelector('.spg-modal-ok')).click();
  /** @param {HTMLSelectElement} select @param {string} value */
  const pick = (select, value) => {
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  };

  it('turns the Settings button on and adds the section; without it there is none', () => {
    const { el } = make({ groupByToggle: true });
    open(el);
    expect(el.querySelector('.spg-settings-heading')?.textContent).toBe('Grouping');
    expect(selects(el)).toHaveLength(2);
    expect([...selects(el)[0].options].map((o) => o.textContent)).toEqual([
      'No grouping',
      'Project',
      'Department',
      'Status',
    ]);
    const plain = make({ columnPicker: true });
    open(plain.el);
    expect(selects(plain.el)).toHaveLength(0);
  });

  it('keeps the second select off until the first is set, and a column to one level', () => {
    const { el } = make({ groupByToggle: true });
    open(el);
    const [first, second] = selects(el);
    expect([first.value, second.value, second.disabled]).toEqual(['', '', true]);
    pick(first, 'dept');
    expect(second.disabled).toBe(false);
    expect([...second.options].find((o) => o.value === 'dept')?.disabled).toBe(true);
  });

  it('applies the chosen columns, and Cancel changes nothing', () => {
    const { el, grid } = make({ groupByToggle: true });
    open(el);
    pick(selects(el)[0], 'dept');
    pick(selects(el)[1], 'status');
    /** @type {HTMLButtonElement} */ (el.querySelector('.spg-modal-cancel')).click();
    expect(grid.getGroupBy()).toEqual([]);
    open(el);
    pick(selects(el)[0], 'dept');
    pick(selects(el)[1], 'status');
    apply(el);
    expect(grid.getGroupBy()).toEqual(['dept', 'status']);
  });

  it('empties the inner level when the outer one is cleared', () => {
    const { el, grid } = make({ groupByToggle: true, groupBy: ['dept', 'status'] });
    open(el);
    const [first, second] = selects(el);
    expect([first.value, second.value]).toEqual(['dept', 'status']);
    pick(first, '');
    expect(second.value).toBe('');
    apply(el);
    expect(grid.getGroupBy()).toEqual([]);
  });

  it('offers a select for every level set from code', () => {
    const { el, grid } = make({ groupByToggle: true, groupBy: ['dept', 'status', 'name'] });
    open(el);
    expect(selects(el).map((s) => s.value)).toEqual(['dept', 'status', 'name']);
    apply(el);
    expect(grid.getGroupBy()).toEqual(['dept', 'status', 'name']);
  });

  it('formats the count in a group header with labels.groupCount', () => {
    const groupCount = vi.fn((/** @type {number} */ n) => `${n} งาน <b>`);
    const { el } = make({ groupBy: ['dept'], labels: { groupCount } });
    expect(headers(el).map((h) => h.text)).toEqual([
      '<i>X</i> 1 งาน <b>',
      'Engineering 2 งาน <b>',
      'Product 2 งาน <b>',
    ]);
    expect(groupCount).toHaveBeenCalledWith(
      2,
      expect.objectContaining({ level: 0, column: 'dept' }),
    );
    expect(el.querySelector('.spg-group-count b')).toBeNull();
  });

  it('tells labels.groupCount the level and the rows of each group', () => {
    const seen =
      /** @type {{ level: number, column: string, count: number, rows: number }[]} */ ([]);
    make({
      groupBy: ['dept', 'status'],
      labels: {
        groupCount: (
          /** @type {number} */ count,
          /** @type {import('../../src/labelTypes.js').GroupInfo} */ { level, column, rows },
        ) => {
          seen.push({ level, column, count, rows: rows.length });
          return String(count);
        },
      },
    });
    expect(seen.some((g) => g.level === 0 && g.column === 'dept')).toBe(true);
    expect(seen.some((g) => g.level === 1 && g.column === 'status')).toBe(true);
    expect(seen.every((g) => g.rows === g.count)).toBe(true);
  });

  it('uses the Thai labels', () => {
    const { el } = make({ groupByToggle: true, labels: thaiLabels });
    open(el);
    expect(el.querySelector('.spg-settings-heading')?.textContent).toBe('การจัดกลุ่ม');
    expect(selects(el)[0].options[0].textContent).toBe('ไม่จัดกลุ่ม');
  });
});

describe('groupToggleAllButton', () => {
  /** @param {HTMLElement} el */
  const allButton = (el) =>
    /** @type {HTMLButtonElement | null} */ (el.querySelector('.spg-group-all'));
  /** @param {HTMLElement} el */
  const openStates = (el) =>
    [...el.querySelectorAll('.spg-group-toggle')].map((b) => b.getAttribute('aria-expanded'));

  it('is not rendered unless the option is on', () => {
    const { el } = make({ groupBy: ['dept'] });
    expect(allButton(el)).toBeNull();
  });

  it('is hidden while ungrouped and shown once the rows are grouped', () => {
    const { el, grid } = make({ groupToggleAllButton: true });
    expect(allButton(el)?.hidden).toBe(true);
    grid.setGroupBy(['dept']);
    expect(allButton(el)?.hidden).toBe(false);
    grid.setGroupBy([]);
    expect(allButton(el)?.hidden).toBe(true);
  });

  it('collapses every group, then expands every group, renaming itself', () => {
    const { el } = make({ groupBy: ['dept', 'status'], groupToggleAllButton: true });
    const button = /** @type {HTMLButtonElement} */ (allButton(el));
    expect(button.getAttribute('aria-label')).toBe('Collapse all');
    expect(button.querySelector('[data-icon]')?.getAttribute('data-icon')).toBe('unfold_less');
    button.click();
    expect(headers(el).map((h) => h.level)).toEqual([0, 0, 0]);
    expect(names(el)).toEqual([]);
    expect(openStates(el)).toEqual(['false', 'false', 'false']);
    expect(allButton(el)?.getAttribute('aria-label')).toBe('Expand all');
    expect(allButton(el)?.querySelector('[data-icon]')?.getAttribute('data-icon')).toBe(
      'unfold_more',
    );
    allButton(el)?.click();
    expect(headers(el).length).toBeGreaterThan(2);
    expect(names(el)).toHaveLength(5);
    expect(allButton(el)?.getAttribute('aria-label')).toBe('Collapse all');
  });

  it('collapses the rest when only some groups are collapsed', () => {
    const { el } = make({ groupBy: ['dept'], groupToggleAllButton: true });
    toggle(el, 0).click();
    expect(allButton(el)?.getAttribute('aria-label')).toBe('Collapse all');
    allButton(el)?.click();
    expect(openStates(el)).toEqual(['false', 'false', 'false']);
  });

  it('uses the Thai labels', () => {
    const { el } = make({ groupBy: ['dept'], groupToggleAllButton: true, labels: thaiLabels });
    expect(allButton(el)?.getAttribute('aria-label')).toBe('ย่อทุกกลุ่ม');
    allButton(el)?.click();
    expect(allButton(el)?.getAttribute('aria-label')).toBe('ขยายทุกกลุ่ม');
  });
});
