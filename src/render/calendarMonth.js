// @ts-check
import { daySegments, startOfDay } from '../core/calendar.js';
import { escapeHtml } from '../utils/escape.js';

/** @typedef {import('../core/calendar.js').CalendarEvent} CalendarEvent */

const MAX_CHIPS = 3; // events a day cell lists before "+N more"
const pad = (/** @type {number} */ n) => String(n).padStart(2, '0');
const clock = (/** @type {number} */ time) => {
  const date = new Date(time);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** @param {number} day Local midnight. @returns {string} 'YYYY-MM-DD'. */
export const dayId = (day) => {
  const date = new Date(day);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/**
 * The month grid: a header of weekday names, then a cell per day with its first events as one-line chips.
 *
 * @param {object} parts
 * @param {number[]} parts.days Whole weeks, as `visibleDays('month', ...)` returns them.
 * @param {number} parts.anchor Any moment of the month shown; days of other months are dimmed.
 * @param {CalendarEvent[]} parts.events
 * @param {number} parts.now
 * @param {string} parts.title Row field shown as the title.
 * @param {string} [parts.locale]
 * @param {boolean} parts.canOpenDay Whether the "+N more" link can open the day view.
 * @param {(more: number) => string} parts.moreLabel
 * @returns {string}
 */
export function renderMonth({ days, anchor, events, now, title, locale, canOpenDay, moreLabel }) {
  const month = new Date(anchor).getMonth();
  const today = startOfDay(now);
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const number = new Intl.DateTimeFormat(locale, { day: 'numeric' });
  const heads = days
    .slice(0, 7)
    .map((day) => `<span class="spg-cal-dayhead">${escapeHtml(weekday.format(day))}</span>`)
    .join('');
  const cells = days
    .map((day) => {
      const segments = daySegments(events, day);
      const chips = segments
        .slice(0, MAX_CHIPS)
        .map(({ event }) => {
          const text = String(event.row[title] ?? '');
          const time = clock(event.start);
          return (
            `<div class="spg-cal-event spg-cal-chip" tabindex="0" data-row-index="${event.index}" title="${escapeHtml(`${time} ${text}`)}">` +
            `<span class="spg-cal-chip-time">${time}</span> <span class="spg-cal-event-title">${escapeHtml(text)}</span></div>`
          );
        })
        .join('');
      const more = segments.length - MAX_CHIPS;
      const moreText = escapeHtml(moreLabel(more));
      const link =
        more <= 0
          ? ''
          : canOpenDay
            ? `<button type="button" class="spg-cal-more" data-cal-day="${dayId(day)}">${moreText}</button>`
            : `<span class="spg-cal-more">${moreText}</span>`;
      const state = `${new Date(day).getMonth() === month ? '' : ' is-outside'}${day === today ? ' is-today' : ''}`;
      return `<div class="spg-cal-cell${state}" data-day="${dayId(day)}"><span class="spg-cal-daynum">${escapeHtml(number.format(day))}</span>${chips}${link}</div>`;
    })
    .join('');
  return `<div class="spg-cal-month"><div class="spg-cal-month-head">${heads}</div><div class="spg-cal-month-body">${cells}</div></div>`;
}

/**
 * @param {string} view
 * @param {number[]} days
 * @param {number} anchor
 * @param {string} [locale]
 * @returns {string} The range shown: the month, the date of a single day, or e.g. "8–14 พ.ย. 2569".
 */
export function rangeTitle(view, days, anchor, locale) {
  if (view === 'month') {
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(anchor);
  }
  if (days.length === 1) {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(days[0]);
  }
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).formatRange(days[0], days[days.length - 1]);
}
