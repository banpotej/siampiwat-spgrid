import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataGrid, thaiLabels } from '../../src/index.js';

beforeEach(() => localStorage.clear());

/** @param {object} [extra] */
const make = (extra = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new DataGrid(el, {
    columns: [
      { key: 'a', label: 'A' },
      { key: 'b', label: 'B' },
    ],
    rows: [],
    columnPicker: true,
    stripedToggle: true,
    ...extra,
  });
  return { el, grid };
};
/** @param {HTMLElement} el */
const open = (el) => /** @type {HTMLButtonElement} */ (el.querySelector('.dg-columns-btn')).click();
/** @param {HTMLElement} el */
const x = (el) =>
  /** @type {HTMLButtonElement | null} */ (el.querySelector('.dg-settings .dg-modal-x'));

describe('the settings modal close button', () => {
  it('is a button named "Close" (or the Thai label) on the card', () => {
    const { el } = make();
    open(el);
    expect(x(el)?.getAttribute('aria-label')).toBe('Close');
    expect(x(el)?.type).toBe('button');
    expect(x(el)?.closest('.dg-modal-box')).toBe(el.querySelector('.dg-settings'));
    const thai = make({ labels: thaiLabels });
    open(thai.el);
    expect(x(thai.el)?.getAttribute('aria-label')).toBe('ปิด');
    const custom = make({ labels: { close: 'Dismiss' } });
    open(custom.el);
    expect(x(custom.el)?.getAttribute('aria-label')).toBe('Dismiss');
  });

  it('closes the modal like Cancel: nothing changes, focus goes back to the Settings button', () => {
    const { el, grid } = make();
    const onColumns = vi.fn();
    grid.on('columnsChange', onColumns);
    const button = /** @type {HTMLButtonElement} */ (el.querySelector('.dg-columns-btn'));
    button.focus();
    open(el);
    /** @type {HTMLInputElement} */ (el.querySelector('.dg-columns-item input')).click(); // hide a column...
    /** @type {HTMLInputElement} */ (el.querySelector('input[data-flag="striped"]')).click();
    /** @type {HTMLButtonElement} */ (x(el)).click(); // ...and close without applying
    expect(el.querySelector('.dg-modal')).toBeNull();
    expect(onColumns).not.toHaveBeenCalled();
    expect(grid.getHiddenColumns()).toEqual([]);
    expect(el.querySelector('.dg-root')?.classList.contains('dg-striped')).toBe(false);
    expect(document.activeElement).toBe(button);
  });

  it('does not take the first focus and is the last stop of the Tab ring', () => {
    const { el } = make();
    open(el);
    expect(document.activeElement).toBe(el.querySelector('.dg-columns-item input'));
    const items = [
      ...el.querySelectorAll('.dg-settings input, .dg-settings select, .dg-settings button'),
    ];
    expect(items.at(-1)).toBe(x(el));
  });

  it('is not on the built-in confirm dialog', () => {
    const { el } = make({ resetButton: true });
    open(el);
    /** @type {HTMLButtonElement} */ (el.querySelector('.dg-settings-reset')).click();
    expect(el.querySelector('.dg-modal')).not.toBeNull();
    expect(el.querySelector('.dg-modal-x')).toBeNull();
  });
});
