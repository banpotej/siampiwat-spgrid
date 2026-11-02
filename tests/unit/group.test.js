import { describe, expect, it } from 'vitest';
import { changedGroupBy, groupItems, groupOrder, normalizeGroupBy } from '../../src/core/group.js';

const columns = [{ key: 'dept' }, { key: 'status' }, { key: 'name' }, { key: 'act', actions: [] }];
const rows = [
  { name: 'a', dept: 'Product', status: 'Planning' },
  { name: 'b', dept: 'Engineering', status: 'On track' },
  { name: 'c', dept: 'Product', status: 'On track' },
  { name: 'd', dept: 'Engineering', status: 'On track' },
  { name: 'e', dept: 'Product', status: 'Planning' },
];
const names = (/** @type {Record<string, unknown>[]} */ list) => list.map((r) => r.name).join('');

describe('normalizeGroupBy', () => {
  it('returns a copy of valid data column keys', () => {
    const keys = ['dept', 'status'];
    const out = normalizeGroupBy(columns, keys);
    expect(out).toEqual(keys);
    expect(out).not.toBe(keys);
    expect(normalizeGroupBy(columns, [])).toEqual([]);
  });

  it('rejects an unknown, action or repeated column and a non-array', () => {
    expect(() => normalizeGroupBy(columns, ['nope'])).toThrow(RangeError);
    expect(() => normalizeGroupBy(columns, ['act'])).toThrow(RangeError);
    expect(() => normalizeGroupBy(columns, ['dept', 'dept'])).toThrow(RangeError);
    expect(() => normalizeGroupBy(columns, 'dept')).toThrow(TypeError);
    expect(() => normalizeGroupBy(columns, [1])).toThrow(TypeError);
  });
});

describe('changedGroupBy', () => {
  it('is null when nothing changes', () => {
    expect(changedGroupBy({ columns, groupBy: ['dept'] }, ['dept'])).toBeNull();
    expect(changedGroupBy({ columns, groupBy: ['dept'] }, ['status'])).toEqual(['status']);
    expect(changedGroupBy({ columns, groupBy: [] }, ['dept'])).toEqual(['dept']);
  });
});

describe('groupOrder', () => {
  it('orders by the first column, then the second, and keeps the incoming order inside a group', () => {
    expect(names(groupOrder(rows, ['dept', 'status'], null))).toBe('bdcae');
    expect(names(groupOrder(rows, ['status'], null))).toBe('bcdae');
  });

  it('follows the sort direction on a group column', () => {
    const sort = /** @type {const} */ ({ key: 'dept', direction: 'desc' });
    expect(names(groupOrder(rows, ['dept'], sort))).toBe('acebd');
  });

  it('does not touch the input and leaves the rows alone without group columns', () => {
    const copy = [...rows];
    groupOrder(rows, ['dept'], null);
    expect(rows).toEqual(copy);
    expect(groupOrder(rows, [], null)).toEqual(rows);
  });

  it('puts blank values last', () => {
    const out = groupOrder(
      [
        { name: 'x', dept: null },
        { name: 'y', dept: 'A' },
      ],
      ['dept'],
      null,
    );
    expect(names(out)).toBe('yx');
  });
});

describe('groupItems', () => {
  const ordered = groupOrder(rows, ['dept', 'status'], null);
  /** @param {ReturnType<typeof groupItems>} items */
  const shape = (items) =>
    items.map((i) =>
      i.type === 'group'
        ? `${'>'.repeat(i.level + 1)}${i.first[i.column]}(${i.count})`
        : i.row.name,
    );

  it('lists a header before the first row of each group, outer groups first', () => {
    expect(shape(groupItems(ordered, ['dept', 'status']))).toEqual([
      '>Engineering(2)',
      '>>On track(2)',
      'b',
      'd',
      '>Product(3)',
      '>>On track(1)',
      'c',
      '>>Planning(2)',
      'a',
      'e',
    ]);
  });

  it('is just the rows, with their positions, when nothing is grouped', () => {
    expect(groupItems(rows, [])).toEqual(rows.map((row, index) => ({ type: 'row', row, index })));
  });

  it('hides the rows and inner groups of a collapsed group', () => {
    const all = groupItems(ordered, ['dept', 'status']);
    const eng = /** @type {import('../../src/core/group.js').GroupHeader} */ (all[0]);
    expect(shape(groupItems(ordered, ['dept', 'status'], new Set([eng.id])))).toEqual([
      '>Engineering(2)',
      '>Product(3)',
      '>>On track(1)',
      'c',
      '>>Planning(2)',
      'a',
      'e',
    ]);
    const inner = /** @type {import('../../src/core/group.js').GroupHeader} */ (all[1]);
    expect(shape(groupItems(ordered, ['dept', 'status'], new Set([inner.id]))).slice(0, 4)).toEqual(
      ['>Engineering(2)', '>>On track(2)', '>Product(3)', '>>On track(1)'],
    );
  });

  it('keeps the row index into the list given, also past collapsed groups', () => {
    const all = groupItems(ordered, ['dept']);
    const first = /** @type {import('../../src/core/group.js').GroupHeader} */ (all[0]);
    const items = groupItems(ordered, ['dept'], new Set([first.id]));
    const rowItems = items.filter((i) => i.type === 'row');
    expect(rowItems.map((i) => i.index)).toEqual([2, 3, 4]);
  });

  it('gives groups with the same value in different parents different ids', () => {
    const ids = groupItems(ordered, ['dept', 'status'])
      .filter((i) => i.type === 'group')
      .map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('groups dates by time and keeps 1 and "1" apart', () => {
    const d = new Date(2026, 0, 1);
    const items = groupItems(
      [{ v: d }, { v: new Date(d.getTime()) }, { v: 1 }, { v: '1' }],
      ['v'],
    ).filter((i) => i.type === 'group');
    expect(items.map((i) => i.count)).toEqual([2, 1, 1]);
  });
});
