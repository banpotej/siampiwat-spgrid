// @ts-check
import { columnOptions } from '../core/columns.js';

/** @typedef {import('../types.js').Column} Column */
/** @typedef {import('../types.js').Condition} Condition */
/** @typedef {import('../types.js').ConditionGroup} ConditionGroup */

/**
 * @param {Column[]} columns
 * @param {string} key
 * @returns {string} The column's label on one line (a multi-line header reads "ไทย / English"), or the key.
 */
export const columnLabel = (columns, key) =>
  (columns.find((c) => c.key === key)?.label ?? key).replace(/\s*\n\s*/g, ' / ');

/**
 * A condition or a group as one line of text ("Amount at least 1000", "A or B"). Plain text: escape it before it goes
 * into HTML. A nested group with several parts sits in parentheses.
 *
 * @param {Condition | ConditionGroup} node
 * @param {Column[]} columns
 * @param {{ conditionOperator: (op: import('../types.js').ConditionOperator) => string, conditionAnd: string,
 *   conditionOr: string }} labels
 * @returns {string}
 */
export function describeCondition(node, columns, labels) {
  if ('conditions' in node) {
    const word = node.logic === 'and' ? labels.conditionAnd : labels.conditionOr;
    const parts = node.conditions.map((child) => {
      const text = describeCondition(child, columns, labels);
      return 'conditions' in child && child.conditions.length > 1 ? `(${text})` : text;
    });
    return parts.join(` ${word} `);
  }
  const options = columnOptions(columns.find((c) => c.key === node.key));
  /** @param {unknown} value */
  const show = (value) =>
    options?.find((o) => o.value === String(value))?.label ?? String(value ?? '');
  const { value } = node;
  let text = '';
  if (Array.isArray(value)) {
    text =
      node.op === 'between'
        ? ` ${show(value[0]) || '…'} – ${show(value[1]) || '…'}`
        : ` ${value.map(show).join(', ')}`;
  } else if (value !== undefined) {
    text = ` ${show(value)}`;
  }
  return `${columnLabel(columns, node.key)} ${labels.conditionOperator(node.op)}${text}`;
}
