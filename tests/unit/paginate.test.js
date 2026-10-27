import { describe, expect, it } from 'vitest';
import { getPageWindow, paginate } from '../../src/core/paginate.js';

/** @param {number} n */
const makeRows = (n) => Array.from({ length: n }, (_, i) => ({ id: i + 1 }));
/** @param {{ rows: Record<string, unknown>[] }} result */
const ids = (result) => result.rows.map((r) => r.id);

describe('paginate', () => {
  it('returns { rows, page, pageSize, totalRows, totalPages }', () => {
    const out = paginate(makeRows(25), { page: 2, pageSize: 10 });
    expect(ids(out)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(out).toMatchObject({ page: 2, pageSize: 10, totalRows: 25, totalPages: 3 });
  });

  it('is 1-based: page 1 is the first slice', () => {
    expect(ids(paginate(makeRows(5), { page: 1, pageSize: 2 }))).toEqual([1, 2]);
  });

  it('the last page holds the remainder', () => {
    expect(ids(paginate(makeRows(25), { page: 3, pageSize: 10 }))).toEqual([21, 22, 23, 24, 25]);
  });

  it('clamps page < 1 to 1', () => {
    for (const page of [0, -3, -Infinity]) {
      const out = paginate(makeRows(25), { page, pageSize: 10 });
      expect(out.page).toBe(1);
      expect(ids(out)[0]).toBe(1);
    }
  });

  it('clamps page > totalPages to the last page', () => {
    for (const page of [4, 99, Infinity]) {
      const out = paginate(makeRows(25), { page, pageSize: 10 });
      expect(out.page).toBe(3);
      expect(ids(out)).toEqual([21, 22, 23, 24, 25]);
    }
  });

  it('treats NaN and a missing page as page 1, and truncates fractions', () => {
    expect(paginate(makeRows(25), { page: NaN, pageSize: 10 }).page).toBe(1);
    expect(paginate(makeRows(25), { pageSize: 10 }).page).toBe(1);
    expect(paginate(makeRows(25), { page: 2.9, pageSize: 10 }).page).toBe(2);
  });

  it('empty rows -> totalPages 1 (not 0) and no rows', () => {
    const out = paginate([], { page: 1, pageSize: 10 });
    expect(out).toEqual({ rows: [], page: 1, pageSize: 10, totalRows: 0, totalPages: 1 });
    expect(paginate([], { page: 5, pageSize: 10 }).page).toBe(1);
  });

  it('pageSize larger than the data returns everything on page 1', () => {
    const out = paginate(makeRows(3), { page: 1, pageSize: 100 });
    expect(ids(out)).toEqual([1, 2, 3]);
    expect(out.totalPages).toBe(1);
    expect(paginate(makeRows(3), { page: 2, pageSize: 100 }).page).toBe(1);
  });

  it('an exact multiple has no empty trailing page', () => {
    expect(paginate(makeRows(20), { page: 1, pageSize: 10 }).totalPages).toBe(2);
  });

  it.each([0, -1, NaN, 1.5, Infinity, '10', null, undefined])(
    'throws RangeError for invalid pageSize %s',
    (pageSize) => {
      expect(() =>
        paginate(makeRows(5), { page: 1, pageSize: /** @type {any} */ (pageSize) }),
      ).toThrow(RangeError);
    },
  );

  it('returns a new array and never mutates the input', () => {
    const rows = makeRows(5);
    const snapshot = [...rows];
    const out = paginate(rows, { page: 1, pageSize: 100 });
    expect(out.rows).not.toBe(rows);
    expect(out.rows).toEqual(rows);
    expect(rows.every((r, i) => r === snapshot[i])).toBe(true);
    expect(out.rows[0]).toBe(rows[0]); // same row objects, not copies
    out.rows.pop();
    expect(rows).toHaveLength(5);
  });
});

describe('getPageWindow', () => {
  it('shows every page when they fit', () => {
    expect(getPageWindow(1, 1)).toEqual([1]);
    expect(getPageWindow(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPageWindow(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('puts ellipses on both sides in the middle', () => {
    expect(getPageWindow(5, 20)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 20]);
    expect(getPageWindow(10, 20)).toEqual([1, 'ellipsis', 9, 10, 11, 'ellipsis', 20]);
    expect(getPageWindow(16, 20)).toEqual([1, 'ellipsis', 15, 16, 17, 'ellipsis', 20]);
  });

  it('has one ellipsis near the start', () => {
    expect(getPageWindow(1, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 20]);
    expect(getPageWindow(4, 20)).toEqual([1, 2, 3, 4, 5, 'ellipsis', 20]);
  });

  it('has one ellipsis near the end', () => {
    expect(getPageWindow(20, 20)).toEqual([1, 'ellipsis', 16, 17, 18, 19, 20]);
    expect(getPageWindow(17, 20)).toEqual([1, 'ellipsis', 16, 17, 18, 19, 20]);
  });

  it('honours maxButtons', () => {
    expect(getPageWindow(10, 20, 5)).toEqual([1, 'ellipsis', 10, 'ellipsis', 20]);
    expect(getPageWindow(1, 20, 5)).toEqual([1, 2, 3, 'ellipsis', 20]);
    expect(getPageWindow(10, 20, 9)).toEqual([1, 'ellipsis', 8, 9, 10, 11, 12, 'ellipsis', 20]);
    expect(getPageWindow(2, 9, 9)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('clamps an out-of-range page', () => {
    expect(getPageWindow(0, 20)).toEqual(getPageWindow(1, 20));
    expect(getPageWindow(99, 20)).toEqual(getPageWindow(20, 20));
    expect(getPageWindow(NaN, 20)).toEqual(getPageWindow(1, 20));
  });

  it('invariants hold for every page, total and maxButtons', () => {
    for (let max = 5; max <= 9; max++) {
      for (let total = 1; total <= 40; total++) {
        for (let page = 1; page <= total; page++) {
          const w = getPageWindow(page, total, max);
          const nums = /** @type {number[]} */ (w.filter((x) => x !== 'ellipsis'));
          const ctx = `page ${page}/${total} max ${max}: ${JSON.stringify(w)}`;
          expect(w.length, ctx).toBe(Math.min(total, max));
          expect(w[0], ctx).toBe(1);
          expect(w.at(-1), ctx).toBe(total);
          expect(nums, ctx).toContain(page);
          expect(
            nums.every((n, i) => i === 0 || n > nums[i - 1]),
            ctx,
          ).toBe(true);
          w.forEach((x, i) => {
            if (x !== 'ellipsis') return;
            // never two in a row, and each one hides at least two pages
            expect(w[i - 1], ctx).not.toBe('ellipsis');
            expect(
              /** @type {number} */ (w[i + 1]) - /** @type {number} */ (w[i - 1]),
              ctx,
            ).toBeGreaterThan(2);
          });
        }
      }
    }
  });

  it.each([
    [1, 0],
    [1, -1],
    [1, 2.5],
    [1, NaN],
  ])('throws RangeError for invalid totalPages (%s, %s)', (page, totalPages) => {
    expect(() => getPageWindow(page, totalPages)).toThrow(RangeError);
  });

  it.each([4, 0, 6.5, NaN])('throws RangeError for invalid maxButtons %s', (maxButtons) => {
    expect(() => getPageWindow(1, 20, maxButtons)).toThrow(RangeError);
  });
});
