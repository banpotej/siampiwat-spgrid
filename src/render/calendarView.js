// @ts-check
import {
  CALENDAR_VIEWS,
  DEFAULT_VIEWS,
  daySegments,
  hourRange,
  normalizeEvents,
  placeSegments,
  shiftAnchor,
  startOfDay,
  toTime,
  visibleDays,
} from '../core/calendar.js';
import { DEFAULT_LOCALE } from '../core/filter.js';
import { escapeHtml } from '../utils/escape.js';
import { dayId, renderMonth, rangeTitle } from './calendarMonth.js';
import { renderIcon } from './icons.js';

/** @typedef {import('../calendarTypes.js').CalendarOptions} CalendarOptions */
/** @typedef {import('../calendarTypes.js').CalendarViewName} CalendarViewName */
/** @typedef {import('../core/calendar.js').CalendarEvent} CalendarEvent */
/** @typedef {import('../core/calendar.js').PlacedSegment} PlacedSegment */

const MAX_WEIGHT = 3; // a day with overlapping events grows to this many normal columns; beyond it the boxes narrow
const SHORT_MINUTES = 45; // a box shorter than this gets one line for its title
const pad = (/** @type {number} */ n) => String(n).padStart(2, '0');
const clock = (/** @type {number} */ time) => {
  const date = new Date(time);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
/** A share of the grid as a CSS percentage, rounded so the markup stays short. */
const pct = (/** @type {number} */ part) => `${Math.round(part * 100000) / 1000}%`;

/**
 * @param {unknown} calendar The `calendar` option.
 * @throws {TypeError} not an object, or `start` is not a field name
 * @throws {RangeError} an unknown view, `view` not among `views`, `firstDay` or `hours` out of range, or an unreadable `date`
 */
export function assertCalendar(calendar) {
  const c = /** @type {Partial<CalendarOptions> | null} */ (calendar);
  if (typeof c !== 'object' || c === null || typeof c.start !== 'string' || c.start === '') {
    throw new TypeError('SPGrid: calendar.start must be the name of a row field');
  }
  const names = [...(c.views ?? []), ...(c.view === undefined ? [] : [c.view])];
  for (const name of names) {
    if (!CALENDAR_VIEWS.includes(name))
      throw new RangeError(`SPGrid: unknown calendar view "${name}"`);
  }
  if (c.views && (c.views.length === 0 || (c.view && !c.views.includes(c.view)))) {
    throw new RangeError(
      'SPGrid: calendar.views must be a non-empty list that includes calendar.view',
    );
  }
  if (
    c.firstDay !== undefined &&
    !(Number.isInteger(c.firstDay) && c.firstDay >= 0 && c.firstDay <= 6)
  ) {
    throw new RangeError('SPGrid: calendar.firstDay must be a whole number from 0 to 6');
  }
  const [from, to] = c.hours ?? [0, 24];
  if (!(Number.isInteger(from) && Number.isInteger(to) && from >= 0 && from < to && to <= 24)) {
    throw new RangeError(
      'SPGrid: calendar.hours must be [from, to] whole hours, 0 <= from < to <= 24',
    );
  }
  if (c.date !== undefined && toTime(c.date) === null) {
    throw new RangeError('SPGrid: calendar.date is not a readable date');
  }
}

/** The calendar mode of a grid: which view and day are open, and the markup for the rows shown. */
export class CalendarView {
  #options;
  #labels;
  #icons;
  #locale;
  #views;
  /** @type {CalendarViewName} */ #view;
  #anchor;

  /**
   * @param {CalendarOptions} options Already checked by `assertCalendar`.
   * @param {{ labels: Required<import('../types.js').Labels>, icons: Record<import('../types.js').IconName, string>, locale?: string }} parts
   */
  constructor(options, { labels, icons, locale }) {
    this.#options = {
      end: options.end,
      start: options.start,
      title: options.title ?? 'title',
      subtitle: options.subtitle,
      firstDay: options.firstDay ?? 0,
      hours: options.hours ?? /** @type {[number, number]} */ ([8, 18]),
    };
    this.#labels = labels;
    this.#icons = icons;
    this.#locale = locale ?? DEFAULT_LOCALE;
    this.#views = options.views ?? DEFAULT_VIEWS;
    this.#view = options.view ?? (this.#views.includes('week') ? 'week' : this.#views[0]);
    this.#anchor = toTime(options.date) ?? Date.now();
  }

  /**
   * Act on a click inside the calendar: a view button, Today, Previous or Next.
   *
   * @param {EventTarget | null} target
   * @returns {string | null} CSS selector of the button that was used (to focus it again after drawing), or null when the
   *   click was on something else.
   */
  handle(target) {
    const button =
      target instanceof Element
        ? target.closest('[data-cal], [data-cal-view], [data-cal-day]')
        : null;
    if (!button) return null;
    const action = button.getAttribute('data-cal');
    const view = button.getAttribute('data-cal-view');
    const day = button.getAttribute('data-cal-day'); // "+N more" of a month cell: open that day
    if (day && toTime(day) !== null) {
      this.#anchor = /** @type {number} */ (toTime(day));
      this.#view = 'day';
      return '[data-cal-view="day"]';
    }
    if (action === 'today') this.#anchor = Date.now();
    else if (action === 'prev' || action === 'next') {
      this.#anchor = shiftAnchor(this.#view, this.#anchor, action === 'next' ? 1 : -1);
    } else if (view && this.#views.includes(/** @type {CalendarViewName} */ (view))) {
      this.#view = /** @type {CalendarViewName} */ (view);
    } else return null;
    return action ? `[data-cal="${action}"]` : `[data-cal-view="${view}"]`;
  }

  /**
   * @param {import('../types.js').Row[]} rows The rows to draw; an event's `data-row-index` is its position in this list.
   * @returns {string} HTML of the whole calendar: the bar and the days.
   */
  render(rows) {
    const days = visibleDays(this.#view, this.#anchor, this.#options.firstDay);
    const events = normalizeEvents(rows, this.#options);
    const now = Date.now();
    const view = this.#view;
    const month = { days, anchor: this.#anchor, events, now, locale: this.#locale };
    const body =
      view === 'agenda'
        ? this.#agenda(days, events)
        : view === 'month'
          ? renderMonth({ ...month, ...this.#monthParts() })
          : this.#grid(days, events, now);
    return `<div class="spg-cal" data-view="${this.#view}">${this.#bar(days)}${body}</div>`;
  }

  #monthParts() {
    return {
      title: this.#options.title,
      canOpenDay: this.#views.includes('day'),
      moreLabel: this.#labels.calendarMore,
    };
  }

  /** @param {number[]} days */
  #bar(days) {
    const l = this.#labels;
    const names = /** @type {Record<CalendarViewName, string>} */ ({
      agenda: l.calendarAgenda,
      day: l.calendarDay,
      workWeek: l.calendarWorkWeek,
      week: l.calendarWeek,
      month: l.calendarMonth,
    });
    const nav = (/** @type {'prev' | 'next'} */ action, /** @type {string} */ label) =>
      `<button type="button" class="spg-cal-btn spg-cal-icon" data-cal="${action}" aria-label="${escapeHtml(label)}" title="${escapeHtml(label)}">${renderIcon(this.#icons, action === 'prev' ? 'chevron_left' : 'chevron_right')}</button>`;
    const views = this.#views
      .map(
        (name) =>
          `<button type="button" class="spg-cal-btn" data-cal-view="${name}" aria-pressed="${name === this.#view}">${escapeHtml(names[name])}</button>`,
      )
      .join('');
    return (
      `<div class="spg-cal-bar"><div class="spg-cal-nav">` +
      `<button type="button" class="spg-cal-btn" data-cal="today">${escapeHtml(l.calendarToday)}</button>` +
      `${nav('prev', l.calendarPrev)}${nav('next', l.calendarNext)}` +
      `<span class="spg-cal-title" aria-live="polite">${escapeHtml(rangeTitle(this.#view, days, this.#anchor, this.#locale))}</span></div>` +
      `<div class="spg-cal-views" role="group" aria-label="${escapeHtml(l.calendarViews)}">${views}</div></div>`
    );
  }

  /**
   * @param {CalendarEvent} event
   * @param {string} [style] Inline position of a box in the time grid.
   * @param {boolean} [short] A box too short for more than one line: its title does not wrap.
   * @param {boolean} [narrow] A box sharing its width with more than its day column grew for: the title wraps, the time and subtitle wait for hover.
   * @returns {string}
   */
  #event(event, style = '', short = false, narrow = false) {
    const { row } = event;
    const { title, subtitle } = this.#options;
    const time = `${clock(event.start)}–${clock(event.end)}`;
    const text = String(row[title] ?? '');
    const place = subtitle ? String(row[subtitle] ?? '') : '';
    return (
      `<div class="spg-cal-event${short ? ' is-short' : ''}${narrow ? ' is-narrow' : ''}" tabindex="0" data-row-index="${event.index}"${style} title="${escapeHtml(`${time} ${text}`)}">` +
      `<span class="spg-cal-event-title">${escapeHtml(text)}</span>` +
      `<span class="spg-cal-event-time">${time}</span>` +
      (place ? `<span class="spg-cal-event-sub">${escapeHtml(place)}</span>` : '') +
      `</div>`
    );
  }

  /** @param {number[]} days @param {CalendarEvent[]} events @param {number} now */
  #grid(days, events, now) {
    const placed = days.map((day) => placeSegments(daySegments(events, day)));
    const [first, last] = hourRange(placed.flat(), this.#options.hours);
    const total = (last - first) * 60;
    const weights = placed.map((p) => Math.min(MAX_WEIGHT, Math.max(1, ...p.map((s) => s.cols))));
    const tracks = weights
      .map((w) => `minmax(calc(var(--spg-cal-day-min-width, 0px) * ${w}), ${w}fr)`)
      .join(' ');
    const today = startOfDay(now);
    const weekday = new Intl.DateTimeFormat(this.#locale, { weekday: 'short' });
    const number = new Intl.DateTimeFormat(this.#locale, { day: 'numeric' });
    const heads = days
      .map(
        (day) =>
          `<span class="spg-cal-dayhead${day === today ? ' is-today' : ''}"><span class="spg-cal-dayname">${escapeHtml(weekday.format(day))}</span> <span class="spg-cal-daynum">${escapeHtml(number.format(day))}</span></span>`,
      )
      .join('');
    const hours = Array.from(
      { length: last - first },
      (_, i) =>
        `<span class="spg-cal-hour" style="top:${pct(i / (last - first))}">${pad(first + i)}:00</span>`,
    ).join('');
    const columns = days
      .map((day, i) => {
        const boxes = placed[i]
          .map((seg) =>
            this.#event(
              seg.event,
              this.#box(seg, first * 60, total),
              seg.to - seg.from < SHORT_MINUTES,
              seg.cols > MAX_WEIGHT,
            ),
          )
          .join('');
        const minutes = (now - day) / 60000;
        const line =
          day === today && minutes >= first * 60 && minutes <= last * 60
            ? `<div class="spg-cal-now" style="top:${pct((minutes - first * 60) / total)}"></div>`
            : '';
        return `<div class="spg-cal-col${day === today ? ' is-today' : ''}" data-day="${dayId(day)}">${boxes}${line}</div>`;
      })
      .join('');
    return (
      `<div class="spg-cal-scroll" style="--spg-cal-days:${days.length};--spg-cal-weights:${weights.reduce((a, b) => a + b, 0)};--spg-cal-tracks:${tracks};--spg-cal-hours:${last - first}">` +
      `<div class="spg-cal-head"><span class="spg-cal-corner"></span>${heads}</div>` +
      `<div class="spg-cal-body"><div class="spg-cal-hours">${hours}</div>${columns}</div></div>`
    );
  }

  /** @param {PlacedSegment} seg @param {number} offset Minutes before the grid starts. @param {number} total Minutes in the grid. */
  #box(seg, offset, total) {
    const top = pct((seg.from - offset) / total);
    const height = pct((seg.to - seg.from) / total);
    return ` style="top:${top};height:${height};--spg-cal-h:${height};left:${pct(seg.col / seg.cols)};width:${pct(1 / seg.cols)}"`;
  }

  /** @param {number[]} days @param {CalendarEvent[]} events */
  #agenda(days, events) {
    const format = new Intl.DateTimeFormat(this.#locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const sections = days
      .map((day) => ({ day, segments: daySegments(events, day) }))
      .filter((s) => s.segments.length > 0)
      .map(
        ({ day, segments }) =>
          `<section class="spg-cal-agenda-day" data-day="${dayId(day)}"><div class="spg-cal-agenda-head">${escapeHtml(format.format(day))}</div>` +
          `${segments.map((s) => this.#event(s.event)).join('')}</section>`,
      );
    const none = `<p class="spg-cal-empty">${escapeHtml(this.#labels.calendarNoEvents)}</p>`;
    return `<div class="spg-cal-agenda">${sections.join('') || none}</div>`;
  }
}
