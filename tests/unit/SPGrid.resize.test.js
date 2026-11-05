import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPGrid, thaiLabels } from '../../src/index.js';

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'role', label: 'Role\nตำแหน่ง', width: '30%' },
  { key: 'ops', actions: [{ name: 'open', label: 'Open' }] },
];
const rows = [{ name: 'Ada', role: 'Engineer' }];

beforeEach(() => {
  // jsdom has no layout: give every header cell a width.
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    /** @type {DOMRect} */ ({ width: 99.4 }),
  );
});
afterEach(() => vi.restoreAllMocks());

/** @param {object} [extra] */
const make = (extra = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new SPGrid(el, { columns, rows, resizableColumns: true, ...extra });
  return { el, grid };
};
/** @param {HTMLElement} el @param {string} key */
const th = (el, key) => /** @type {HTMLElement} */ (el.querySelector(`th[data-key="${key}"]`));
/** @param {HTMLElement} el @param {string} key */
const handle = (el, key) => /** @type {HTMLElement} */ (th(el, key).querySelector('.spg-resize'));
/** @param {Element} target @param {string} type @param {object} [init] */
const fire = (target, type, init = {}) =>
  target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, ...init }));
/** @param {HTMLElement} el @param {string} key @param {number} dx */
const drag = (el, key, dx) => {
  const h = handle(el, key);
  fire(h, 'pointerdown', { clientX: 200, button: 0 });
  fire(h, 'pointermove', { clientX: 200 + dx });
  fire(h, 'pointerup', { clientX: 200 + dx });
};

describe('resizableColumns', () => {
  it('draws a labelled separator on every data column, but not on action columns or by default', () => {
    expect(make({ resizableColumns: false }).el.querySelector('.spg-resize')).toBeNull();
    const { el } = make();
    expect(el.querySelector('.spg-root')?.classList.contains('spg-resizable')).toBe(true);
    const name = handle(el, 'name');
    expect(name.getAttribute('role')).toBe('separator');
    expect(name.getAttribute('aria-orientation')).toBe('vertical');
    expect(name.getAttribute('aria-label')).toBe('Resize Name');
    expect(handle(el, 'role').getAttribute('aria-label')).toBe('Resize Role ตำแหน่ง');
    expect(th(el, 'ops').querySelector('.spg-resize')).toBeNull();
    expect(
      make({ labels: thaiLabels }).el.querySelector('.spg-resize')?.getAttribute('aria-label'),
    ).toBe('ปรับความกว้าง Name');
  });

  it('leaves the table alone until the first resize', () => {
    const { el } = make();
    expect(el.querySelector('table')?.classList.contains('spg-fixed')).toBe(false);
    expect(th(el, 'role').style.width).toBe('30%');
  });

  it('pins every column on the first drag, then widens only the dragged one and the table', () => {
    const { el } = make();
    drag(el, 'name', 40);
    const table = /** @type {HTMLElement} */ (el.querySelector('table'));
    expect(table.classList.contains('spg-fixed')).toBe(true);
    expect(th(el, 'name').style.width).toBe('140px');
    expect(th(el, 'role').style.width).toBe('100px');
    expect(th(el, 'ops').style.width).toBe('100px');
    expect(table.style.width).toBe('340px');
    drag(el, 'role', -20);
    expect(th(el, 'role').style.width).toBe('80px');
    expect(table.style.width).toBe('320px');
  });

  it('never goes below the minimum width', () => {
    const { el } = make();
    drag(el, 'name', -500);
    expect(th(el, 'name').style.width).toBe('48px');
  });

  it('ignores moves after the button is released, and non-primary buttons', () => {
    const { el } = make();
    const h = handle(el, 'name');
    fire(h, 'pointerdown', { clientX: 200, button: 2 });
    expect(el.querySelector('table')?.classList.contains('spg-fixed')).toBe(false);
    drag(el, 'name', 10);
    fire(h, 'pointermove', { clientX: 500 });
    expect(th(el, 'name').style.width).toBe('110px');
    expect(h.classList.contains('spg-resizing')).toBe(false);
  });

  it('keeps the widths through a re-render (sorting, filtering, paging)', () => {
    const { el, grid } = make();
    drag(el, 'name', 40);
    grid.setSort({ key: 'name', direction: 'asc' });
    grid.setFilter({ search: 'ada' });
    expect(th(el, 'name').style.width).toBe('140px');
    expect(el.querySelector('table')?.classList.contains('spg-fixed')).toBe(true);
    expect(/** @type {HTMLElement} */ (el.querySelector('table')).style.width).toBe('340px');
  });

  it('gives a column that was hidden during the resize a width when it comes back', () => {
    const { el, grid } = make({ columnPicker: true });
    grid.setHiddenColumns(['role']);
    drag(el, 'name', 10);
    grid.setHiddenColumns([]);
    expect(th(el, 'role').style.width).toBe('120px');
  });

  it('is not a sort control: dragging does not sort, and Enter on the handle does not either', () => {
    const { el, grid } = make();
    const spy = vi.fn();
    grid.on('sortChange', spy);
    drag(el, 'name', 20);
    fire(handle(el, 'name'), 'click');
    handle(el, 'name').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(spy).not.toHaveBeenCalled();
  });

  it('resizes with the arrow keys, Shift for bigger steps', () => {
    const { el } = make();
    /** @param {string} key @param {boolean} [shiftKey] */
    const press = (key, shiftKey = false) =>
      handle(el, 'name').dispatchEvent(
        new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }),
      );
    press('ArrowRight');
    expect(th(el, 'name').style.width).toBe('110px');
    press('ArrowRight', true);
    expect(th(el, 'name').style.width).toBe('150px');
    press('ArrowLeft');
    expect(th(el, 'name').style.width).toBe('140px');
    press('Tab');
    expect(th(el, 'name').style.width).toBe('140px');
  });

  it('removes its listeners on destroy', () => {
    const { el, grid } = make();
    const host = /** @type {HTMLElement} */ (el.querySelector('.spg-table-wrap'));
    const remove = vi.spyOn(host, 'removeEventListener');
    grid.destroy();
    expect(remove).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});

