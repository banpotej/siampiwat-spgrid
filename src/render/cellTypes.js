// @ts-check
import { escapeHtml } from '../utils/escape.js';
import { renderIcon } from './icons.js';

/** @typedef {import('../types.js').Column} Column */
/** @typedef {import('../types.js').IconName} IconName */

/** Tones a badge can take; anything else falls back to 'neutral'. */
const TONES = ['success', 'danger', 'warning', 'info', 'neutral'];
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** @type {Map<string, Intl.NumberFormat | Intl.DateTimeFormat>} */
const formatters = new Map();

/**
 * Formatters are costly to build, so one is kept per kind, locale and options.
 *
 * @param {'number' | 'date'} kind
 * @param {string | undefined} locale
 * @param {object | undefined} options
 * @returns {Intl.NumberFormat | Intl.DateTimeFormat}
 */
function formatter(kind, locale, options) {
  const id = `${kind}|${locale}|${JSON.stringify(options)}`;
  let found = formatters.get(id);
  if (!found) {
    found =
      kind === 'number'
        ? new Intl.NumberFormat(locale, options)
        : new Intl.DateTimeFormat(locale, options);
    formatters.set(id, found);
  }
  return found;
}

/** @param {unknown} value */
const isBlank = (value) => value === null || value === undefined || value === '';

/**
 * @param {Column['type']} type
 * @returns {boolean} Whether `type` is one that changes how the cell looks.
 */
export const isTyped = (type) =>
  type === 'badge' || type === 'date' || type === 'boolean' || type === 'number';

/**
 * Cell HTML for a typed column (`badge`, `date`, `boolean`, `number`). Every value is escaped; the only
 * markup is built from constants and whitelisted names. Blank values show a muted dash.
 *
 * @param {Column} column
 * @param {unknown} value
 * @param {{ icons: Record<IconName, string>, labels: { yes: string, no: string }, locale?: string }} ctx
 * @returns {string}
 */
export function renderTypedCell(column, value, { icons, labels, locale }) {
  if (isBlank(value)) return '<span class="dg-cell-empty">–</span>';
  switch (column.type) {
    case 'number': {
      const n = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(n)) return escapeHtml(value);
      const text = /** @type {Intl.NumberFormat} */ (
        formatter('number', locale, column.format)
      ).format(n);
      return `<span class="dg-cell-number">${escapeHtml(text)}</span>`;
    }
    case 'date': {
      const date = value instanceof Date ? value : new Date(/** @type {string | number} */ (value));
      if (Number.isNaN(date.getTime())) return escapeHtml(value);
      // A date-only string means that calendar day wherever the viewer is.
      const options = {
        // `dateStyle` cannot be mixed with field options (year, month, ...), so `format` replaces it.
        ...(column.format ?? { dateStyle: 'medium' }),
        ...(DATE_ONLY.test(String(value)) && { timeZone: 'UTC' }),
      };
      const text = /** @type {Intl.DateTimeFormat} */ (formatter('date', locale, options)).format(
        date,
      );
      return `<span class="dg-cell-date">${renderIcon(icons, 'calendar_today')}<time datetime="${date.toISOString()}">${escapeHtml(text)}</time></span>`;
    }
    case 'boolean': {
      const yes = value === true;
      const label = yes ? labels.yes : labels.no;
      return `<span class="dg-bool dg-bool-${yes ? 'yes' : 'no'}" role="img" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">${renderIcon(icons, yes ? 'check' : 'close')}</span>`;
    }
    default: {
      const key = String(value);
      const badge = column.badges && Object.hasOwn(column.badges, key) ? column.badges[key] : {};
      const tone = TONES.includes(/** @type {string} */ (badge.tone)) ? badge.tone : 'neutral';
      const name = badge.icon;
      const icon =
        typeof name === 'string' && Object.hasOwn(icons, name) ? renderIcon(icons, name) : '';
      return `<span class="dg-badge dg-badge-${tone}${icon ? ' dg-badge-icon' : ''}">${icon}${escapeHtml(badge.label ?? key)}</span>`;
    }
  }
}
