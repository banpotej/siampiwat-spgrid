import { describe, expect, it } from 'vitest';
import { nextDirection, sortRows } from '../../src/core/sort.js';

describe('sortRows', () => {
  it('returns a new array and never mutates the input', () => {
    const rows = [{ n: 3 }, { n: 1 }, { n: 2 }];
    const snapshot = [...rows];
    const out = sortRows(rows, { key: 'n', direction: 'asc' });
    expect(out).not.toBe(rows);
    expect(rows).toEqual(snapshot);
    expect(rows.every((r, i) => r === snapshot[i])).toBe(true);
  });

  it('sorts asc and desc', () => {
    const rows = [{ n: 2 }, { n: 3 }, { n: 1 }];
    expect(sortRows(rows, { key: 'n', direction: 'asc' }).map((r) => r.n)).toEqual([1, 2, 3]);
    expect(sortRows(rows, { key: 'n', direction: 'desc' }).map((r) => r.n)).toEqual([3, 2, 1]);
  });

  it('keeps original order (as a new array) when direction is null/undefined', () => {
    const rows = [{ n: 2 }, { n: 1 }];
    for (const direction of [null, undefined]) {
      const out = sortRows(rows, { key: 'n', direction });
      expect(out).not.toBe(rows);
      expect(out).toEqual(rows);
    }
  });

  it('keeps original order when sort is null/undefined', () => {
    const rows = [{ n: 2 }, { n: 1 }];
    expect(sortRows(rows, null)).toEqual(rows);
    expect(sortRows(rows, undefined)).toEqual(rows);
  });

  it('is stable: equal values keep their relative order in asc and desc', () => {
    const rows = [
      { g: 1, id: 'a' },
      { g: 0, id: 'b' },
      { g: 1, id: 'c' },
      { g: 0, id: 'd' },
    ];
    expect(sortRows(rows, { key: 'g', direction: 'asc' }).map((r) => r.id)).toEqual([
      'b',
      'd',
      'a',
      'c',
    ]);
    expect(sortRows(rows, { key: 'g', direction: 'desc' }).map((r) => r.id)).toEqual([
      'a',
      'c',
      'b',
      'd',
    ]);
  });

  it('compares numbers numerically (2 < 10)', () => {
    const rows = [{ n: 10 }, { n: 2 }, { n: 1 }];
    expect(sortRows(rows, { key: 'n', direction: 'asc' }).map((r) => r.n)).toEqual([1, 2, 10]);
  });

  it('compares strings with numeric collation', () => {
    const rows = [{ s: 'item10' }, { s: 'item2' }, { s: 'item1' }];
    expect(sortRows(rows, { key: 's', direction: 'asc' }).map((r) => r.s)).toEqual([
      'item1',
      'item2',
      'item10',
    ]);
  });

  it('uses the default th locale for Thai strings', () => {
    const rows = [{ s: 'ค' }, { s: 'ก' }, { s: 'ข' }];
    expect(sortRows(rows, { key: 's', direction: 'asc' }).map((r) => r.s)).toEqual(['ก', 'ข', 'ค']);
  });

  it('honours the locale option', () => {
    const rows = [{ s: 'z' }, { s: 'ä' }, { s: 'a' }];
    const sv = sortRows(rows, { key: 's', direction: 'asc' }, { locale: 'sv' });
    expect(sv.map((r) => r.s)).toEqual(['a', 'z', 'ä']);
    const de = sortRows(rows, { key: 's', direction: 'asc' }, { locale: 'de' });
    expect(de.map((r) => r.s)).toEqual(['a', 'ä', 'z']);
  });

  it('sorts null/undefined last in both asc and desc', () => {
    const rows = [{ n: null }, { n: 2 }, {}, { n: 1 }];
    const asc = sortRows(rows, { key: 'n', direction: 'asc' }).map((r) => r.n ?? null);
    const desc = sortRows(rows, { key: 'n', direction: 'desc' }).map((r) => r.n ?? null);
    expect(asc).toEqual([1, 2, null, null]);
    expect(desc).toEqual([2, 1, null, null]);
  });

  it('keeps nullish rows in original relative order', () => {
    const rows = [
      { n: undefined, id: 'a' },
      { n: null, id: 'b' },
      { n: 1, id: 'c' },
    ];
    expect(sortRows(rows, { key: 'n', direction: 'desc' }).map((r) => r.id)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });
});

describe('nextDirection', () => {
  it('cycles null -> asc -> desc -> null', () => {
    expect(nextDirection(null)).toBe('asc');
    expect(nextDirection('asc')).toBe('desc');
    expect(nextDirection('desc')).toBe(null);
  });

  it('treats undefined as no sort', () => {
    expect(nextDirection(undefined)).toBe('asc');
  });
});
