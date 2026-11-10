import { describe, expect, it } from 'vitest';
import {
  conditionKind,
  filterByConditions,
  normalizeConditions,
  operatorsFor,
} from '../../src/core/conditions.js';

/** @type {import('../../src/types.js').Column[]} */
const columns = [
  { key: 'name', label: 'Name' },
  { key: 'amount', type: 'number' },
  { key: 'due', type: 'date' },
  { key: 'active', type: 'boolean' },
  { key: 'status', options: ['open', 'done', 'void'] },
  { key: 'tone', type: 'badge', badges: { hot: {}, cold: {} } },
  { key: 'ops', actions: [{ name: 'view', label: 'View' }] },
];
const rows = [
  {
    id: 1,
    name: 'Ada Lovelace',
    amount: 500,
    due: '2026-11-01',
    active: true,
    status: 'open',
    tone: 'hot',
  },
  {
    id: 2,
    name: 'Grace Hopper',
    amount: 1500,
    due: '2026-11-15',
    active: false,
    status: 'done',
    tone: 'cold',
  },
  {
    id: 3,
    name: 'éve',
    amount: '2000',
    due: new Date(2026, 10, 20),
    active: true,
    status: 'void',
    tone: 'hot',
  },
  { id: 4, name: '', amount: null, due: null, active: null, status: null, tone: undefined },
  { id: 5, amount: 'n/a', due: 'soon', active: 'yes', status: ' open ' },
];

/** @param {any} tree */
const ids = (tree) => filterByConditions(rows, tree, columns).map((r) => r.id);
/** @param {string} key @param {any} op @param {unknown} [value] */
const c = (key, op, value) => ({ key, op, ...(value !== undefined && { value }) });

describe('conditionKind and operatorsFor', () => {
  it('reads the kind from options, then type', () => {
    expect(columns.slice(0, 6).map(conditionKind)).toEqual([
      'text',
      'number',
      'date',
      'boolean',
      'enum',
      'enum',
    ]);
    expect(conditionKind({ key: 'x', type: 'badge' })).toBe('text');
    expect(conditionKind(undefined)).toBe('text');
  });

  it('lists a copy of the operators of a kind', () => {
    expect(operatorsFor(columns[1])).toContain('between');
    expect(operatorsFor(columns[4])).toEqual(['in', 'notIn', 'isEmpty', 'isNotEmpty']);
    operatorsFor(columns[0]).pop();
    expect(operatorsFor(columns[0])).toContain('isNotEmpty');
  });
});

describe('text operators', () => {
  it('contains is case- and accent-insensitive and never matches a missing cell', () => {
    expect(ids(c('name', 'contains', 'LOVE'))).toEqual([1]);
    expect(ids(c('name', 'contains', 'ÉVE'))).toEqual([3]);
  });

  it('notContains and notEquals keep the blank cells', () => {
    expect(ids(c('name', 'notContains', 'a'))).toEqual([3, 4, 5]);
    expect(ids(c('name', 'notEquals', 'éve'))).toEqual([1, 2, 4, 5]);
  });

  it('equals compares the whole trimmed value; startsWith the beginning', () => {
    expect(ids(c('name', 'equals', ' ÉVE '))).toEqual([3]);
    expect(ids(c('name', 'equals', 'Ada'))).toEqual([]);
    expect(ids(c('name', 'startsWith', 'grace'))).toEqual([2]);
    expect(ids(c('name', 'startsWith', 'hopper'))).toEqual([]);
  });

  it('isEmpty counts null, undefined and blank strings', () => {
    expect(ids(c('name', 'isEmpty'))).toEqual([4, 5]);
    expect(ids(c('name', 'isNotEmpty'))).toEqual([1, 2, 3]);
  });
});

describe('number operators', () => {
  it('compare as numbers, reading numeric strings and skipping the unreadable', () => {
    expect(ids(c('amount', 'gt', 1000))).toEqual([2, 3]);
    expect(ids(c('amount', 'gte', 1500))).toEqual([2, 3]);
    expect(ids(c('amount', 'lt', '1500'))).toEqual([1]);
    expect(ids(c('amount', 'lte', 1500))).toEqual([1, 2]);
    expect(ids(c('amount', 'equals', 2000))).toEqual([3]);
  });

  it('notEquals keeps null and unreadable cells', () => {
    expect(ids(c('amount', 'notEquals', 500))).toEqual([2, 3, 4, 5]);
  });

  it('between is inclusive and either end may be open', () => {
    expect(ids(c('amount', 'between', [500, 1500]))).toEqual([1, 2]);
    expect(ids(c('amount', 'between', [1000, null]))).toEqual([2, 3]);
    expect(ids(c('amount', 'between', ['', 600]))).toEqual([1]);
  });
});

describe('date operators', () => {
  it('compare calendar days, for strings and Dates alike', () => {
    expect(ids(c('due', 'equals', '2026-11-15'))).toEqual([2]);
    expect(ids(c('due', 'equals', '2026-11-20'))).toEqual([3]);
    expect(ids(c('due', 'before', '2026-11-15'))).toEqual([1]);
    expect(ids(c('due', 'after', '2026-11-15'))).toEqual([3]);
    expect(ids(c('due', 'notEquals', '2026-11-15'))).toEqual([1, 3, 4, 5]);
  });

  it('between is inclusive with open ends', () => {
    expect(ids(c('due', 'between', ['2026-11-01', '2026-11-15']))).toEqual([1, 2]);
    expect(ids(c('due', 'between', ['2026-11-10', '']))).toEqual([2, 3]);
    expect(ids(c('due', 'between', [null, '2026-11-01']))).toEqual([1]);
  });
});

