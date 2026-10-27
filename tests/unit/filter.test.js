import { describe, expect, it } from 'vitest';
import { filterRows, isSameFilter, normalizeFilter } from '../../src/core/filter.js';

const rows = [
  { id: 1, name: 'Ada Lovelace', role: 'Engineer', active: true },
  { id: 2, name: 'Grace Hopper', role: 'Admiral', active: false },
  { id: 3, name: 'Eve', role: 'Tester', active: true },
];

/** @param {Record<string, unknown>[]} out */
const ids = (out) => out.map((r) => r.id);

describe('filterRows basics', () => {
  it('returns a new array and never mutates the input', () => {
    const snapshot = [...rows];
    const out = filterRows(rows, { search: 'ada' });
    expect(out).not.toBe(rows);
    expect(rows.every((r, i) => r === snapshot[i])).toBe(true);
    expect(out[0]).toBe(rows[0]); // same row objects, not copies
  });

  it('returns a new array with every row when there is no filter', () => {
    for (const state of [undefined, {}, { search: '' }, { columnFilters: {} }]) {
      const out = filterRows(rows, state);
      expect(out).not.toBe(rows);
      expect(out).toEqual(rows);
    }
  });

  it('treats blank or whitespace-only search as no filter', () => {
    expect(ids(filterRows(rows, { search: '   \t ' }))).toEqual([1, 2, 3]);
    expect(ids(filterRows(rows, { search: null }))).toEqual([1, 2, 3]);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterRows(rows, { search: 'zzz' })).toEqual([]);
  });
});

describe('filterRows global search', () => {
  it('is a case-insensitive substring match', () => {
    expect(ids(filterRows(rows, { search: 'LOVE' }))).toEqual([1]);
    expect(ids(filterRows(rows, { search: 'ra' }))).toEqual([2]);
    expect(ids(filterRows(rows, { search: 'e' }))).toEqual([1, 2, 3]);
  });

  it('matches in any column, or only the listed columns', () => {
    expect(ids(filterRows(rows, { search: 'tester' }))).toEqual([3]);
    expect(ids(filterRows(rows, { search: 'tester', columns: ['name'] }))).toEqual([]);
    expect(ids(filterRows(rows, { search: 'eve', columns: ['name'] }))).toEqual([3]);
  });

  it('ignores a listed column that does not exist on the row', () => {
    expect(filterRows(rows, { search: 'ada', columns: ['missing'] })).toEqual([]);
  });

  it('treats multiple words as AND, each word free to match a different column', () => {
    expect(ids(filterRows(rows, { search: 'grace admiral' }))).toEqual([2]);
    expect(ids(filterRows(rows, { search: 'admiral grace' }))).toEqual([2]);
    expect(ids(filterRows(rows, { search: '  ada   engineer ' }))).toEqual([1]);
    expect(filterRows(rows, { search: 'ada admiral' })).toEqual([]);
  });

  it('is accent-safe: composed and decomposed forms match each other', () => {
    const data = [
      { id: 1, n: 'Café' },
      { id: 2, n: 'Cafe' },
    ];
    expect(ids(filterRows(data, { search: 'café' }))).toEqual([1]);
    expect(ids(filterRows(data, { search: 'CAFÉ' }))).toEqual([1]);
    expect(ids(filterRows([{ id: 1, n: 'café' }], { search: 'café' }))).toEqual([1]);
  });

  it('matches Thai text as a substring', () => {
    const data = [
      { id: 1, n: 'สมชาย ใจดี' },
      { id: 2, n: 'สมหญิง รักเรียน' },
    ];
    expect(ids(filterRows(data, { search: 'สมหญิง' }))).toEqual([2]);
    expect(ids(filterRows(data, { search: 'สม ใจ' }))).toEqual([1]);
    expect(ids(filterRows(data, { search: 'สม' }))).toEqual([1, 2]);
  });
});

