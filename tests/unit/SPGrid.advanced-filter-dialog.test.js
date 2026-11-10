import { afterEach, describe, expect, it } from 'vitest';
import { SPGrid, thaiLabels } from '../../src/index.js';

/** @type {import('../../src/types.js').Column[]} */
const columns = [
  { key: 'name', label: 'Name' },
  { key: 'amount', label: 'Amount', type: 'number' },
  { key: 'due', label: 'Due', type: 'date' },
  {
    key: 'status',
    label: 'Status',
    options: [{ value: 'open', label: 'Open <b>' }, 'done', 'void'],
  },
  { key: 'active', label: 'Active', type: 'boolean' },
  { key: 'ops', actions: [{ name: 'view', label: 'View' }] },
];
const rows = [
  { name: 'Ada', amount: 500, due: '2026-11-01', status: 'open', active: true },
  { name: 'Grace', amount: 1500, due: '2026-11-15', status: 'done', active: false },
  { name: 'Eve', amount: 2500, due: '2026-11-20', status: 'void', active: true },
];

afterEach(() => {
  document.body.innerHTML = '';
});

const make = (options = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new SPGrid(el, {
    columns,
    rows,
    advancedFilter: true,
    filterSummary: true,
    ...options,
  });
  return { el, grid };
};
/** @param {HTMLElement} el */
const button = (el) => /** @type {HTMLButtonElement} */ (el.querySelector('button.spg-advfilter'));
/** @param {HTMLElement} el */
const modalOf = (el) => {
  button(el).click();
  const modal = el.querySelector('.spg-modal');
  if (!(modal instanceof HTMLElement)) throw new Error('modal did not open');
  return modal;
};
/** @param {Element} node @param {string} value */
const pick = (node, value) => {
  const select = /** @type {HTMLSelectElement} */ (node);
  select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
};
/** @param {HTMLElement} modal */
const rowsOf = (modal) => [...modal.querySelectorAll('.spg-adv-row:not(.spg-adv-kept)')];
/** @param {Element} row @param {string} selector @param {string} value */
const fill = (row, selector, value) => {
  const input = /** @type {HTMLInputElement} */ (row.querySelector(selector));
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
};
/** @param {HTMLElement} modal */
const apply = (modal) =>
  /** @type {HTMLButtonElement} */ (modal.querySelector('.spg-modal-ok')).click();
/** @param {HTMLElement} el */
const names = (el) =>
  [...el.querySelectorAll('tbody tr td:nth-child(1)')].map((c) => c.textContent);

