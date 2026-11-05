import { describe, expect, it } from 'vitest';
import { SPGrid } from '../../src/index.js';
import { matchRanges } from '../../src/core/highlight.js';

describe('matchRanges', () => {
  it('finds each word, ignoring case, and merges overlapping or touching ranges', () => {
    expect(matchRanges('Hello World', ['hello', 'world'])).toEqual([
      [0, 5],
      [6, 11],
    ]);
    expect(matchRanges('abcd', ['ab', 'bc'])).toEqual([[0, 3]]);
    expect(matchRanges('abab', ['ab'])).toEqual([[0, 4]]);
  });

  it('is accent-safe like the search, and returns nothing when there is nothing to mark', () => {
    expect(matchRanges('Café', ['café'])).toEqual([[0, 4]]);
    expect(matchRanges('Cafe', ['x'])).toEqual([]);
    expect(matchRanges('', ['a'])).toEqual([]);
    expect(matchRanges('abc', [])).toEqual([]);
  });

  it('matches Thai text', () => {
    expect(matchRanges('ใบสั่งซื้อ', ['สั่ง'])).toEqual([[2, 6]]);
  });
});

describe('highlightSearch', () => {
  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'city', label: 'City' },
    { key: 'actions', actions: [{ name: 'view', label: 'View' }] },
  ];
  const rows = [
    { name: 'Alice Cooper', city: 'Alicante' },
    { name: 'Bob', city: 'Bangkok' },
  ];
  /** @param {object} [extra] */
  const make = (extra = {}) => {
    const el = document.createElement('div');
    const grid = new SPGrid(el, { columns, rows, ...extra });
    return { el, grid };
  };
  /** @param {HTMLElement} el */
  const marks = (el) => [...el.querySelectorAll('mark.spg-mark')].map((m) => m.textContent);

  it('marks the search text in every matching cell, case-insensitively', () => {
    const { el, grid } = make();
    expect(marks(el)).toEqual([]);
    grid.setFilter({ search: 'ALI' });
    expect(marks(el)).toEqual(['Ali', 'Ali']);
    grid.setFilter({ search: 'ali cooper' });
    expect(marks(el)).toEqual(['Ali', 'Cooper', 'Ali']);
    grid.setFilter(null);
    expect(marks(el)).toEqual([]);
  });

  it('only marks the chosen column, and never the action buttons', () => {
    const { el, grid } = make();
    grid.setFilter({ search: 'a' });
    expect(el.querySelector('.spg-action mark')).toBeNull();
    grid.setSearchColumn('city');
    grid.setFilter({ search: 'ali' });
    expect(marks(el)).toEqual(['Ali']);
    expect(el.querySelector('td:nth-child(2) mark')?.textContent).toBe('Ali');
    expect(el.querySelector('td:nth-child(1) mark')).toBeNull();
  });

  it('marks text inside typed cells without breaking their markup', () => {
    const el = document.createElement('div');
    const grid = new SPGrid(el, {
      columns: [
        { key: 'status', label: 'S', type: 'badge', badges: { Done: { tone: 'success' } } },
      ],
      rows: [{ status: 'Done' }],
    });
    grid.setFilter({ search: 'on' });
    expect(el.querySelector('.spg-badge mark')?.textContent).toBe('on');
    expect(el.querySelector('.spg-badge')?.textContent).toBe('Done');
  });

  it('never parses cell text as HTML', () => {
    const el = document.createElement('div');
    const grid = new SPGrid(el, {
      columns: [{ key: 'a', label: 'A' }],
      rows: [{ a: '<b>bold</b>' }],
    });
    grid.setFilter({ search: 'bold' });
    expect(el.querySelector('td b')).toBeNull();
    expect(el.querySelector('td')?.textContent).toBe('<b>bold</b>');
    expect(marks(el)).toEqual(['bold']);
  });

  it('can be turned off with highlightSearch: false', () => {
    const { el, grid } = make({ highlightSearch: false });
    grid.setFilter({ search: 'ali' });
    expect(el.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(marks(el)).toEqual([]);
  });
});
