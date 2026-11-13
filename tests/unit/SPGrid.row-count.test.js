import { beforeEach, describe, expect, it } from 'vitest';
import { SPGrid, thaiLabels } from '../../src/index.js';

beforeEach(() => localStorage.clear());

const rows = [{ a: 'x' }, { a: 'y' }, { a: 'z' }];

/** @param {object} [extra] */
const make = (extra = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new SPGrid(el, { columns: [{ key: 'a', label: 'A' }], rows, ...extra });
  return { el, grid };
};
/** @param {HTMLElement} el */
const count = (el) => el.querySelector('.spg-count');

describe('rowCount option', () => {
  it('is off by default', () => {
    const { el } = make({ title: 'List' });
    expect(count(el)).toBeNull();
  });

  it('shows the number of rows in the toolbar, even with no title or search box', () => {
    const { el } = make({ rowCount: true });
    expect(el.querySelector('.spg-toolbar .spg-count')?.textContent).toBe('3 rows');
  });

  it('counts the rows that match the filter, not only the page', () => {
    const { el, grid } = make({ rowCount: true, pageSize: 2 });
    expect(count(el)?.textContent).toBe('3 rows');
    grid.setFilter({ search: 'x' });
    expect(count(el)?.textContent).toBe('1 row');
  });

  it('uses labels.rowCount, and Thai by default with thaiLabels', () => {
    expect(count(make({ rowCount: true, labels: thaiLabels }).el)?.textContent).toBe('3 รายการ');
    const custom = make({
      rowCount: true,
      labels: { rowCount: (/** @type {number} */ n) => `n=${n}` },
    });
    expect(count(custom.el)?.textContent).toBe('n=3');
  });

  it('follows setRows()', () => {
    const { el, grid } = make({ rowCount: true });
    grid.setRows([{ a: 'q' }]);
    expect(count(el)?.textContent).toBe('1 row');
  });

  it('escapes nothing into markup: the text is set as text', () => {
    const { el } = make({ rowCount: true, labels: { rowCount: () => '<b>x</b>' } });
    expect(count(el)?.textContent).toBe('<b>x</b>');
    expect(count(el)?.querySelector('b')).toBeNull();
  });
});

describe('showHeader option', () => {
  it('draws the header row by default', () => {
    const { el } = make();
    expect(el.querySelector('.spg-root')?.classList.contains('spg-no-head')).toBe(false);
  });

  it('showHeader: false marks the root, and keeps the header row for screen readers', () => {
    const { el } = make({ showHeader: false });
    expect(el.querySelector('.spg-root')?.classList.contains('spg-no-head')).toBe(true);
    expect(el.querySelector('thead th')).not.toBeNull();
  });
});