describe('filterRows cell values', () => {
  it('never matches null/undefined cells', () => {
    const data = [{ id: 1, v: null }, { id: 2, v: undefined }, { id: 3 }, { id: 4, v: 'null' }];
    expect(ids(filterRows(data, { search: 'null', columns: ['v'] }))).toEqual([4]);
    expect(ids(filterRows(data, { search: 'undefined', columns: ['v'] }))).toEqual([]);
    expect(ids(filterRows(data, { columnFilters: { v: 'undefined' } }))).toEqual([]);
  });

  it('matches numbers, booleans and Dates through String()', () => {
    const date = new Date('2024-03-05T00:00:00Z');
    const data = [
      { id: 1, v: 12345 },
      { id: 2, v: true },
      { id: 3, v: date },
      { id: 4, v: 0 },
    ];
    expect(ids(filterRows(data, { search: '234', columns: ['v'] }))).toEqual([1]);
    expect(ids(filterRows(data, { search: 'TRUE', columns: ['v'] }))).toEqual([2]);
    expect(ids(filterRows(data, { search: String(date).slice(0, 15), columns: ['v'] }))).toEqual([
      3,
    ]);
    // 0 is a real value, not "empty"
    expect(
      ids(
        filterRows(
          [
            { id: 4, v: 0 },
            { id: 5, v: 1 },
          ],
          { search: '0' },
        ),
      ),
    ).toEqual([4]);
  });
});

describe('filterRows column filters', () => {
  it('filters one column by case-insensitive substring', () => {
    expect(ids(filterRows(rows, { columnFilters: { role: 'eng' } }))).toEqual([1]);
    expect(ids(filterRows(rows, { columnFilters: { role: 'ER' } }))).toEqual([1, 3]);
  });

  it('ANDs filters across columns', () => {
    expect(ids(filterRows(rows, { columnFilters: { role: 'er', name: 'ada' } }))).toEqual([1]);
    expect(filterRows(rows, { columnFilters: { role: 'eng', name: 'eve' } })).toEqual([]);
  });

  it('ignores blank filter values', () => {
    expect(ids(filterRows(rows, { columnFilters: { role: '  ', name: '' } }))).toEqual([1, 2, 3]);
    expect(ids(filterRows(rows, { columnFilters: { role: 'eng', name: '' } }))).toEqual([1]);
  });

  it('never matches a missing column when the filter is not blank', () => {
    expect(filterRows(rows, { columnFilters: { nope: 'x' } })).toEqual([]);
  });

  it('combines with global search using AND', () => {
    expect(ids(filterRows(rows, { search: 'e', columnFilters: { role: 'test' } }))).toEqual([3]);
    expect(filterRows(rows, { search: 'grace', columnFilters: { role: 'test' } })).toEqual([]);
  });

  it('applies the same accent folding', () => {
    const data = [{ id: 1, n: 'Café' }];
    expect(ids(filterRows(data, { columnFilters: { n: 'café' } }))).toEqual([1]);
  });
});

describe('filterRows locale', () => {
  it('lowercases with the given locale (default th)', () => {
    const data = [{ id: 1, n: 'I' }];
    expect(ids(filterRows(data, { search: 'i' }))).toEqual([1]);
    expect(ids(filterRows(data, { search: 'i' }, { locale: 'tr' }))).toEqual([]);
  });
});

describe('normalizeFilter', () => {
  it('returns null when nothing is active', () => {
    for (const f of [null, undefined, {}, { search: '  ' }, { columnFilters: { a: ' ' } }]) {
      expect(normalizeFilter(f)).toBeNull();
    }
  });

  it('keeps only active parts and drops `columns`', () => {
    expect(
      normalizeFilter({ search: 'ada ', columns: ['x'], columnFilters: { a: 'q', b: '' } }),
    ).toEqual({ search: 'ada ', columnFilters: { a: 'q' } });
    expect(normalizeFilter({ columnFilters: { a: 'q' } })).toEqual({ columnFilters: { a: 'q' } });
  });

  it('returns a copy', () => {
    const columnFilters = { a: 'q' };
    expect(normalizeFilter({ columnFilters })?.columnFilters).not.toBe(columnFilters);
  });
});

describe('isSameFilter', () => {
  it('compares normalized values', () => {
    expect(isSameFilter(null, { search: ' ' })).toBe(true);
    expect(isSameFilter({ search: 'a' }, { search: 'a' })).toBe(true);
    expect(isSameFilter({ search: 'a' }, { search: 'b' })).toBe(false);
    expect(isSameFilter({ search: 'a' }, null)).toBe(false);
    expect(isSameFilter({ columnFilters: { a: 'x' } }, { columnFilters: { a: 'x' } })).toBe(true);
    expect(isSameFilter({ columnFilters: { a: 'x' } }, { columnFilters: { a: 'y' } })).toBe(false);
    expect(isSameFilter({ columnFilters: { a: 'x' } }, { columnFilters: { b: 'x' } })).toBe(false);
    expect(isSameFilter({ columnFilters: { a: 'x' } }, { search: 'x' })).toBe(false);
  });
});
