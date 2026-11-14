import { describe, expect, it } from 'vitest';
import {
  changeSelection,
  normalizeSelectable,
  pruneSelection,
  selectedRows,
  selectionKey,
  selectionState,
} from '../../src/core/selection.js';

const rows = [{ id: 1 }, { id: 2 }, { id: 3 }];

describe('normalizeSelectable', () => {
  it('maps the option to a mode, null while off', () => {
    expect(normalizeSelectable(undefined)).toBeNull();
    expect(normalizeSelectable(false)).toBeNull();
    expect(normalizeSelectable(true)).toBe('multiple');
    expect(normalizeSelectable('multiple')).toBe('multiple');
    expect(normalizeSelectable('single')).toBe('single');
  });

  it('throws on anything else', () => {
    for (const bad of ['all', 1, null, {}])
      expect(() => normalizeSelectable(bad)).toThrow(RangeError);
  });
});

describe('selectionKey', () => {
  it('is the rowKey value, or the row itself without one', () => {
    expect(selectionKey({ id: 7 }, 'id')).toBe(7);
    const row = { id: 7 };
    expect(selectionKey(row)).toBe(row);
    const noId = { name: 'x' };
    expect(selectionKey(noId, 'id')).toBe(noId);
    const nullId = { id: null };
    expect(selectionKey(nullId, 'id')).toBe(nullId);
  });
});

describe('selectedRows / selectionState', () => {
  it('lists the selected rows in row order', () => {
    expect(selectedRows(rows, new Set([3, 1]), 'id')).toEqual([{ id: 1 }, { id: 3 }]);
    expect(selectedRows(rows, new Set(), 'id')).toEqual([]);
  });

  it('says how much of a page is selected', () => {
    expect(selectionState(rows, new Set(), 'id')).toBe('none');
    expect(selectionState(rows, new Set([2]), 'id')).toBe('some');
    expect(selectionState(rows, new Set([1, 2, 3, 9]), 'id')).toBe('all');
    expect(selectionState([], new Set([1]), 'id')).toBe('none');
  });
});

describe('pruneSelection', () => {
  it('drops what is gone, and returns the same set when nothing is', () => {
    const selected = new Set([1, 9]);
    expect([...pruneSelection(selected, rows, 'id')]).toEqual([1]);
    const kept = new Set([1, 2]);
    expect(pruneSelection(kept, rows, 'id')).toBe(kept);
  });

  it('keeps rows by identity without a rowKey', () => {
    const [a, b] = rows;
    const selected = new Set([a, { id: 1 }]);
    expect([...pruneSelection(selected, [a, b])]).toEqual([a]);
  });
});

describe('changeSelection', () => {
  it('adds and removes keys without touching the old set', () => {
    const start = new Set([1]);
    const more = changeSelection(start, [rows[1], rows[2]], {
      on: true,
      mode: 'multiple',
      rowKey: 'id',
    });
    expect([...more]).toEqual([1, 2, 3]);
    expect([...start]).toEqual([1]);
    const fewer = changeSelection(more, [rows[0], rows[1]], {
      on: false,
      mode: 'multiple',
      rowKey: 'id',
    });
    expect([...fewer]).toEqual([3]);
  });

  it('returns the same set when nothing changes', () => {
    const start = new Set([1, 2]);
    expect(changeSelection(start, [rows[0]], { on: true, mode: 'multiple', rowKey: 'id' })).toBe(
      start,
    );
    expect(changeSelection(start, [rows[2]], { on: false, mode: 'multiple', rowKey: 'id' })).toBe(
      start,
    );
  });

  it("'single' replaces the selection when selecting, and can still clear it", () => {
    const one = changeSelection(new Set([1]), [rows[1]], {
      on: true,
      mode: 'single',
      rowKey: 'id',
    });
    expect([...one]).toEqual([2]);
    const last = changeSelection(new Set(), rows, { on: true, mode: 'single', rowKey: 'id' });
    expect([...last]).toEqual([3]);
    expect([
      ...changeSelection(one, [rows[1]], { on: false, mode: 'single', rowKey: 'id' }),
    ]).toEqual([]);
  });
});