describe('the Advanced filter button', () => {
  it('is not rendered by default', () => {
    const el = document.createElement('div');
    new SPGrid(el, { columns, rows });
    expect(el.querySelector('.spg-advfilter')).toBeNull();
  });

  it('renders as a tool button with a filter icon and the label', () => {
    const { el } = make({ labels: { advancedFilter: 'Filter+' } });
    expect(button(el).getAttribute('aria-label')).toBe('Filter+');
    expect(button(el).querySelector('svg')).not.toBeNull();
    expect(button(el).getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('takes data-active while a filter is set, however it was set', () => {
    const { el, grid } = make();
    expect(button(el).hasAttribute('data-active')).toBe(false);
    grid.setAdvancedFilter({ key: 'amount', op: 'gt', value: 1000 });
    expect(button(el).hasAttribute('data-active')).toBe(true);
    grid.resetView();
    expect(button(el).hasAttribute('data-active')).toBe(false);
  });

  it('stops listening after destroy()', () => {
    const { el, grid } = make();
    const btn = button(el);
    grid.destroy();
    btn.click();
    expect(el.querySelector('.spg-modal')).toBeNull();
  });
});

describe('the condition modal', () => {
  it('opens with one empty row, a match select and the data columns as fields', () => {
    const { el } = make();
    const modal = modalOf(el);
    expect(button(el).getAttribute('aria-expanded')).toBe('true');
    expect(modal.querySelector('.spg-modal-title')?.textContent).toBe('Advanced filter');
    expect(rowsOf(modal)).toHaveLength(1);
    const fields = [...modal.querySelectorAll('.spg-adv-field option')].map((o) => o.textContent);
    expect(fields).toEqual(['Name', 'Amount', 'Due', 'Status', 'Active']);
    const checked = () => modal.querySelector('.spg-adv-logic:checked');
    expect(/** @type {HTMLInputElement} */ (checked()).value).toBe('and');
  });

  it('changes the operators and the value box with the column', () => {
    const { el } = make();
    const modal = modalOf(el);
    const [row] = rowsOf(modal);
    expect(row.querySelector('.spg-adv-input')?.getAttribute('type')).toBe('text');
    pick(/** @type {Element} */ (row.querySelector('.spg-adv-field')), 'amount');
    expect(row.querySelector('.spg-adv-input')?.getAttribute('type')).toBe('number');
    pick(/** @type {Element} */ (row.querySelector('.spg-adv-field')), 'due');
    expect(row.querySelector('.spg-adv-input')?.getAttribute('type')).toBe('date');
    pick(/** @type {Element} */ (row.querySelector('.spg-adv-op')), 'between');
    expect(row.querySelectorAll('.spg-adv-from, .spg-adv-to')).toHaveLength(2);
    pick(/** @type {Element} */ (row.querySelector('.spg-adv-op')), 'isEmpty');
    expect(row.querySelector('.spg-adv-value')?.children).toHaveLength(0);
  });

  it('shows an enum as escaped checkboxes, a boolean with no value box', () => {
    const { el } = make();
    const [row] = rowsOf(modalOf(el));
    pick(/** @type {Element} */ (row.querySelector('.spg-adv-field')), 'status');
    const ops = [...row.querySelectorAll('.spg-adv-op option')].map((o) => o.getAttribute('value'));
    expect(ops).toEqual(['in', 'notIn', 'isEmpty', 'isNotEmpty']);
    expect(row.querySelectorAll('.spg-adv-check')).toHaveLength(3);
    expect(row.querySelector('.spg-adv-checks')?.textContent).toContain('Open <b>');
    expect(row.querySelector('.spg-adv-checks b')).toBeNull();
    pick(/** @type {Element} */ (row.querySelector('.spg-adv-field')), 'active');
    expect(row.querySelector('.spg-adv-op')?.querySelector('option')?.getAttribute('value')).toBe(
      'isTrue',
    );
    expect(row.querySelector('.spg-adv-value')?.children).toHaveLength(0);
  });

  it('Apply sets the filter from the rows, with all / any', () => {
    const { el, grid } = make();
    const modal = modalOf(el);
    const [first] = rowsOf(modal);
    pick(/** @type {Element} */ (first.querySelector('.spg-adv-field')), 'amount');
    pick(/** @type {Element} */ (first.querySelector('.spg-adv-op')), 'gt');
    fill(first, '.spg-adv-input', '1000');
    /** @type {HTMLButtonElement} */ (modal.querySelector('.spg-adv-add')).click();
    const second = rowsOf(modal)[1];
    pick(/** @type {Element} */ (second.querySelector('.spg-adv-field')), 'status');
    /** @type {HTMLInputElement} */ (second.querySelector('.spg-adv-check[value="void"]')).checked =
      true;
    /** @type {HTMLInputElement} */ (modal.querySelector('.spg-adv-logic[value="or"]')).click();
    apply(modal);
    expect(el.querySelector('.spg-modal')).toBeNull();
    expect(grid.getAdvancedFilter()).toEqual({
      logic: 'or',
      conditions: [
        { key: 'amount', op: 'gt', value: 1000 },
        { key: 'status', op: 'in', value: ['void'] },
      ],
    });
    expect(names(el)).toEqual(['Grace', 'Eve']);
    expect(button(el).getAttribute('aria-expanded')).toBe('false');
  });

  it('shows the current filter again, with a between and an enum', () => {
    const { el, grid } = make();
    grid.setAdvancedFilter({
      logic: 'or',
      conditions: [
        { key: 'amount', op: 'between', value: [100, 900] },
        { key: 'status', op: 'in', value: ['done'] },
      ],
    });
    const modal = modalOf(el);
    expect(
      /** @type {HTMLInputElement} */ (modal.querySelector('.spg-adv-logic:checked')).value,
    ).toBe('or');
    const [a, b] = rowsOf(modal);
    expect(/** @type {HTMLInputElement} */ (a.querySelector('.spg-adv-from')).value).toBe('100');
    expect(/** @type {HTMLInputElement} */ (a.querySelector('.spg-adv-to')).value).toBe('900');
    expect(
      /** @type {HTMLInputElement} */ (b.querySelector('.spg-adv-check[value="done"]')).checked,
    ).toBe(true);
    apply(modal);
    expect(/** @type {any} */ (grid.getAdvancedFilter()).conditions).toHaveLength(2);
  });

  it('a blank row filters nothing; removing every row and applying clears the filter', () => {
    const { el, grid } = make();
    grid.setAdvancedFilter({ key: 'amount', op: 'gt', value: 1000 });
    const modal = modalOf(el);
    /** @type {HTMLButtonElement} */ (modal.querySelector('.spg-adv-remove')).click();
    expect(rowsOf(modal)).toHaveLength(0);
    apply(modal);
    expect(grid.getAdvancedFilter()).toBeNull();
    const again = modalOf(el);
    expect(rowsOf(again)).toHaveLength(1);
    apply(again);
    expect(grid.getAdvancedFilter()).toBeNull();
  });

  it('Clear all empties the rows', () => {
    const { el, grid } = make();
    grid.setAdvancedFilter({
      logic: 'and',
      conditions: [
        { key: 'amount', op: 'gt', value: 1 },
        { key: 'name', op: 'contains', value: 'a' },
      ],
    });
    const modal = modalOf(el);
    /** @type {HTMLButtonElement} */ (modal.querySelector('.spg-adv-clear')).click();
    expect(rowsOf(modal)).toHaveLength(1);
    apply(modal);
    expect(grid.getAdvancedFilter()).toBeNull();
  });

  it('Cancel, Esc and the backdrop change nothing', () => {
    const { el, grid } = make();
    grid.setAdvancedFilter({ key: 'amount', op: 'gt', value: 1000 });
    const modal = modalOf(el);
    /** @type {HTMLButtonElement} */ (modal.querySelector('.spg-adv-remove')).click();
    /** @type {HTMLButtonElement} */ (modal.querySelector('.spg-modal-cancel')).click();
    modalOf(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    modalOf(el).click();
    expect(el.querySelector('.spg-modal')).toBeNull();
    expect(grid.getAdvancedFilter()).toEqual({ key: 'amount', op: 'gt', value: 1000 });
  });

  it('keeps a nested group, shows it as a line, and lets it be removed', () => {
    const { el, grid } = make();
    /** @type {any} */
    const nested = {
      logic: 'or',
      conditions: [
        { key: 'name', op: 'equals', value: 'Ada' },
        { key: 'name', op: 'equals', value: 'Eve' },
      ],
    };
    /** @type {any} */
    const own = { key: 'amount', op: 'gt', value: 1000 };
    grid.setAdvancedFilter({ logic: 'and', conditions: [own, nested] });
    const modal = modalOf(el);
    expect(modal.querySelector('.spg-adv-kept-text')?.textContent).toBe(
      'Name is Ada or Name is Eve',
    );
    expect(rowsOf(modal)).toHaveLength(1);
    apply(modal);
    expect(grid.getAdvancedFilter()).toEqual({ logic: 'and', conditions: [own, nested] });
    const again = modalOf(el);
    /** @type {HTMLButtonElement} */ (again.querySelector('.spg-adv-kept .spg-adv-remove')).click();
    apply(again);
    expect(grid.getAdvancedFilter()).toEqual({ logic: 'and', conditions: [own] });
  });

  it('uses the labels option and reads in Thai', () => {
    const { el } = make({ labels: thaiLabels });
    const modal = modalOf(el);
    expect(modal.querySelector('.spg-modal-title')?.textContent).toBe('ตัวกรองขั้นสูง');
    expect(modal.querySelector('.spg-adv-add')?.textContent).toContain('เพิ่มเงื่อนไข');
    const ops = [...modal.querySelectorAll('.spg-adv-op option')].map((o) => o.textContent);
    expect(ops).toContain('มีคำว่า');
  });

  it('unbinding on destroy() removes an open modal', () => {
    const { el, grid } = make();
    modalOf(el);
    grid.destroy();
    expect(el.querySelector('.spg-modal')).toBeNull();
  });
});

describe('the condition modal, ease of use', () => {
  it('joins the cards with "and" / "or" and follows the all / any switch', () => {
    const { el } = make();
    const modal = modalOf(el);
    /** @type {HTMLButtonElement} */ (modal.querySelector('.spg-adv-add')).click();
    const [first, second] = /** @type {HTMLElement[]} */ (rowsOf(modal));
    expect(first.dataset.join).toBeUndefined();
    expect(second.dataset.join).toBe('and');
    /** @type {HTMLInputElement} */ (modal.querySelector('.spg-adv-logic[value="or"]')).click();
    expect(second.dataset.join).toBe('or');
    /** @type {HTMLButtonElement} */ (first.querySelector('.spg-adv-remove')).click();
    expect(second.dataset.join).toBeUndefined();
  });

  it('says and / or in Thai too', () => {
    const { el } = make({ labels: thaiLabels });
    const modal = modalOf(el);
    /** @type {HTMLButtonElement} */ (modal.querySelector('.spg-adv-add')).click();
    expect(/** @type {HTMLElement} */ (rowsOf(modal)[1]).dataset.join).toBe('และ');
  });

  it('shows column captions and a switch with both choices', () => {
    const { el } = make();
    const modal = modalOf(el);
    expect(modal.querySelector('.spg-adv-head')?.textContent).toBe('FieldOperatorValue');
    const choices = [...modal.querySelectorAll('.spg-adv-segment span')].map((c) => c.textContent);
    expect(choices).toEqual(['All conditions', 'Any condition']);
  });

  it('counts the rows the draft leaves while it is edited, and flags none', () => {
    const { el, grid } = make();
    const modal = modalOf(el);
    const result = /** @type {HTMLElement} */ (modal.querySelector('.spg-adv-result'));
    expect(result.textContent).toBe('Found 3 of 3');
    const [row] = rowsOf(modal);
    pick(/** @type {Element} */ (row.querySelector('.spg-adv-field')), 'amount');
    pick(/** @type {Element} */ (row.querySelector('.spg-adv-op')), 'gt');
    fill(row, '.spg-adv-input', '1000');
    expect(result.textContent).toBe('Found 2 of 3');
    expect(result.hasAttribute('data-empty')).toBe(false);
    fill(row, '.spg-adv-input', '99999');
    expect(result.textContent).toBe('Found 0 of 3');
    expect(result.hasAttribute('data-empty')).toBe(true);
    expect(grid.getAdvancedFilter()).toBeNull();
  });

  it('counts on top of the search, and in Thai', () => {
    const { el, grid } = make({ labels: thaiLabels });
    grid.setFilter({ search: 'a' });
    const modal = modalOf(el);
    expect(modal.querySelector('.spg-adv-result')?.textContent).toBe('พบ 2 จาก 3 รายการ');
  });

  it('Enter in a value box applies', () => {
    const { el, grid } = make();
    const modal = modalOf(el);
    const [row] = rowsOf(modal);
    pick(/** @type {Element} */ (row.querySelector('.spg-adv-field')), 'amount');
    pick(/** @type {Element} */ (row.querySelector('.spg-adv-op')), 'gt');
    fill(row, '.spg-adv-input', '1000');
    const input = /** @type {HTMLElement} */ (row.querySelector('.spg-adv-input'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(el.querySelector('.spg-modal')).toBeNull();
    expect(grid.getAdvancedFilter()).toEqual({
      logic: 'and',
      conditions: [{ key: 'amount', op: 'gt', value: 1000 }],
    });
  });

  it('Enter on a select does not apply', () => {
    const { el } = make();
    const modal = modalOf(el);
    const field = /** @type {HTMLElement} */ (modal.querySelector('.spg-adv-field'));
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(el.querySelector('.spg-modal')).not.toBeNull();
  });

  it("puts the cursor in the new row's field select", () => {
    const { el } = make();
    const modal = modalOf(el);
    /** @type {HTMLButtonElement} */ (modal.querySelector('.spg-adv-add')).click();
    expect(document.activeElement).toBe(rowsOf(modal)[1].querySelector('.spg-adv-field'));
  });

  it('shows enum values as toggle chips, a hint in the value boxes and a dash in a range', () => {
    const { el } = make();
    const [row] = rowsOf(modalOf(el));
    expect(row.querySelector('.spg-adv-input')?.getAttribute('placeholder')).toBe('Value');
    pick(/** @type {Element} */ (row.querySelector('.spg-adv-field')), 'status');
    expect(row.querySelectorAll('.spg-adv-chip')).toHaveLength(3);
    pick(/** @type {Element} */ (row.querySelector('.spg-adv-field')), 'due');
    pick(/** @type {Element} */ (row.querySelector('.spg-adv-op')), 'between');
    expect(row.querySelector('.spg-adv-dash')).not.toBeNull();
  });
});
