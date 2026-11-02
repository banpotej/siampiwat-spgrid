// @ts-check

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The calendar day of a date cell, as the grid shows it: a date-only string is that day wherever the viewer is,
 * anything else (a Date, an ISO string with a time, a timestamp) is the day in the viewer's time zone. Pure.
 *
 * @param {unknown} value
 * @returns {string | null} 'YYYY-MM-DD', or null for a blank or unreadable value.
 */
export function dayOf(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string' && DATE_ONLY.test(value)) return value;
  const date = value instanceof Date ? value : new Date(/** @type {string | number} */ (value));
  if (Number.isNaN(date.getTime())) return null;
  const pad = (/** @type {number} */ n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * @param {unknown} text The search of a date column: 'FROM..TO' with either side a 'YYYY-MM-DD' day or empty.
 * @returns {{ from: string, to: string }} The days that are valid ('' for a missing or invalid one).
 */
export function parseDayRange(text) {
  const [from = '', to = ''] = String(text ?? '').split('..');
  const valid = (/** @type {string} */ day) => (DATE_ONLY.test(day.trim()) ? day.trim() : '');
  return { from: valid(from), to: valid(to) };
}
