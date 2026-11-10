// @ts-check
import { columnOptions, isActionColumn } from './columns.js';
import { dayOf } from './dates.js';
import { DEFAULT_LOCALE, fold } from './filter.js';

/** @typedef {import('../types.js').Column} Column */
/** @typedef {import('../types.js').Row} Row */
/** @typedef {import('../types.js').Condition} Condition */
/** @typedef {import('../types.js').ConditionGroup} ConditionGroup */
/** @typedef {import('../types.js').ConditionOperator} ConditionOperator */
/** @typedef {'text' | 'number' | 'date' | 'enum' | 'boolean'} ConditionKind */
/** @typedef {(row: Row) => boolean} RowTest */

/** @type {Record<ConditionKind, ConditionOperator[]>} */
const OPERATORS = {
  text: ['contains', 'notContains', 'equals', 'notEquals', 'startsWith', 'isEmpty', 'isNotEmpty'],
  number: ['equals', 'notEquals', 'gt', 'gte', 'lt', 'lte', 'between', 'isEmpty', 'isNotEmpty'],
  date: ['equals', 'notEquals', 'before', 'after', 'between', 'isEmpty', 'isNotEmpty'],
  enum: ['in', 'notIn', 'isEmpty', 'isNotEmpty'],
  boolean: ['isTrue', 'isFalse', 'isEmpty', 'isNotEmpty'],
};

/** @param {unknown} value */
const isBlank = (value) =>
  value === null || value === undefined || (typeof value === 'string' && value.trim() === '');

/**
 * @param {unknown} value
 * @returns {number | null} A finite number, or null for a blank or unreadable value.
 */
const toNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

/**
 * What a condition compares a column's values as: its fixed values (`enum`), or its `type`.
 *
 * @param {Column | undefined} column
 * @returns {ConditionKind}
 */
export function conditionKind(column) {
  if (columnOptions(column) !== null) return 'enum';
  const type = column?.type;
  return type === 'number' || type === 'date' || type === 'boolean' ? type : 'text';
}

/**
 * @param {Column | undefined} column
 * @returns {ConditionOperator[]} The operators a condition on this column can use, in menu order.
 */
export const operatorsFor = (column) => [...OPERATORS[conditionKind(column)]];

/**
 * @param {unknown} value
 * @param {string} what For the error message.
 * @returns {unknown[]}
 * @throws {TypeError} not an array
 */
function asList(value, what) {
  if (!Array.isArray(value)) throw new TypeError(`SPGrid: ${what} needs an array value`);
  return value;
}

/**
 * The test of one operator on one cell, or null when the value leaves the condition inactive.
 * A blank cell never satisfies a comparison, but does satisfy the negative operators (`notContains`, `notEquals`, `notIn`).
 *
 * @param {ConditionKind} kind
 * @param {ConditionOperator} op
 * @param {unknown} value
 * @param {string} locale
 * @returns {((cell: unknown) => boolean) | null}
 */
function cellTest(kind, op, value, locale) {
  if (op === 'isEmpty') return isBlank;
  if (op === 'isNotEmpty') return (cell) => !isBlank(cell);
  if (op === 'isTrue') return (cell) => cell === true;
  if (op === 'isFalse') return (cell) => cell === false;

  if (kind === 'enum') {
    const list = asList(value, `"${op}"`).filter((v) => !isBlank(v));
    if (list.length === 0) return null;
    const wanted = new Set(list.map((v) => fold(String(v), locale).trim()));
    const has = (/** @type {unknown} */ cell) =>
      !isBlank(cell) && wanted.has(fold(String(cell), locale).trim());
    return op === 'in' ? has : (cell) => !has(cell);
  }

  if (kind === 'text') {
    if (isBlank(value)) return null;
    const needle = fold(String(value).trim(), locale);
    const text = (/** @type {unknown} */ cell) =>
      cell === null || cell === undefined ? null : fold(cell, locale);
    if (op === 'contains') return (cell) => text(cell)?.includes(needle) === true;
    if (op === 'notContains') return (cell) => text(cell)?.includes(needle) !== true;
    if (op === 'startsWith') return (cell) => text(cell)?.trimStart().startsWith(needle) === true;
    if (op === 'equals') return (cell) => text(cell)?.trim() === needle;
    return (cell) => text(cell)?.trim() !== needle;
  }

  // number and date compare as numbers and as 'YYYY-MM-DD' days; both orders are plain `<` / `>`.
  /** @type {(v: unknown) => number | string | null} */
  const read = kind === 'number' ? toNumber : dayOf;
  if (op === 'between') {
    const [from, to] = asList(value, '"between"').map(read);
    if (from == null && to == null) return null;
    return (cell) => {
      const x = read(cell);
      return x !== null && (from == null || x >= from) && (to == null || x <= to);
    };
  }
  const bound = read(value);
  if (bound === null) return null;
  const compare = {
    equals: (/** @type {number | string} */ x) => x === bound,
    notEquals: (/** @type {number | string} */ x) => x !== bound,
    gt: (/** @type {number | string} */ x) => x > bound,
    after: (/** @type {number | string} */ x) => x > bound,
    gte: (/** @type {number | string} */ x) => x >= bound,
    lt: (/** @type {number | string} */ x) => x < bound,
    before: (/** @type {number | string} */ x) => x < bound,
    lte: (/** @type {number | string} */ x) => x <= bound,
  }[/** @type {'equals'} */ (op)];
  return (cell) => {
    const x = read(cell);
    return x === null ? op === 'notEquals' : compare(x);
  };
}

