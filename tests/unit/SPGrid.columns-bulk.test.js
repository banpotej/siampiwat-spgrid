import { beforeEach, describe, expect, it } from 'vitest';
import { SPGrid, thaiLabels } from '../../src/index.js';

beforeEach(() => localStorage.clear());

/** @param {object} [extra] */
const make = (extra = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new SPGrid(el, {
    columns: [
      { key: 'a', label: 'A' },
      { key: 'b', label: 'B' },
      { key: 'c', label: 'C' },
    ],
    rows: [],
    columnPicker: true,
    ...extra,
  });
  /** @type {HTMLButtonElement} */ (el.querySelector('.spg-columns-btn')).click();
  return { el, grid };
};
/** @param {HTMLElement} el @param {'all' | 'none'} which */
const bulk = (el, which) =>
  /** @type {HTMLButtonElement} */ (el.querySelector(`[data-bulk="${which}"]`)).click();
/** @param {HTMLElement} el */
const checked = (el) =>
  [...el.querySelectorAll('.spg-columns-item input')].map((i) => /** @type {any} */ (i).checked);

describe('select all / clear all in the settings modal', () => {
  it('Clear all keeps the first column and Apply hides the rest', () => {
    const { el, grid } = make();
    bulk(el, 'none');
    expect(checked(el)).toEqual([true, false, false]);
    /** @type {HTMLButtonElement} */ (el.querySelector('.spg-modal-ok')).click();
    expect(grid.getHiddenColumns()).toEqual(['b', 'c']);
  });

  it('Select all shows every column again', () => {
    const { el } = make({ hiddenColumns: ['b', 'c'] });
    bulk(el, 'all');
    expect(checked(el)).toEqual([true, true, true]);
  });

  it('is labelled in English and Thai', () => {
    const en = make();
    expect(en.el.querySelector('[data-bulk="all"]')?.textContent).toBe('Select all');
    expect(en.el.querySelector('[data-bulk="none"]')?.textContent).toBe('Clear all');
    const th = make({ labels: thaiLabels });
    expect(th.el.querySelector('[data-bulk="all"]')?.textContent).toBe('เลือกทั้งหมด');
  });
});
