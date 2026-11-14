// @ts-check
import {
  addDays,
  allDayOn,
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
import { chipHtml, eventHtml, pad } from './calendarEvents.js';
import { dayId, renderMonth, rangeTitle } from './calendarMonth.js';
import { renderIcon } from './icons.js';

/** @typedef {import('../calendarTypes.js').CalendarOptions} CalendarOptions */
/** @typedef {import('../calendarTypes.js').CalendarViewName} CalendarViewName */
/** @typedef {import('../calendarTypes.js').CalendarState} CalendarState */
/** @typedef {import('../core/calendar.js').CalendarEvent} CalendarEvent */
/** @typedef {import('../core/calendar.js').PlacedSegment} PlacedSegment */

const MAX_WEIGHT = 3; // a day with overlapping events grows to this many normal columns; beyond it the boxes narrow
const SHORT_MINUTES = 45; // a box shorter than this gets one line for its title
/** A share of the grid as a CSS percentage, rounded so the markup stays short. */
const pct = (/** @type {number} */ part) => `${Math.round(part * 100000) / 1000}%`;

/** The calendar mode of a grid: which view and day are open, and the markup for the rows shown. */
export class CalendarView {
  #options;
  /** @type {import('./calendarEvents.js').EventLook} */ #look;
  #labels;
  #icons;
  #locale;
  #views;
  /** @type {CalendarViewName} */ #view;
  #anchor;
  #onChange;

  /**
   * @param {CalendarOptions} options Already checked by `assertCalendar`.
   * @param {{ labels: Required<import('../types.js').Labels>, icons: Record<import('../types.js').IconName, string>, locale?: string, onChange?: (state: CalendarState) => void }} parts
   *   `onChange` is called when a click or `set` moves the calendar to another view or range of days.
   */
  constructor(options, { labels, icons, locale, onChange }) {
    this.#options = {
      end: options.end,
      start: options.start,
      title: options.title ?? 'title',
      subtitle: options.subtitle,
      allDay: options.allDay,
      firstDay: options.firstDay ?? 0,
      hours: options.hours ?? /** @type {[number, number]} */ ([8, 18]),
    };
    this.#look = {
      title: options.title ?? 'title',
      subtitle: options.subtitle,
      color: options.color,
      colors: options.colors,
      allDayLabel: labels.calendarAllDay,
    };
    this.#labels = labels;
    this.#onChange = onChange;
    this.#icons = icons;
    this.#locale = locale ?? DEFAULT_LOCALE;
    this.#views = options.views ?? DEFAULT_VIEWS;
    this.#view = options.view ?? (this.#views.includes('week') ? 'week' : this.#views[0]);
    this.#anchor = toTime(options.date) ?? Date.now();
  }

  /** @returns {CalendarState} The open view, a moment inside it, and the days it covers (`end` is exclusive). */
  get state() {
    const days = visibleDays(this.#view, this.#anchor, this.#options.firstDay);
    const last = /** @type {number} */ (days.at(-1));
    return {
      view: this.#view,
      date: new Date(this.#anchor),
      start: new Date(days[0]),
      end: new Date(addDays(last, 1)),
    };
  }

  /**
   * Open another view and / or day, as the buttons do.
   *
   * @param {{ view?: CalendarViewName, date?: Date | string | number }} next Omitted parts stay.
   * @throws {RangeError} `view` is not among the offered views, or `date` is not readable
   */
  set({ view, date }) {
    if (view !== undefined && !this.#views.includes(view)) {
      throw new RangeError(`SPGrid: calendar view "${view}" is not among calendar.views`);
    }
    const time = date === undefined ? this.#anchor : toTime(date);
    if (time === null) throw new RangeError('SPGrid: the calendar date is not a readable date');
    this.#move(() => {
      this.#view = view ?? this.#view;
      this.#anchor = time;
    });
  }

  /** @param {() => void} change Moves the view or the anchor; `onChange` hears of it if the range differs. */
  #move(change) {
    const before = this.state;
    change();
    const after = this.state;
    const same = before.view === after.view && before.start.getTime() === after.start.getTime();
    if (!same) this.#onChange?.(after);
  }

  /**
   * Act on a click inside the calendar: a view button, Today, Previous or Next.
   *
   * @param {EventTarget | null} target
   * @returns {string | null} CSS selector of the button that was used (to focus it again after drawing), or null when the
   *   click was on something else.
   */
  handle(target) {
    /** @type {string | null} */
    let used = null;
    this.#move(() => {
      used = this.#click(target);
    });
    return used;
  }

  /** @param {EventTarget | null} target @returns {string | null} */
  #click(target) {
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
      look: this.#look,
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
    const allDay = days.map((day) => allDayOn(events, day));
    const allDayRow = allDay.some((list) => list.length)
      ? `<span class="spg-cal-corner spg-cal-allday-label">${escapeHtml(this.#labels.calendarAllDay)}</span>` +
        allDay
          .map(
            (list) =>
              `<div class="spg-cal-allday">${list.map((e) => chipHtml(e, this.#look)).join('')}</div>`,
          )
          .join('')
      : '';
    const hours = Array.from(
      { length: last - first },
      (_, i) =>
        `<span class="spg-cal-hour" style="top:${pct(i / (last - first))}">${pad(first + i)}:00</span>`,
    ).join('');
    const columns = days
      .map((day, i) => {
        const boxes = placed[i]
          .map((seg) =>
            eventHtml(seg.event, this.#look, {
              css: this.#box(seg, first * 60, total),
              short: seg.to - seg.from < SHORT_MINUTES,
              narrow: seg.cols > MAX_WEIGHT,
            }),
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
      `<div class="spg-cal-head"><span class="spg-cal-corner"></span>${heads}${allDayRow}</div>` +
      `<div class="spg-cal-body"><div class="spg-cal-hours">${hours}</div>${columns}</div></div>`
    );
  }

  /** @param {PlacedSegment} seg @param {number} offset Minutes before the grid starts. @param {number} total Minutes in the grid. */
  #box(seg, offset, total) {
    const top = pct((seg.from - offset) / total);
    const height = pct((seg.to - seg.from) / total);
    return `top:${top};height:${height};--spg-cal-h:${height};left:${pct(seg.col / seg.cols)};width:${pct(1 / seg.cols)}`;
  }

  /** @param {number[]} days @param {CalendarEvent[]} events */
  #agenda(days, events) {
    const format = new Intl.DateTimeFormat(this.#locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
    const sections = days
      .map((day) => ({
        day,
        list: [...allDayOn(events, day), ...daySegments(events, day).map((s) => s.event)],
      }))
      .filter((s) => s.list.length > 0)
      .map(
        ({ day, list }) =>
          `<section class="spg-cal-agenda-day" data-day="${dayId(day)}"><div class="spg-cal-agenda-head">${escapeHtml(format.format(day))}</div>` +
          `${list.map((e) => eventHtml(e, this.#look)).join('')}</section>`,
      );
    const none = `<p class="spg-cal-empty">${escapeHtml(this.#labels.calendarNoEvents)}</p>`;
    return `<div class="spg-cal-agenda">${sections.join('') || none}</div>`;
  }
}
