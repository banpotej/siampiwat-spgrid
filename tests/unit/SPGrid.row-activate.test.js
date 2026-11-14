import { describe, expect, it, vi } from 'vitest';
import { SPGrid } from '../../src/index.js';

const rows = Array.from({ length: 6 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}` }));
const columns = [
  { key: '_act', ariaLabel: 'Actions', actions: [{ name: 'view', label: 'View' }] },
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
];

/** @param {object} [options] */
function make(options = {}) {
  const el = document.createElement('div');
  document.body.append(el);
  const onRowActivate = vi.fn();
  const grid = new SPGrid(el, { columns, rows, rowKey: 'id', onRowActivate, ...options });
  return { el, grid, onRowActivate };
}

/** @param {HTMLElement} el @param {number} i */
const row = (el, i) => /** @type {HTMLTableRowElement} */ (el.querySelectorAll('tbody tr')[i]);
const dbl = () => new MouseEvent('dblclick', { bubbles: true });
const enter = () => new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });

describe('onRowActivate', () => {
  it('reports the double-clicked row, its key and the event', () => {
    const { el, onRowActivate } = make();
    const event = dbl();
    row(el, 2).cells[2].dispatchEvent(event);
    expect(onRowActivate).toHaveBeenCalledTimes(1);
    expect(onRowActivate).toHaveBeenCalledWith({ row: rows[2], rowKey: 3, originalEvent: event });
  });

  it('reports the right row after sorting and paging', () => {
    const { el, grid, onRowActivate } = make({ pageSize: 2 });
    grid.setSort({ key: 'id', direction: 'desc' });
    grid.setPage(2);
    row(el, 0).cells[1].dispatchEvent(dbl());
    expect(onRowActivate.mock.calls[0][0].row).toBe(rows[3]); // 6,5 | 4,3 | 2,1
  });

  it('activates a focused row on Enter, but not on other keys or from a control inside it', () => {
    const { el, onRowActivate } = make();
    row(el, 1).dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(onRowActivate).not.toHaveBeenCalled();
    /** @type {HTMLElement} */ (row(el, 1).querySelector('button')).dispatchEvent(enter());
    expect(onRowActivate).not.toHaveBeenCalled();
    const event = enter();
    row(el, 1).dispatchEvent(event);
    expect(onRowActivate.mock.calls[0][0].row).toBe(rows[1]);
    expect(event.defaultPrevented).toBe(true); // a dialog opened by the handler must not get this Enter
  });

  it('leaves buttons alone, and ignores the header and the empty state', () => {
    const { el, grid, onRowActivate } = make();
    /** @type {HTMLElement} */ (row(el, 0).querySelector('button')).dispatchEvent(dbl());
    /** @type {HTMLElement} */ (el.querySelector('thead th')).dispatchEvent(dbl());
    grid.setFilter({ search: 'nothing matches this' });
    /** @type {HTMLElement} */ (el.querySelector('tbody tr')).dispatchEvent(dbl());
    expect(onRowActivate).not.toHaveBeenCalled();
  });

  it('makes the rows focusable with a pointer cursor class, and only when the option is set', () => {
    const { el } = make();
    const tabindexes = [...el.querySelectorAll('tbody tr')].map((tr) =>
      tr.getAttribute('tabindex'),
    );
    expect(tabindexes[0]).toBe('0'); // one Tab stop for the rows (roving tabindex); the arrow keys move between them
    expect(tabindexes.slice(1).every((value) => value === '-1')).toBe(true);
    for (const tr of el.querySelectorAll('tbody tr')) {
      expect(tr.classList.contains('spg-activatable')).toBe(true);
    }
    const plain = make({ onRowActivate: undefined });
    expect(plain.el.querySelector('tbody tr')?.hasAttribute('tabindex')).toBe(false);
    plain.el.querySelector('tbody tr td')?.dispatchEvent(dbl());
    expect(plain.onRowActivate).not.toHaveBeenCalled();
  });

  it('keeps the rows focusable after the grid re-renders', () => {
    const { el, grid } = make();
    grid.setSort({ key: 'name', direction: 'desc' });
    expect(row(el, 0).getAttribute('tabindex')).toBe('0');
  });

  it('can also be followed with on(), and stops after destroy()', () => {
    const { el, grid } = make();
    const fn = vi.fn();
    const off = grid.on('rowActivate', fn);
    row(el, 0).cells[2].dispatchEvent(dbl());
    expect(fn).toHaveBeenCalledTimes(1);
    off();
    row(el, 0).cells[2].dispatchEvent(dbl());
    expect(fn).toHaveBeenCalledTimes(1);
    const tr = row(el, 0);
    grid.destroy();
    tr.dispatchEvent(dbl()); // must not throw
  });
});
