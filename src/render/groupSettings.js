// @ts-check
import { escapeHtml } from '../utils/escape.js';

/** How many group selects the settings modal offers at least (one more per extra level already set from code). */
const MIN_LEVELS = 2;

/**
 * The "Grouping" section of the settings modal: one select per level (group by, then by, ...), each listing
 * the data columns after a "No grouping" entry.
 *
 * @param {{ key: string, label: string }[]} columns Data columns, with their text as one line.
 * @param {string[]} keys The group columns now, outermost first.
 * @param {{ groupSection: string, groupBy: string, thenBy: string, noGrouping: string }} labels
 * @returns {string} The section's markup; '' when there are no columns.
 */
export function renderGroupSection(columns, keys, labels) {
  if (columns.length === 0) return '';
  const options =
    `<option value="">${escapeHtml(labels.noGrouping)}</option>` +
    columns
      .map(({ key, label }) => `<option value="${escapeHtml(key)}">${escapeHtml(label)}</option>`)
      .join('');
  const levels = Math.min(Math.max(MIN_LEVELS, keys.length), columns.length);
  const selects = Array.from(
    { length: levels },
    (_, level) =>
      `<label class="spg-settings-field"><span>${escapeHtml(level === 0 ? labels.groupBy : labels.thenBy)}</span>` +
      `<select data-group="${level}">${options}</select></label>`,
  ).join('');
  return `<section><h3 class="spg-settings-heading">${escapeHtml(labels.groupSection)}</h3>${selects}</section>`;
}

/**
 * @param {ParentNode} root
 * @returns {HTMLSelectElement[]} The group selects, outermost first.
 */
export const groupSelects = (root) =>
  [...root.querySelectorAll('select[data-group]')].map(
    (el) => /** @type {HTMLSelectElement} */ (el),
  );

/**
 * Show the current group columns in the selects.
 *
 * @param {HTMLSelectElement[]} selects
 * @param {string[]} keys
 */
export function fillGroupSelects(selects, keys) {
  selects.forEach((select, level) => (select.value = keys[level] ?? ''));
  syncGroupSelects(selects);
}

/**
 * Keep the levels consistent: a level stays off until the one before it is set (and is emptied when that one
 * is cleared), and a column picked at one level cannot be picked again at another.
 *
 * @param {HTMLSelectElement[]} selects
 */
export function syncGroupSelects(selects) {
  /** @type {string[]} */
  const taken = [];
  selects.forEach((select, level) => {
    const blocked = level > 0 && taken.length < level;
    if (blocked || taken.includes(select.value)) select.value = '';
    select.disabled = blocked;
    for (const option of select.options)
      option.disabled = option.value !== '' && taken.includes(option.value);
    if (select.value !== '') taken.push(select.value);
  });
}

/**
 * @param {HTMLSelectElement[]} selects
 * @returns {string[]} The chosen group columns, outermost first.
 */
export const readGroupSelects = (selects) =>
  selects.map((select) => select.value).filter((key) => key !== '');
