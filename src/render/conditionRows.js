// @ts-check
import { columnOptions } from '../core/columns.js';
import { conditionKind, operatorsFor } from '../core/conditions.js';
import { escapeHtml } from '../utils/escape.js';
import { columnLabel } from './conditionText.js';

/** @typedef {import('../types.js').Column} Column */
/** @typedef {import('../types.js').Condition} Condition */
/** @typedef {import('../types.js').ConditionOperator} ConditionOperator */

/**
 * @typedef {object} RowLabels
 * @property {string} advField
 * @property {string} advOperator
 * @property {string} advValue
 * @property {string} advRemove
 * @property {string} dateFrom
 * @property {string} dateTo
 * @property {(op: ConditionOperator) => string} conditionOperator
 */

/** Operators that take no value. */
const NO_VALUE = new Set(['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse']);

/** @param {string} value @param {string} text @param {boolean} selected */
const option = (value, text, selected) =>
  `<option value="${escapeHtml(value)}"${selected ? ' selected' : ''}>${escapeHtml(text)}</option>`;

/** @param {Column | undefined} column @returns {'number' | 'date' | 'text'} Type of the value box. */
const inputType = (column) => {
  const kind = conditionKind(column);
  return kind === 'number' || kind === 'date' ? kind : 'text';
};

/**
 * @param {Column | undefined} column
 * @param {ConditionOperator} op
 * @param {unknown} value The current value, to show again.
 * @param {RowLabels} labels
 * @returns {string} The value controls for this operator: none, a pair for `between`, checkboxes for an enum, else one box.
 */
function valueHtml(column, op, value, labels) {
  if (NO_VALUE.has(op)) return '';
  const type = inputType(column);
  const step = type === 'number' ? ' step="any"' : '';
  const hint = type === 'date' ? '' : ` placeholder="${escapeHtml(labels.advValue)}"`;
  /** @param {string} cls @param {string} label @param {unknown} v */
  const box = (cls, label, v) =>
    `<input type="${type}"${step}${hint} class="${cls}" aria-label="${escapeHtml(label)}" value="${escapeHtml(v === undefined || v === null ? '' : String(v))}">`;
  if (op === 'between') {
    const [from, to] = Array.isArray(value) ? value : [];
    return (
      box('spg-adv-from', labels.dateFrom, from) +
      '<span class="spg-adv-dash" aria-hidden="true">–</span>' +
      box('spg-adv-to', labels.dateTo, to)
    );
  }
  const choices = columnOptions(column);
  if (choices) {
    const picked = new Set(Array.isArray(value) ? value.map(String) : []);
    const items = choices.map(
      (o) =>
        `<label class="spg-adv-chip"><input type="checkbox" class="spg-adv-check" value="${escapeHtml(o.value)}"${picked.has(o.value) ? ' checked' : ''}><span>${escapeHtml(o.label)}</span></label>`,
    );
    return `<span class="spg-adv-checks" role="group" aria-label="${escapeHtml(labels.advValue)}">${items.join('')}</span>`;
  }
  return box('spg-adv-input', labels.advValue, value);
}

/** @param {RowLabels} labels @returns {string} The round button that removes a row. */
export const removeButtonHtml = (labels) =>
  `<button type="button" class="spg-adv-remove" aria-label="${escapeHtml(labels.advRemove)}" title="${escapeHtml(labels.advRemove)}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>`;

/**
 * One editable condition: field select, operator select, value controls and a remove button.
 *
 * @param {Column[]} columns The data columns the field select lists.
 * @param {RowLabels} labels
 * @param {Condition | null} [condition] What to show; default: the first column with its first operator.
 * @returns {HTMLElement}
 */
export function createRow(columns, labels, condition = null) {
  const column = columns.find((c) => c.key === condition?.key) ?? columns[0];
  const ops = operatorsFor(column);
  const op = condition && ops.includes(condition.op) ? condition.op : ops[0];
  const row = document.createElement('div');
  row.className = 'spg-adv-row';
  const fields = columns.map((c) => option(c.key, columnLabel(columns, c.key), c === column));
  row.innerHTML =
    `<select class="spg-adv-field" aria-label="${escapeHtml(labels.advField)}">${fields.join('')}</select>` +
    `<select class="spg-adv-op" aria-label="${escapeHtml(labels.advOperator)}">${ops.map((o) => option(o, labels.conditionOperator(o), o === op)).join('')}</select>` +
    `<span class="spg-adv-value">${valueHtml(column, op, condition?.value, labels)}</span>` +
    removeButtonHtml(labels);
  return row;
}

/**
 * Keep a row in step after the user changed its field (new operators and value controls) or its operator (new value controls).
 *
 * @param {HTMLElement} row
 * @param {EventTarget | null} changed The select that fired `change`.
 * @param {Column[]} columns
 * @param {RowLabels} labels
 */
export function refreshRow(row, changed, columns, labels) {
  const field = /** @type {HTMLSelectElement} */ (row.querySelector('.spg-adv-field'));
  const opSelect = /** @type {HTMLSelectElement} */ (row.querySelector('.spg-adv-op'));
  const column = columns.find((c) => c.key === field.value);
  if (changed === field) {
    const ops = operatorsFor(column);
    const keep = ops.includes(/** @type {ConditionOperator} */ (opSelect.value));
    const op = keep ? opSelect.value : ops[0];
    opSelect.innerHTML = ops.map((o) => option(o, labels.conditionOperator(o), o === op)).join('');
  } else if (changed !== opSelect) {
    return;
  }
  const value = /** @type {HTMLElement} */ (row.querySelector('.spg-adv-value'));
  value.innerHTML = valueHtml(
    column,
    /** @type {ConditionOperator} */ (opSelect.value),
    undefined,
    labels,
  );
}

/**
 * @param {HTMLElement} row
 * @returns {Condition} What the row says now (a blank value is fine: the filter leaves such a condition out).
 */
export function readRow(row) {
  /** @param {string} selector @returns {string | number} A number box gives a number (blank stays ''). */
  const val = (selector) => {
    const input = /** @type {HTMLInputElement | null} */ (row.querySelector(selector));
    if (!input) return '';
    return input.type === 'number' &&
      input.value.trim() !== '' &&
      !Number.isNaN(input.valueAsNumber)
      ? input.valueAsNumber
      : input.value;
  };
  const key = String(val('.spg-adv-field'));
  const op = /** @type {ConditionOperator} */ (String(val('.spg-adv-op')));
  if (NO_VALUE.has(op)) return { key, op };
  if (op === 'between') return { key, op, value: [val('.spg-adv-from'), val('.spg-adv-to')] };
  const checks = [...row.querySelectorAll('.spg-adv-check')];
  if (checks.length > 0) {
    const picked = checks.filter((c) => /** @type {HTMLInputElement} */ (c).checked);
    return { key, op, value: picked.map((c) => /** @type {HTMLInputElement} */ (c).value) };
  }
  return { key, op, value: val('.spg-adv-input') };
}