/**
 * @typedef {object} Built
 * @property {RowTest} test
 * @property {Condition | ConditionGroup} node Canonical copy: only the active parts.
 */

/**
 * @param {Condition | ConditionGroup} node
 * @param {Map<string, Column>} byKey Data columns by key.
 * @param {string} locale
 * @returns {Built | null} null when nothing in `node` is active.
 * @throws {RangeError} unknown or action column, an operator the column does not take, or a `logic` other than and / or
 * @throws {TypeError} a malformed node, or a `between` / `in` / `notIn` value that is not an array
 */
function build(node, byKey, locale) {
  if (node === null || typeof node !== 'object')
    throw new TypeError('SPGrid: a condition must be an object');
  if ('conditions' in node) {
    if (node.logic !== 'and' && node.logic !== 'or') {
      throw new RangeError(`SPGrid: unknown logic "${node.logic}" (use "and" or "or")`);
    }
    const children = asList(node.conditions, 'a group');
    const built = children.map((child) => build(/** @type {Condition} */ (child), byKey, locale));
    const active = /** @type {Built[]} */ (built.filter(Boolean));
    if (active.length === 0) return null;
    const tests = active.map((b) => b.test);
    return {
      test:
        node.logic === 'and'
          ? (row) => tests.every((t) => t(row))
          : (row) => tests.some((t) => t(row)),
      node: { logic: node.logic, conditions: active.map((b) => b.node) },
    };
  }
  const { key, op, value } = node;
  const column = byKey.get(key);
  if (!column) throw new RangeError(`SPGrid: unknown column "${key}"`);
  const kind = conditionKind(column);
  if (!OPERATORS[kind].includes(op)) {
    throw new RangeError(`SPGrid: operator "${op}" does not apply to column "${key}" (${kind})`);
  }
  const test = cellTest(kind, op, value, locale);
  if (!test) return null;
  const copy = Array.isArray(value) ? [...value] : value;
  return {
    test: (row) => test(row[key]),
    node: { key, op, ...(copy !== undefined && { value: copy }) },
  };
}

/**
 * @param {Condition | ConditionGroup | null | undefined} tree
 * @param {Column[]} columns
 * @param {string} [locale]
 * @returns {Built | null}
 */
function buildTree(tree, columns, locale = DEFAULT_LOCALE) {
  if (tree === null || tree === undefined) return null;
  const byKey = new Map(columns.filter((c) => !isActionColumn(c)).map((c) => [c.key, c]));
  return build(tree, byKey, locale);
}

/**
 * Canonical form of a condition tree: copied, with every inactive condition (blank value, empty list) and every group
 * left with nothing active dropped. Validates it as it goes. Pure.
 *
 * @param {Condition | ConditionGroup | null | undefined} tree
 * @param {Column[]} columns
 * @param {{ locale?: string }} [options]
 * @returns {Condition | ConditionGroup | null} null when nothing is active.
 * @throws {RangeError} unknown or action column, an operator the column does not take, or a `logic` other than and / or
 * @throws {TypeError} a malformed node, or a `between` / `in` / `notIn` value that is not an array
 */
export const normalizeConditions = (tree, columns, options = {}) =>
  buildTree(tree, columns, options.locale)?.node ?? null;

/**
 * Keep the rows that satisfy the condition tree. Pure: a new array of the same row objects; `rows` is not mutated.
 * Text matches are case-insensitive and accent-safe, like the search box; a blank value, or a group with nothing active,
 * filters nothing. A cell that is null, undefined or blank satisfies only `isEmpty` and the negative operators.
 *
 * @param {Row[]} rows
 * @param {Condition | ConditionGroup | null | undefined} tree A single condition, or a group of them.
 * @param {Column[]} columns
 * @param {{ locale?: string }} [options] Locale for lower-casing; default 'th'.
 * @returns {Row[]}
 * @throws {RangeError} unknown or action column, an operator the column does not take, or a `logic` other than and / or
 * @throws {TypeError} a malformed node, or a `between` / `in` / `notIn` value that is not an array
 */
export function filterByConditions(rows, tree, columns, options = {}) {
  const built = buildTree(tree, columns, options.locale);
  return built ? rows.filter(built.test) : [...rows];
}

/**
 * Drop one top-level condition of an AND group, or the whole filter. Pure.
 *
 * @param {Condition | ConditionGroup | null} tree
 * @param {number | null} index Position in `tree.conditions`; null (or a tree that is not an AND group): drop everything.
 * @returns {Condition | ConditionGroup | null} null when nothing is left.
 */
export function removeConditionPart(tree, index) {
  if (index === null || !tree || !('conditions' in tree) || tree.logic !== 'and') return null;
  const rest = tree.conditions.filter((_, i) => i !== index);
  return rest.length > 0 ? { logic: 'and', conditions: rest } : null;
}
