import { beforeEach, describe, expect, it } from 'vitest';
import { DataGrid, thaiLabels } from '../../src/index.js';

beforeEach(() => localStorage.clear());

/** @param {object} [extra] */
const make = (extra = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  new DataGrid(el, { columns: [{ key: 'a', label: 'A' }], rows: [], ...extra });
  const root = /** @type {HTMLElement} */ (el.querySelector('.dg-root'));
  return { el, root };
};
/** @param {HTMLElement} el */
const open = (el) => /** @type {HTMLButtonElement} */ (el.querySelector('.dg-columns-btn')).click();
/** @param {HTMLElement} el @param {'striped' | 'wrapped'} flag */
const sw = (el, flag) =>
  /** @type {HTMLInputElement | null} */ (
    el.querySelector(`.dg-settings input[data-flag="${flag}"]`)
  );
/** @param {HTMLElement} el */
const apply = (el) => /** @type {HTMLButtonElement} */ (el.querySelector('.dg-modal-ok')).click();

describe('stripedToggle and textWrapToggle', () => {
  it('add no toolbar button of their own, only the Settings button', () => {
    const { el } = make({ stripedToggle: true, textWrapToggle: true, searchable: true });
    expect(el.querySelector('.dg-stripe-toggle, .dg-wrap-toggle')).toBeNull();
    const group = /** @type {HTMLElement} */ (el.querySelector('.dg-input-group'));
    expect([...group.children].map((c) => c.className)).toEqual([
      'dg-search-field',
      'dg-tool-btn dg-columns-btn',
    ]);
    expect(
      make({ stripedToggle: true }).el.querySelector('.dg-toolbar > .dg-columns-btn'),
    ).not.toBeNull();
    expect(make().el.querySelector('.dg-columns-btn')).toBeNull();
  });

  it('show one switch each, only when turned on, with no column list without columnPicker', () => {
    const only = make({ stripedToggle: true }).el;
    open(only);
    expect(sw(only, 'striped')?.getAttribute('role')).toBe('switch');
    expect(sw(only, 'wrapped')).toBeNull();
    expect(only.querySelector('.dg-settings-list, .dg-settings-sort')).toBeNull();
    const both = make({ stripedToggle: true, textWrapToggle: true, columnPicker: true }).el;
    open(both);
    expect(sw(both, 'striped')).not.toBeNull();
    expect(sw(both, 'wrapped')).not.toBeNull();
    expect(both.querySelector('.dg-settings-list')).not.toBeNull();
  });

  it('start from the current look and change it only on Apply', () => {
    const { el, root } = make({ stripedToggle: true, textWrapToggle: true, striped: true });
    open(el);
    expect(sw(el, 'striped')?.checked).toBe(true);
    expect(sw(el, 'wrapped')?.checked).toBe(true);
    sw(el, 'striped')?.click();
    sw(el, 'wrapped')?.click();
    expect(root.classList.contains('dg-striped')).toBe(true);
    expect(root.classList.contains('dg-nowrap')).toBe(false);
    apply(el);
    expect(root.classList.contains('dg-striped')).toBe(false);
    expect(root.classList.contains('dg-nowrap')).toBe(true);
    open(el);
    expect(sw(el, 'striped')?.checked).toBe(false);
    expect(sw(el, 'wrapped')?.checked).toBe(false);
  });

  it('is discarded by Cancel', () => {
    const { el, root } = make({ stripedToggle: true });
    open(el);
    sw(el, 'striped')?.click();
    /** @type {HTMLButtonElement} */ (el.querySelector('.dg-modal-cancel')).click();
    expect(root.classList.contains('dg-striped')).toBe(false);
  });

  it('starts unwrapped with textWrap: false', () => {
    const { el, root } = make({ textWrap: false, textWrapToggle: true });
    expect(root.classList.contains('dg-nowrap')).toBe(true);
    open(el);
    expect(sw(el, 'wrapped')?.checked).toBe(false);
  });

  it('use the Thai labels and escape custom ones', () => {
    const thai = make({ stripedToggle: true, textWrapToggle: true, labels: thaiLabels }).el;
    open(thai);
    const names = [...thai.querySelectorAll('.dg-settings-switch span')].map((s) => s.textContent);
    expect(names).toEqual(['แถวสลับสี', 'ตัดข้อความขึ้นบรรทัดใหม่']);
    expect(thai.querySelector('.dg-settings-heading')?.textContent).toBe('การแสดงผล');
    const odd = make({ stripedToggle: true, labels: { stripedRows: '<b>S</b>' } }).el;
    open(odd);
    expect(odd.querySelector('.dg-settings-switch span')?.textContent).toBe('<b>S</b>');
    expect(odd.querySelector('.dg-settings b')).toBeNull();
  });

  it('remember the choice under the storage keys, ahead of the options, and ignore bad values', () => {
    const options = {
      stripedToggle: true,
      striped: true,
      stripedStorageKey: 'po',
      textWrapToggle: true,
      textWrapStorageKey: 'po',
    };
    const first = make(options);
    open(first.el);
    sw(first.el, 'striped')?.click();
    sw(first.el, 'wrapped')?.click();
    apply(first.el);
    expect(localStorage.getItem('datagrid:striped:po')).toBe('false');
    expect(localStorage.getItem('datagrid:textWrap:po')).toBe('false');
    const again = make(options);
    expect(again.root.classList.contains('dg-striped')).toBe(false);
    expect(again.root.classList.contains('dg-nowrap')).toBe(true);
    for (const bad of ['"yes"', '{oops', '1']) {
      localStorage.setItem('datagrid:striped:po', bad);
      localStorage.setItem('datagrid:textWrap:po', bad);
      const view = make(options);
      expect(view.root.classList.contains('dg-striped')).toBe(true);
      expect(view.root.classList.contains('dg-nowrap')).toBe(false);
    }
  });

  it('save nothing without a key, or when the choice did not change', () => {
    const { el } = make({ stripedToggle: true, textWrapToggle: true });
    open(el);
    sw(el, 'striped')?.click();
    apply(el);
    expect(localStorage.length).toBe(0);
    const keyed = make({ stripedToggle: true, stripedStorageKey: 'po' }).el;
    open(keyed);
    apply(keyed);
    expect(localStorage.length).toBe(0);
  });
});
