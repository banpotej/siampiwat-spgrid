import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SPGrid } from '../../src/index.js';

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'role', label: 'Role' },
  { key: 'city', label: 'City' },
  { key: 'ops', actions: [{ name: 'open', label: 'Open' }] },
];
const rows = [{ name: 'Ada', role: 'Engineer', city: 'London' }];

beforeEach(() => localStorage.clear());

/** @param {object} [extra] */
const make = (extra = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new SPGrid(el, { columns, rows, reorderableColumns: true, ...extra });
  return { el, grid };
};
/** @param {HTMLElement} el */
const heads = (el) => [...el.querySelectorAll('th')].map((th) => th.dataset.key);
/** @param {HTMLElement} el @param {string} key */
const th = (el, key) => /** @type {HTMLElement} */ (el.querySelector(`th[data-key="${key}"]`));
/** @param {Element} target @param {string} type @param {object} [init] */
const fire = (target, type, init = {}) =>
  target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, ...init }));
/** @param {HTMLElement} el @param {string} onto */
const mockBox = (el, onto) =>
  vi
    .spyOn(th(el, onto), 'getBoundingClientRect')
    .mockReturnValue(/** @type {DOMRect} */ ({ left: 100, width: 100 }));
/** @param {HTMLElement} el @param {string} key @param {string} onto @param {number} clientX */
const dragOnto = (el, key, onto, clientX) => {
  mockBox(el, onto);
  fire(th(el, key), 'dragstart');
  fire(th(el, onto), 'dragover', { clientX });
  fire(th(el, onto), 'drop', { clientX });
  fire(th(el, key), 'dragend');
};

describe('reorderableColumns', () => {
  it('makes header cells draggable and focusable only when switched on', () => {
    const { el } = make();
    expect(th(el, 'role').getAttribute('draggable')).toBe('true');
    expect(th(el, 'role').getAttribute('tabindex')).toBe('0');
    const off = make({ reorderableColumns: false }).el;
    expect(off.querySelector('th[draggable]')).toBeNull();
    expect(th(off, 'role').hasAttribute('tabindex')).toBe(false);
  });

  it('moves a column before or after the one it is dropped on, by which half is hit', () => {
    const { el, grid } = make();
    const spy = vi.fn();
    grid.on('columnOrderChange', spy);
    dragOnto(el, 'city', 'name', 120);
    expect(heads(el)).toEqual(['city', 'name', 'role', 'ops']);
    dragOnto(el, 'city', 'role', 180);
    expect(heads(el)).toEqual(['name', 'role', 'city', 'ops']);
    expect(grid.getColumnOrder()).toEqual(['name', 'role', 'city', 'ops']);
    expect(spy).toHaveBeenLastCalledWith(['name', 'role', 'city', 'ops']);
    expect(spy).toHaveBeenCalledTimes(2);
    // body cells follow the header
    dragOnto(el, 'city', 'name', 120);
    expect(
      [...el.querySelectorAll('tbody td')].map((td) => td.textContent?.trim()).slice(0, 3),
    ).toEqual(['London', 'Ada', 'Engineer']);
  });

  it('does nothing when a column is dropped on itself, and marks the landing edge while dragging', () => {
    const { el, grid } = make();
    const spy = vi.fn();
    grid.on('columnOrderChange', spy);
    mockBox(el, 'role');
    fire(th(el, 'name'), 'dragstart');
    expect(th(el, 'name').classList.contains('spg-dragging')).toBe(true);
    fire(th(el, 'role'), 'dragover', { clientX: 190 });
    expect(th(el, 'role').classList.contains('spg-drop-after')).toBe(true);
    fire(th(el, 'role'), 'dragover', { clientX: 110 });
    expect(th(el, 'role').classList.contains('spg-drop-before')).toBe(true);
    expect(th(el, 'role').classList.contains('spg-drop-after')).toBe(false);
    fire(th(el, 'name'), 'dragend');
    expect(el.querySelector('.spg-dragging, .spg-drop-before')).toBeNull();
    dragOnto(el, 'name', 'name', 150);
    expect(spy).not.toHaveBeenCalled();
  });

  it('never starts a drag from a resize handle', () => {
    const { el } = make({ resizableColumns: true });
    const handle = /** @type {HTMLElement} */ (th(el, 'role').querySelector('.spg-resize'));
    fire(handle, 'pointerdown', { button: 0 });
    const start = new MouseEvent('dragstart', { bubbles: true, cancelable: true });
    handle.dispatchEvent(start);
    expect(start.defaultPrevented).toBe(true);
    expect(th(el, 'role').classList.contains('spg-dragging')).toBe(false);
  });

  it('moves the focused header with Alt+Left / Alt+Right and keeps focus on it', () => {
    const { el } = make();
    /** @param {string} key @param {object} [init] */
    const press = (key, init = { altKey: true }) =>
      th(el, 'role').dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }),
      );
    th(el, 'role').focus();
    press('ArrowRight');
    expect(heads(el)).toEqual(['name', 'city', 'role', 'ops']);
    expect(document.activeElement).toBe(th(el, 'role'));
    press('ArrowLeft');
    press('ArrowLeft');
    expect(heads(el)).toEqual(['role', 'name', 'city', 'ops']);
    press('ArrowLeft'); // already first
    expect(heads(el)).toEqual(['role', 'name', 'city', 'ops']);
    press('ArrowRight', { altKey: false });
    expect(heads(el)).toEqual(['role', 'name', 'city', 'ops']);
  });

  it('keeps the order through sorting', () => {
    const { el, grid } = make();
    grid.setColumnOrder(['city', 'name']);
    grid.setSort({ key: 'name', direction: 'asc' });
    expect(heads(el)).toEqual(['city', 'name', 'role', 'ops']);
  });
});

