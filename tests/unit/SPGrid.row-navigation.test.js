import { afterEach, describe, expect, it, vi } from 'vitest';
import { SPGrid } from '../../src/index.js';

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'ops', actions: [{ name: 'open', label: 'Open' }] },
];
const rows = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}` }));

/** @param {object} [options] */
const make = (options = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new SPGrid(el, { columns, rows, rowKey: 'id', onRowActivate: () => {}, ...options });
  return { el, grid };
};
/** @param {HTMLElement} el */
const trs = (el) =>
  /** @type {HTMLElement[]} */ ([...el.querySelectorAll('tbody tr[data-row-index]')]);
/** @param {HTMLElement} el */
const stops = (el) => trs(el).filter((tr) => tr.getAttribute('tabindex') === '0');
/** @param {HTMLElement} target @param {string} key @param {KeyboardEventInit} [init] */
const press = (target, key, init = {}) => {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  target.dispatchEvent(event);
  return event;
};
/** @returns {string | null | undefined} */
const focusedName = () => document.activeElement?.closest('tr')?.children[0]?.textContent;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('roving tabindex', () => {
  it('gives the rows a single Tab stop: the first, the others -1', () => {
    const { el } = make();
    expect(stops(el)).toEqual([trs(el)[0]]);
    expect(
      trs(el)
        .slice(1)
        .every((tr) => tr.getAttribute('tabindex') === '-1'),
    ).toBe(true);
  });

  it('applies to selectable rows without onRowActivate, and to neither without both options', () => {
    const selectable = make({ onRowActivate: undefined, selectable: true });
    expect(stops(selectable.el).length).toBe(1);
    expect(trs(selectable.el)[0].classList.contains('spg-focusable')).toBe(true);
    expect(trs(selectable.el)[0].classList.contains('spg-activatable')).toBe(false);
    const plain = make({ onRowActivate: undefined });
    expect(trs(plain.el)[0].hasAttribute('tabindex')).toBe(false);
  });

  it('moves the stop to the row that gets focus, by click or Tab', () => {
    const { el } = make();
    trs(el)[3].focus();
    expect(stops(el)).toEqual([trs(el)[3]]);
    /** @type {HTMLElement} */ (trs(el)[5].querySelector('button')).focus();
    expect(stops(el)).toEqual([trs(el)[5]]);
  });

  it('keeps the stop on the same position after a redraw, and clamps it into range', () => {
    const { el, grid } = make({ pageSize: 10 });
    trs(el)[4].focus();
    grid.setSort({ key: 'name', direction: 'desc' });
    expect(stops(el)).toEqual([trs(el)[4]]);
    grid.setFilter({ search: 'Row 2' }); // 'Row 2', 'Row 20'..'Row 25' = 7 rows
    grid.setFilter({ search: 'Row 25' });
    expect(trs(el).length).toBe(1);
    expect(stops(el)).toEqual([trs(el)[0]]);
  });

  it('is not applied in the calendar view', () => {
    const { el } = make({
      calendar: { start: 'at' },
      rows: [{ id: 1, name: 'A', at: '2026-11-12T10:00' }],
    });
    expect(el.querySelector('tbody')).toBeNull();
  });
});

describe('arrow keys', () => {
  it('Down and Up move focus between rows', () => {
    const { el } = make();
    trs(el)[0].focus();
    expect(press(trs(el)[0], 'ArrowDown').defaultPrevented).toBe(true);
    expect(focusedName()).toBe('Row 2');
    press(/** @type {HTMLElement} */ (document.activeElement), 'ArrowDown');
    press(/** @type {HTMLElement} */ (document.activeElement), 'ArrowUp');
    expect(focusedName()).toBe('Row 2');
    expect(stops(el)).toEqual([trs(el)[1]]);
  });

  it('stops at the first and last row of the page', () => {
    const { el } = make({ pageSize: 5 });
    trs(el)[0].focus();
    press(trs(el)[0], 'ArrowUp');
    expect(focusedName()).toBe('Row 1');
    trs(el)[4].focus();
    press(trs(el)[4], 'ArrowDown');
    expect(focusedName()).toBe('Row 5');
  });

  it('Home, End, PageDown and PageUp jump', () => {
    const { el } = make();
    trs(el)[3].focus();
    press(trs(el)[3], 'End');
    expect(focusedName()).toBe('Row 25');
    press(/** @type {HTMLElement} */ (document.activeElement), 'Home');
    expect(focusedName()).toBe('Row 1');
    press(/** @type {HTMLElement} */ (document.activeElement), 'PageDown');
    expect(focusedName()).toBe('Row 11');
    press(/** @type {HTMLElement} */ (document.activeElement), 'PageUp');
    expect(focusedName()).toBe('Row 1');
  });

  it('works from the selection checkbox too', () => {
    const { el } = make({ selectable: true });
    const box = /** @type {HTMLElement} */ (trs(el)[0].querySelector('input.spg-select'));
    box.focus();
    press(box, 'ArrowDown');
    expect(document.activeElement).toBe(trs(el)[1]);
  });

  it('leaves keys alone inside other controls, and with a modifier', () => {
    const { el } = make();
    const button = /** @type {HTMLElement} */ (trs(el)[0].querySelector('button'));
    button.focus();
    expect(press(button, 'ArrowDown').defaultPrevented).toBe(false);
    expect(press(trs(el)[0], 'ArrowDown', { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(press(trs(el)[0], 'ArrowDown', { altKey: true }).defaultPrevented).toBe(false);
    expect(press(trs(el)[0], 'x').defaultPrevented).toBe(false);
  });

  it('skips group header rows', () => {
    const { el } = make({ groupBy: ['name'], pageSize: 3 });
    const first = trs(el)[0];
    first.focus();
    press(first, 'ArrowDown');
    expect(document.activeElement?.hasAttribute('data-row-index')).toBe(true);
    expect(document.activeElement).toBe(trs(el)[1]);
  });

  it('still activates with Enter from the focused row', () => {
    const onRowActivate = vi.fn();
    const { el } = make({ onRowActivate });
    trs(el)[0].focus();
    press(trs(el)[0], 'ArrowDown');
    press(/** @type {HTMLElement} */ (document.activeElement), 'Enter');
    expect(onRowActivate.mock.calls[0][0].row.id).toBe(2);
  });

  it('stops after destroy', () => {
    const { el, grid } = make();
    const first = trs(el)[0];
    grid.destroy();
    expect(press(first, 'ArrowDown').defaultPrevented).toBe(false);
  });
});
