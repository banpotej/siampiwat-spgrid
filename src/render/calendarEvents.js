// @ts-check
import { escapeHtml } from '../utils/escape.js';

/** @typedef {import('../core/calendar.js').CalendarEvent} CalendarEvent */

/**
 * @typedef {object} EventLook What an event's markup is built from.
 * @property {string} title Row field shown as the title.
 * @property {string} [subtitle] Row field shown under the title.
 * @property {string} [color] Row field holding the colour (or the key into `colors`).
 * @property {Record<string, string>} [colors] Colour of each value of the `color` field.
 * @property {string} allDayLabel Shown instead of the times of an all-day event.
 */

const COLOR = /^(#[0-9a-f]{3,8}|[a-z]{3,30}|(?:rgb|hsl)a?\([0-9a-z\s.,%/+-]*\))$/i;

export const pad = (/** @type {number} */ n) => String(n).padStart(2, '0');
export const clock = (/** @type {number} */ time) => {
  const date = new Date(time);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** @param {unknown} value @returns {boolean} A hex, named, rgb() or hsl() colour; nothing that could carry other CSS. */
export const isColor = (value) => typeof value === 'string' && COLOR.test(value.trim());

/**
 * @param {import('../types.js').Row} row
 * @param {Pick<EventLook, 'color' | 'colors'>} look
 * @returns {string | null} The event's colour, or null to keep the theme's accent.
 */
export function eventColor(row, { color, colors }) {
  if (color === undefined) return null;
  const value = row[color];
  const key = String(value);
  const picked = colors ? (Object.hasOwn(colors, key) ? colors[key] : undefined) : value;
  return isColor(picked) ? /** @type {string} */ (picked).trim() : null;
}

/**
 * @param {CalendarEvent} event
 * @param {EventLook} look
 * @param {string} [css] Inline position of a box in the time grid.
 * @returns {string} The ` style="..."` attribute (empty when there is nothing to set).
 */
function styleAttr(event, look, css = '') {
  const color = eventColor(event.row, look);
  const style = [css, color && `--spg-cal-event-color:${color}`].filter(Boolean).join(';');
  return style ? ` style="${escapeHtml(style)}"` : '';
}

/**
 * A full event: title, time (or the all-day label) and subtitle.
 *
 * @param {CalendarEvent} event
 * @param {EventLook} look
 * @param {{ css?: string, short?: boolean, narrow?: boolean }} [shape] `css`: inline position of a box in the time grid;
 *   `short`: a box too short for more than one line; `narrow`: a box sharing its width with more than its day column
 *   grew for (the title wraps, the time and subtitle wait for hover).
 * @returns {string}
 */
export function eventHtml(event, look, { css, short = false, narrow = false } = {}) {
  const { row } = event;
  const time = event.allDay ? look.allDayLabel : `${clock(event.start)}–${clock(event.end)}`;
  const text = String(row[look.title] ?? '');
  const place = look.subtitle ? String(row[look.subtitle] ?? '') : '';
  return (
    `<div class="spg-cal-event${short ? ' is-short' : ''}${narrow ? ' is-narrow' : ''}${event.allDay ? ' is-all-day' : ''}" tabindex="0" data-row-index="${event.index}"${styleAttr(event, look, css)} title="${escapeHtml(`${time} ${text}`)}">` +
    `<span class="spg-cal-event-title">${escapeHtml(text)}</span>` +
    `<span class="spg-cal-event-time">${escapeHtml(time)}</span>` +
    (place ? `<span class="spg-cal-event-sub">${escapeHtml(place)}</span>` : '') +
    `</div>`
  );
}

/**
 * A one-line event for a month cell or the all-day row: the start time (none for an all-day event) and the title.
 *
 * @param {CalendarEvent} event
 * @param {EventLook} look
 * @returns {string}
 */
export function chipHtml(event, look) {
  const text = String(event.row[look.title] ?? '');
  const time = event.allDay ? look.allDayLabel : clock(event.start);
  const shown = event.allDay ? '' : `<span class="spg-cal-chip-time">${time}</span> `;
  return (
    `<div class="spg-cal-event spg-cal-chip${event.allDay ? ' is-all-day' : ''}" tabindex="0" data-row-index="${event.index}"${styleAttr(event, look)} title="${escapeHtml(`${time} ${text}`)}">` +
    `${shown}<span class="spg-cal-event-title">${escapeHtml(text)}</span></div>`
  );
}
