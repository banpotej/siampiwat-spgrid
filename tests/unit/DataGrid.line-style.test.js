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
  /** @type {HTMLSelectElement | null} */ (el.querySelector('select[data-choice="lineStyle"]'));
/** @param {HTMLElement} el @param {string} style */
const choose = (el, style) => {
  open(el);
  /** @type {HTMLSelectElement} */ (select(el)).value = style;
  /** @type {HTMLButtonElement} */ (el.querySelector('.dg-modal-ok')).click();
};
const CLASSES = ['dg-line-solid', 'dg-line-dashed', 'dg-line-dotted'];
/** @param {HTMLElement} root */
const styles = (root) => CLASSES.filter((c) => root.classList.contains(c));

describe('lineStyle option', () => {
  it.each([
    ['default', []],
    ['solid', ['dg-line-solid']],
    ['dashed', ['dg-line-dashed']],
    ['dotted', ['dg-line-dotted']],
  ])('%s sets the root class %j', (lineStyle, expected) => {
    expect(styles(make({ lineStyle }).root)).toEqual(expected);
  });

  it('leaves the style to the theme by default and throws a RangeError for an unknown one', () => {
    expect(styles(make().root)).toEqual([]);
    expect(() => make({ lineStyle: 'wavy' })).toThrow(RangeError);
  });

  it('works beside gridLines', () => {
    const { root } = make({ lineStyle: 'dotted', gridLines: 'both' });
    expect(root.classList.contains('dg-line-dotted')).toBe(true);
    expect(root.classList.contains('dg-bordered')).toBe(true);
  });
});

describe('lineStyleToggle', () => {
  it('adds the Settings button and a select with the four styles, on the current one', () => {
    const { el } = make({ lineStyleToggle: true, lineStyle: 'solid' });
    open(el);
    const field = /** @type {HTMLSelectElement} */ (select(el));
    expect([...field.options].map((o) => o.value)).toEqual([
      'default',
      'solid',
      'dashed',
      'dotted',
    ]);
    expect(field.value).toBe('solid');
  });

  it('is absent without the option, and independent of the grid lines select', () => {
    const plain = make({ gridLinesToggle: true });
    open(plain.el);
    expect(select(plain.el)).toBeNull();
    const both = make({ gridLinesToggle: true, lineStyleToggle: true });
    open(both.el);
    expect(both.el.querySelectorAll('select[data-choice]')).toHaveLength(2);
  });

  it('changes the style only on Apply, one style at a time, and Cancel discards', () => {
    const { el, root } = make({ lineStyleToggle: true });
    open(el);
    /** @type {HTMLSelectElement} */ (select(el)).value = 'dotted';
    /** @type {HTMLButtonElement} */ (el.querySelector('.dg-modal-cancel')).click();
    expect(styles(root)).toEqual([]);
    choose(el, 'dotted');
    expect(styles(root)).toEqual(['dg-line-dotted']);
    choose(el, 'solid');
    expect(styles(root)).toEqual(['dg-line-solid']);
    choose(el, 'default');
    expect(styles(root)).toEqual([]);
  });

  it('applies both selects together', () => {
    const { el, root } = make({ lineStyleToggle: true, gridLinesToggle: true });
    open(el);
    /** @type {HTMLSelectElement} */ (select(el)).value = 'solid';
    /** @type {HTMLSelectElement} */ (el.querySelector('select[data-choice="gridLines"]')).value =
      'vertical';
    /** @type {HTMLButtonElement} */ (el.querySelector('.dg-modal-ok')).click();
    expect(styles(root)).toEqual(['dg-line-solid']);
    expect(root.classList.contains('dg-lines-vertical')).toBe(true);
  });

  it('is remembered under lineStyleStorageKey, ahead of the option; a bad saved value is ignored', () => {
    choose(make({ lineStyleToggle: true, lineStyleStorageKey: 'po' }).el, 'dotted');
    expect(JSON.parse(localStorage.getItem('datagrid:lineStyle:po') ?? 'null')).toBe('dotted');
    expect(styles(make({ lineStyle: 'solid', lineStyleStorageKey: 'po' }).root)).toEqual([
      'dg-line-dotted',
    ]);
    localStorage.setItem('datagrid:lineStyle:bad', JSON.stringify('wavy'));
    expect(styles(make({ lineStyle: 'solid', lineStyleStorageKey: 'bad' }).root)).toEqual([
      'dg-line-solid',
    ]);
  });

  it('has Thai texts in thaiLabels and can be relabelled', () => {
    const thai = make({ lineStyleToggle: true, labels: thaiLabels });
    open(thai.el);
    expect(select(thai.el)?.closest('label')?.querySelector('span')?.textContent).toBe(
      'ประเภทเส้นตาราง',
    );
    expect([...(select(thai.el)?.options ?? [])].map((o) => o.textContent)).toEqual([
      'ค่าเริ่มต้น',
      'เส้นทึบ',
      'เส้นประ',
      'เส้นจุด',
    ]);
    const custom = make({ lineStyleToggle: true, labels: { lineStyleDotted: 'Dots' } });
    open(custom.el);
    expect(select(custom.el)?.options[3].textContent).toBe('Dots');
  });
});
