// @ts-check

/**
 * @typedef {'contains' | 'notContains' | 'equals' | 'notEquals' | 'startsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' |
 *   'before' | 'after' | 'in' | 'notIn' | 'isTrue' | 'isFalse' | 'isEmpty' | 'isNotEmpty'} ConditionOperator
 */

/**
 * @typedef {object} Condition One test on one data column: `key` `op` `value`.
 * @property {string} key
 * @property {ConditionOperator} op Which operators a column takes depends on its kind (text, number, date, enum, boolean).
 * @property {unknown} [value] A string, number or day; `[from, to]` for `between`; `string[]` for `in` / `notIn`; none for
 *   `isEmpty`, `isNotEmpty`, `isTrue`, `isFalse`. A blank or unreadable value makes the condition inactive (it matches every row).
 */

/**
 * @typedef {object} ConditionGroup Conditions (or nested groups) combined with AND or OR.
 * @property {'and' | 'or'} logic
 * @property {(Condition | ConditionGroup)[]} conditions
 */

export {};