describe('enum and boolean operators', () => {
  it('in / notIn match whole values, trimmed and case-insensitive', () => {
    expect(ids(c('status', 'in', ['OPEN', 'void']))).toEqual([1, 3, 5]);
    expect(ids(c('status', 'notIn', ['open']))).toEqual([2, 3, 4]);
    expect(ids(c('tone', 'in', ['hot']))).toEqual([1, 3]);
  });

  it('isTrue / isFalse are strict booleans', () => {
    expect(ids(c('active', 'isTrue'))).toEqual([1, 3]);
    expect(ids(c('active', 'isFalse'))).toEqual([2]);
    expect(ids(c('active', 'isEmpty'))).toEqual([4]);
  });
});

describe('groups', () => {
  it('and requires every condition, or requires one', () => {
    const both = [c('amount', 'gt', 1000), c('active', 'isTrue')];
    expect(ids({ logic: 'and', conditions: both })).toEqual([3]);
    expect(ids({ logic: 'or', conditions: both })).toEqual([1, 2, 3]);
  });

  it('nests', () => {
    const tree = {
      logic: 'and',
      conditions: [
        c('status', 'notIn', ['void']),
        { logic: 'or', conditions: [c('amount', 'lt', 600), c('name', 'startsWith', 'grace')] },
      ],
    };
    expect(ids(tree)).toEqual([1, 2]);
  });

  it('takes a single condition as the tree', () => {
    expect(ids(c('amount', 'equals', 500))).toEqual([1]);
  });
});

describe('inactive conditions', () => {
  it('a blank value filters nothing, also inside or', () => {
    for (const bad of [
      c('name', 'contains', ''),
      c('name', 'contains', '  '),
      c('amount', 'gt', ''),
      c('amount', 'gt', 'abc'),
      c('due', 'before', 'soon'),
      c('amount', 'between', [null, '']),
      c('status', 'in', []),
      c('status', 'in', ['', null]),
    ]) {
      expect(ids(bad)).toEqual([1, 2, 3, 4, 5]);
    }
    const tree = { logic: 'or', conditions: [c('name', 'contains', ''), c('amount', 'gt', 1000)] };
    expect(ids(tree)).toEqual([2, 3]);
  });

  it('empty groups, null and undefined filter nothing and give a new array', () => {
    /** @type {any[]} */
    const trees = [null, undefined, { logic: 'and', conditions: [] }];
    for (const tree of trees) {
      const out = filterByConditions(rows, tree, columns);
      expect(out).not.toBe(rows);
      expect(out).toEqual(rows);
    }
  });
});

describe('validation', () => {
  it('rejects an unknown or action column, and an operator the column does not take', () => {
    expect(() => ids(c('nope', 'contains', 'a'))).toThrow(RangeError);
    expect(() => ids(c('ops', 'isEmpty'))).toThrow(RangeError);
    expect(() => ids(c('name', 'gt', 1))).toThrow(RangeError);
    expect(() => ids(c('amount', 'contains', '1'))).toThrow(
      /does not apply to column "amount" \(number\)/,
    );
    expect(() => ids(c('status', 'equals', 'open'))).toThrow(RangeError);
  });

  it('rejects an unknown logic and malformed nodes', () => {
    expect(() => ids({ logic: 'xor', conditions: [] })).toThrow(RangeError);
    expect(() => ids({ logic: 'and', conditions: 'x' })).toThrow(TypeError);
    expect(() => ids({ logic: 'and', conditions: [null] })).toThrow(TypeError);
    expect(() => ids(c('amount', 'between', 5))).toThrow(TypeError);
    expect(() => ids(c('status', 'in', 'open'))).toThrow(TypeError);
  });

  it('validates a condition even when it would be inactive', () => {
    expect(() => ids(c('nope', 'contains', ''))).toThrow(RangeError);
  });
});

describe('normalizeConditions', () => {
  it('drops inactive parts and copies the rest', () => {
    const list = ['open'];
    /** @type {any} */
    const tree = {
      logic: 'or',
      conditions: [
        c('name', 'contains', ''),
        c('status', 'in', list),
        { logic: 'and', conditions: [c('amount', 'gt', '')] },
        c('active', 'isTrue'),
      ],
    };
    const out = /** @type {any} */ (normalizeConditions(tree, columns));
    expect(out).toEqual({
      logic: 'or',
      conditions: [c('status', 'in', ['open']), c('active', 'isTrue')],
    });
    expect(out.conditions[0].value).not.toBe(list);
  });

  it('is null when nothing is active', () => {
    expect(normalizeConditions(null, columns)).toBeNull();
    expect(normalizeConditions(c('name', 'contains', ' '), columns)).toBeNull();
    expect(normalizeConditions({ logic: 'and', conditions: [] }, columns)).toBeNull();
  });

  it('keeps a lone active condition as it is', () => {
    expect(normalizeConditions(c('amount', 'between', [1, 2]), columns)).toEqual(
      c('amount', 'between', [1, 2]),
    );
  });
});

describe('purity', () => {
  it('never mutates rows or the tree, and returns the same row objects', () => {
    /** @type {import('../../src/types.js').ConditionGroup} */
    const tree = { logic: 'and', conditions: [c('status', 'in', ['open'])] };
    const before = JSON.stringify([rows, tree]);
    const out = filterByConditions(rows, tree, columns);
    expect(JSON.stringify([rows, tree])).toBe(before);
    expect(out[0]).toBe(rows[0]);
  });

  it('uses the locale option for lower-casing', () => {
    const out = filterByConditions(
      [{ name: 'ISTANBUL' }],
      c('name', 'contains', 'istanbul'),
      columns,
      {
        locale: 'tr',
      },
    );
    expect(out).toHaveLength(0);
  });
});