describe('columnWidthStorageKey', () => {
  beforeEach(() => localStorage.clear());
  const KEY = 'spgrid:columnWidths:po';

  it('saves the widths when a drag ends and restores them for the next grid', () => {
    const { el } = make({ columnWidthStorageKey: 'po' });
    const h = handle(el, 'name');
    fire(h, 'pointerdown', { clientX: 200, button: 0 });
    fire(h, 'pointermove', { clientX: 240 });
    expect(localStorage.getItem(KEY)).toBeNull(); // not on every move
    fire(h, 'pointerup', { clientX: 240 });
    expect(JSON.parse(localStorage.getItem(KEY) ?? 'null')).toEqual({
      name: 140,
      role: 100,
      ops: 100,
    });
    const next = make({ columnWidthStorageKey: 'po' }).el;
    expect(next.querySelector('table')?.classList.contains('spg-fixed')).toBe(true);
    expect(th(next, 'name').style.width).toBe('140px');
    expect(th(next, 'role').style.width).toBe('100px');
  });

  it('saves a keyboard resize', () => {
    const { el } = make({ columnWidthStorageKey: 'po' });
    handle(el, 'name').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );
    expect(JSON.parse(localStorage.getItem(KEY) ?? 'null').name).toBe(110);
  });

  it('ignores unusable saved data, and a column it does not know gets the fallback width', () => {
    localStorage.setItem(KEY, '{oops');
    expect(th(make({ columnWidthStorageKey: 'po' }).el, 'name').style.width).toBe('');
    localStorage.setItem(KEY, JSON.stringify({ name: 10, role: 'wide' }));
    expect(
      make({ columnWidthStorageKey: 'po' })
        .el.querySelector('table')
        ?.classList.contains('spg-fixed'),
    ).toBe(false);
    localStorage.setItem(KEY, JSON.stringify({ name: 200 }));
    const { el } = make({ columnWidthStorageKey: 'po' });
    expect(th(el, 'name').style.width).toBe('200px');
    expect(th(el, 'role').style.width).toBe('120px');
  });

  it('saves nothing without a key', () => {
    drag(make().el, 'name', 20);
    expect(localStorage.length).toBe(0);
  });
});
