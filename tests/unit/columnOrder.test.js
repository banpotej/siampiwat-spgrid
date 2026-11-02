import { describe, expect, it } from 'vitest';
import { moveKey, normalizeOrder, orderColumns, restoreOrder } from '../../src/core/columnOrder.js';

const columns = [{ key: 'a' }, { key: 'b' }, { key: 'c' }, { key: 'ops', actions: [] }];

describe('normalizeOrder', () => {
  it('keeps the wanted order and appends the columns it leaves out', () => {
    expect(normalizeOrder(columns, ['c', 'a'])).toEqual(['c', 'a', 'b', 'ops']);
    expect(normalizeOrder(columns, [])).toEqual(['a', 'b', 'c', 'ops']);
  });
  it('drops duplicates and throws on an unknown key', () => {
    expect(normalizeOrder(columns, ['b', 'b'])).toEqual(['b', 'a', 'c', 'ops']);
    expect(() => normalizeOrder(columns, ['x'])).toThrow(RangeError);
  });
});

describe('restoreOrder', () => {
  it('ignores anything unusable', () => {
    expect(restoreOrder(columns, 'nope')).toEqual(['a', 'b', 'c', 'ops']);
    expect(restoreOrder(columns, ['c', 'gone', 'a'])).toEqual(['c', 'a', 'b', 'ops']);
  });
});

describe('moveKey', () => {
  const order = ['a', 'b', 'c', 'ops'];
  it('moves before or after the target', () => {
    expect(moveKey(order, 'c', 'a', false)).toEqual(['c', 'a', 'b', 'ops']);
    expect(moveKey(order, 'a', 'c', true)).toEqual(['b', 'c', 'a', 'ops']);
    expect(moveKey(order, 'a', 'c', false)).toEqual(['b', 'a', 'c', 'ops']);
  });
  it('leaves the order alone for the same or an unknown key', () => {
    expect(moveKey(order, 'a', 'a', true)).toBe(order);
    expect(moveKey(order, 'x', 'a', true)).toBe(order);
    expect(moveKey(order, 'a', 'x', true)).toBe(order);
  });
});

describe('orderColumns', () => {
  it('returns the columns in the given order', () => {
    expect(orderColumns(columns, ['c', 'a', 'b', 'ops']).map((c) => c.key)).toEqual([
      'c',
      'a',
      'b',
      'ops',
    ]);
  });
});
