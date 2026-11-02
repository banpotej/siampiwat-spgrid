import { beforeEach, describe, expect, it } from 'vitest';
import { DataGrid, thaiLabels } from '../../src/index.js';

beforeEach(() => localStorage.clear());

/** @param {object} [extra] */
const make = (extra = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  new DataGrid(el, { columns: [{ key: 'a', label: 'A' }], rows: [{ a: 1 }], ...extra });
  const root = /** @type {HTMLElement} */ (el.querySelector('.dg-root'));
  return { el, root };
};
/** @param {HTMLElement} el */
const open = (el) => /** @type {HTMLButtonElement} */ (el.querySelector('.dg-columns-btn')).click();
/** @param {HTMLElement} el */
const select = (el) =>
  /** @type {HTMLSelectElement | null} */ (el.querySelector('select[data-choice="gridLines"]'));
/** @param {HTMLElement} el */
const apply = (el) => /** @type {HTMLButtonElement} */ (el.querySelector('.dg-modal-ok')).click();
/** @param {HTMLElement} el @param {string} mode */
const choose = (el, mode) => {
  open(el);
  const field = /** @type {HTMLSelectElement} */ (select(el));
  field.value = mode;
  field.dispatchEvent(new Event('change', { bubbles: true }));
  apply(el);
};
const CLASSES = ['dg-bordered', 'dg-lines-horizontal', 'dg-lines-vertical', 'dg-lines-none'];
/** @param {HTMLElement} root */
const lines = (root) => CLASSES.filter((c) => root.classList.contains(c));

describe('gridLines option', () => {
  it.each([
    ['default', []],
    ['horizontal', ['dg-lines-horizontal']],
    ['vertical', ['dg-lines-vertical']],
    ['both', ['dg-bordered']],
    ['none', ['dg-lines-none']],
  ])('%s sets the root class %j', (gridLines, expected) => {
    expect(lines(make({ gridLines }).root)).toEqual(expected);
  });

  it('has no line class by default, and `bordered` is the same as "both"', () => {
    expect(lines(make().root)).toEqual([]);
    expect(lines(make({ bordered: true }).root)).toEqual(['dg-bordered']);
    expect(lines(make({ bordered: true, gridLines: 'none' }).root)).toEqual(['dg-lines-none']);
  });

  it('throws a RangeError for an unknown mode', () => {
    expect(() => make({ gridLines: 'diagonal' })).toThrow(RangeError);
  });
});

describe('gridLinesToggle', () => {
  it('adds the Settings button and a select with the five modes, on the current one', () => {
    const { el } = make({ gridLinesToggle: true, gridLines: 'vertical' });
    open(el);
    const field = /** @type {HTMLSelectElement} */ (select(el));
    expect([...field.options].map((o) => o.value)).toEqual([
      'default',
      'horizontal',
      'vertical',
      'both',
      'none',
    ]);
    expect(field.value).toBe('vertical');
    expect(field.closest('section')?.querySelector('.dg-settings-heading')?.textContent).toBe(
      'Display',
    );
  });

  it('is absent without the option, even with other settings', () => {
    const { el } = make({ stripedToggle: true });
    open(el);
    expect(select(el)).toBeNull();
  });

  it('changes the lines only on Apply, and Cancel discards', () => {
    const { el, root } = make({ gridLinesToggle: true });
    open(el);
    const field = /** @type {HTMLSelectElement} */ (select(el));
    field.value = 'both';
    expect(lines(root)).toEqual([]);
    /** @type {HTMLButtonElement} */ (el.querySelector('.dg-modal-cancel')).click();
    expect(lines(root)).toEqual([]);
    choose(el, 'both');
    expect(lines(root)).toEqual(['dg-bordered']);
    choose(el, 'none'); // one mode at a time
    expect(lines(root)).toEqual(['dg-lines-none']);
    choose(el, 'default');
    expect(lines(root)).toEqual([]);
    open(el);
    expect(select(el)?.value).toBe('default');
  });

  it('keeps the other switches working beside it', () => {
    const { el, root } = make({ gridLinesToggle: true, stripedToggle: true });
    open(el);
    /** @type {HTMLInputElement} */ (el.querySelector('input[data-flag="striped"]')).click();
    /** @type {HTMLSelectElement} */ (select(el)).value = 'both';
    apply(el);
    expect(root.classList.contains('dg-striped')).toBe(true);
    expect(lines(root)).toEqual(['dg-bordered']);
  });

  it('is remembered under gridLinesStorageKey, ahead of the options', () => {
    const first = make({ gridLinesToggle: true, gridLinesStorageKey: 'po' });
    choose(first.el, 'horizontal');
    expect(JSON.parse(localStorage.getItem('datagrid:gridLines:po') ?? 'null')).toBe('horizontal');
    const second = make({ gridLines: 'none', bordered: true, gridLinesStorageKey: 'po' });
    expect(lines(second.root)).toEqual(['dg-lines-horizontal']);
  });

  it('ignores a saved value that is not a mode, and saves nothing without a key', () => {
    localStorage.setItem('datagrid:gridLines:bad', JSON.stringify('diagonal'));
    expect(lines(make({ gridLines: 'both', gridLinesStorageKey: 'bad' }).root)).toEqual([
      'dg-bordered',
    ]);
    choose(make({ gridLinesToggle: true }).el, 'both');
    expect(localStorage.length).toBe(1); // only the seeded bad entry
  });

  it('has Thai texts in thaiLabels and can be relabelled', () => {
    const thai = make({ gridLinesToggle: true, labels: thaiLabels });
    open(thai.el);
    expect(
      thai.el.querySelector('label:has(select[data-choice="gridLines"]) span')?.textContent,
    ).toBe('เส้นตาราง');
    expect([...(select(thai.el)?.options ?? [])].map((o) => o.textContent)).toEqual([
      'ค่าเริ่มต้น',
      'แนวนอน',
      'แนวตั้ง',
      'ทั้งสองแนว',
      'ไม่แสดง',
    ]);
    const custom = make({
      gridLinesToggle: true,
      labels: { gridLines: 'Lines', gridLinesNone: 'Off' },
    });
    open(custom.el);
    expect(
      custom.el.querySelector('label:has(select[data-choice="gridLines"]) span')?.textContent,
    ).toBe('Lines');
    expect(select(custom.el)?.options[4].textContent).toBe('Off');
  });
});