describe('setColumnOrder / getColumnOrder', () => {
  it('rejects an unknown key, follows with the columns left out and does not emit when unchanged', () => {
    const { grid } = make();
    const spy = vi.fn();
    grid.on('columnOrderChange', spy);
    expect(() => grid.setColumnOrder(['nope'])).toThrow(RangeError);
    grid.setColumnOrder(['ops']);
    expect(grid.getColumnOrder()).toEqual(['ops', 'name', 'role', 'city']);
    grid.setColumnOrder(['ops']);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('calls onColumnOrderChange and works with the option off', () => {
    const onColumnOrderChange = vi.fn();
    const { grid } = make({ reorderableColumns: false, onColumnOrderChange });
    grid.setColumnOrder(['city']);
    expect(onColumnOrderChange).toHaveBeenCalledWith(['city', 'name', 'role', 'ops']);
  });

  it('is put back by resetView()', () => {
    const { el, grid } = make();
    grid.setColumnOrder(['city']);
    grid.resetView();
    expect(heads(el)).toEqual(['name', 'role', 'city', 'ops']);
  });
});

describe('columnOrderStorageKey', () => {
  it('saves the order and restores it for the next grid', () => {
    make({ columnOrderStorageKey: 'po' }).grid.setColumnOrder(['city', 'role']);
    expect(JSON.parse(localStorage.getItem('spgrid:columnOrder:po') ?? 'null')).toEqual([
      'city',
      'role',
      'name',
      'ops',
    ]);
    const { el } = make({ columnOrderStorageKey: 'po' });
    expect(heads(el)).toEqual(['city', 'role', 'name', 'ops']);
  });

  it('ignores stale or broken saved data and saves nothing without a key', () => {
    localStorage.setItem('spgrid:columnOrder:po', JSON.stringify(['gone', 'role']));
    expect(heads(make({ columnOrderStorageKey: 'po' }).el)).toEqual([
      'role',
      'name',
      'city',
      'ops',
    ]);
    localStorage.setItem('spgrid:columnOrder:bad', '{oops');
    expect(heads(make({ columnOrderStorageKey: 'bad' }).el)).toEqual([
      'name',
      'role',
      'city',
      'ops',
    ]);
    localStorage.clear();
    make().grid.setColumnOrder(['city']);
    expect(localStorage.length).toBe(0);
  });

  it('writes the original order on resetView()', () => {
    const { grid } = make({ columnOrderStorageKey: 'po' });
    grid.setColumnOrder(['city']);
    grid.resetView();
    expect(JSON.parse(localStorage.getItem('spgrid:columnOrder:po') ?? 'null')).toEqual([
      'name',
      'role',
      'city',
      'ops',
    ]);
  });
});
