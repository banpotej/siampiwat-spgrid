import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SPGrid, thaiLabels } from '../../src/index.js';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const columns = [{ key: 'name', label: 'Name' }];
const rows = [{ name: 'Ada' }, { name: 'Grace' }, { name: 'Eve' }];

/** @param {object} [options] */
const make = (options = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new SPGrid(el, {
    columns,
    rows,
    searchable: true,
    searchButton: true,
    ...options,
  });
  return { el, grid };
};
/** @param {HTMLElement} el */
const input = (el) => /** @type {HTMLInputElement} */ (el.querySelector('input.spg-search'));
/** @param {HTMLElement} el */
const button = (el) => /** @type {HTMLButtonElement} */ (el.querySelector('.spg-search-submit'));
/** @param {HTMLElement} el @param {string} value */
const type = (el, value) => {
  input(el).value = value;
  input(el).dispatchEvent(new Event('input', { bubbles: true }));
};
/** @param {HTMLElement} el */
const shown = (el) => el.querySelectorAll('tbody tr:not(.spg-empty)').length;
/** @param {HTMLElement} el @param {KeyboardEventInit} init */
const key = (el, init) => {
  const e = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  input(el).dispatchEvent(e);
  return e;
};

describe('search button', () => {
  it('is rendered only with searchButton (and searchable), as an icon-only type=button named by the label', () => {
    expect(button(make().el).type).toBe('button');
    expect(button(make().el).getAttribute('aria-label')).toBe('Search');
    expect(button(make().el).title).toBe('Search');
    expect(button(make({ labels: thaiLabels }).el).getAttribute('aria-label')).toBe('ค้นหา');
    const escaped = button(make({ labels: { searchButton: '<b>"Go"</b>' } }).el);
    expect(escaped.getAttribute('aria-label')).toBe('<b>"Go"</b>');
    expect(escaped.querySelector('b')).toBeNull();
    expect(button(make({ searchButton: false }).el)).toBeNull();
    expect(button(make({ searchable: false }).el)).toBeNull();
  });

  it('shows only a decorative icon in both buttons; the name and tooltip come from the label', () => {
    const { el } = make();
    for (const [selector, icon, name] of [
      ['.spg-search-submit', 'search', 'Search'],
      ['.spg-search-reset', 'close', 'Clear search'],
    ]) {
      const btn = /** @type {HTMLElement} */ (el.querySelector(selector));
      const mark = /** @type {HTMLElement} */ (btn.firstElementChild);
      expect(btn.children).toHaveLength(1);
      expect(mark.getAttribute('data-icon')).toBe(icon);
      expect(mark.getAttribute('aria-hidden')).toBe('true');
      expect(btn.textContent).toBe('');
      expect(btn.getAttribute('aria-label')).toBe(name);
      expect(btn.title).toBe(name);
    }
  });

  it('does not filter while typing, however long you wait', () => {
    const { el } = make();
    type(el, 'ada');
    vi.advanceTimersByTime(5000);
    expect(shown(el)).toBe(3);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('filters when the button is clicked', () => {
    const { el, grid } = make();
    type(el, 'ada');
    button(el).click();
    expect(shown(el)).toBe(1);
    expect(grid.getFilter()).toEqual({ search: 'ada' });
  });

  it('filters on Enter, ignores other keys and IME composition', () => {
    const { el } = make();
    type(el, 'ada');
    key(el, { key: 'a' });
    key(el, { key: 'Enter', isComposing: true });
    expect(shown(el)).toBe(3);
    const e = key(el, { key: 'Enter' });
    expect(e.defaultPrevented).toBe(true);
    expect(shown(el)).toBe(1);
  });

  it('emits filterChange once per submit and not again for the same text', () => {
    const { el, grid } = make();
    const spy = vi.fn();
    grid.on('filterChange', spy);
    type(el, 'ada');
    button(el).click();
    button(el).click();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('empty text submitted clears the filter; the clear button still clears at once', () => {
    const { el } = make();
    type(el, 'ada');
    button(el).click();
    type(el, '');
    expect(shown(el)).toBe(1);
    button(el).click();
    expect(shown(el)).toBe(3);

    type(el, 'eve');
    button(el).click();
    /** @type {HTMLElement} */ (el.querySelector('.spg-search-clear')).click();
    expect(shown(el)).toBe(3);
    expect(input(el).value).toBe('');
  });

  it('has an icon-only Clear search button that empties the box and the filter at once', () => {
    const { el, grid } = make();
    const reset = /** @type {HTMLButtonElement} */ (el.querySelector('.spg-search-reset'));
    expect(reset.type).toBe('button');
    expect(reset.getAttribute('aria-label')).toBe('Clear search');
    type(el, 'ada');
    button(el).click();
    expect(shown(el)).toBe(1);
    reset.click();
    expect(shown(el)).toBe(3);
    expect(input(el).value).toBe('');
    expect(grid.getFilter()).toBeNull();
    expect(document.activeElement).toBe(input(el));
  });

  it('Clear search puts the column select back on all columns', () => {
    const { el, grid } = make({
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'role', label: 'Role' },
      ],
      rows: [{ name: 'Ada', role: 'Eve' }],
      searchColumnSelect: true,
    });
    const select = /** @type {HTMLSelectElement} */ (el.querySelector('select.spg-search-column'));
    select.value = 'role';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(grid.getSearchColumn()).toBe('role');
    /** @type {HTMLButtonElement} */ (el.querySelector('.spg-search-reset')).click();
    expect(grid.getSearchColumn()).toBeNull();
    expect(select.value).toBe('');
  });

  it('shows no Clear search button without searchButton and uses labels.clear for its name', () => {
    expect(make({ searchButton: false }).el.querySelector('.spg-search-reset')).toBeNull();
    const { el } = make({ labels: thaiLabels });
    expect(el.querySelector('.spg-search-reset')?.getAttribute('aria-label')).toBe('ล้างการค้นหา');
  });

  it('keeps the clear button in step with the text while typing', () => {
    const { el } = make();
    const clear = /** @type {HTMLElement} */ (el.querySelector('.spg-search-clear'));
    expect(clear.hidden).toBe(true);
    type(el, 'a');
    expect(clear.hidden).toBe(false);
  });

  it('Enter does nothing without searchButton (typing stays live)', () => {
    const { el } = make({ searchButton: false });
    type(el, 'ada');
    vi.advanceTimersByTime(250);
    expect(shown(el)).toBe(1);
    expect(key(el, { key: 'Enter' }).defaultPrevented).toBe(false);
  });

  it('removes its listeners on destroy', () => {
    const { el, grid } = make();
    const toolbar = /** @type {HTMLElement} */ (el.querySelector('.spg-toolbar'));
    const remove = vi.spyOn(toolbar, 'removeEventListener');
    grid.destroy();
    expect(remove.mock.calls.map(([t]) => t)).toContain('keydown');
  });
});

describe('input group', () => {
  it('puts the select, the search box and the buttons in one group, in that order', () => {
    const { el } = make({ searchColumnSelect: true });
    const group = /** @type {HTMLElement} */ (el.querySelector('.spg-toolbar > .spg-input-group'));
    expect([...group.children].map((c) => c.className)).toEqual([
      'spg-search-column',
      'spg-search-field',
      'spg-search-submit',
      'spg-search-reset',
    ]);
  });

  it('is just the search box when nothing else is on', () => {
    const { el } = make({ searchButton: false });
    const group = /** @type {HTMLElement} */ (el.querySelector('.spg-input-group'));
    expect([...group.children].map((c) => c.className)).toEqual(['spg-search-field']);
  });
});
