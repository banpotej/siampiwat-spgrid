import { afterEach, describe, expect, it, vi } from 'vitest';
import { SPGrid, thaiLabels } from '../../src/index.js';
import { allDayOn, daySegments, normalizeEvents } from '../../src/core/calendar.js';
import { eventColor, isColor } from '../../src/render/calendarEvents.js';

// Thursday 2026-11-12; its week is Sun 8 .. Sat 14. Local times, so the tests do not depend on the time zone.
/** @param {number} d @param {number} [h] */
const at = (d, h = 0) => new Date(2026, 10, d, h);
const rows = [
  { id: 1, subject: 'Review', status: 'open', from: at(10, 11), to: at(10, 12) },
  { id: 2, subject: 'Holiday', status: 'void', from: '2026-11-11', to: '2026-11-12', whole: true },
  { id: 3, subject: 'Offsite', status: 'open', from: at(13, 9), whole: 'yes' },
  { id: 4, subject: 'Not all day', status: 'open', from: at(9, 9), to: at(9, 10), whole: false },
];
const columns = [{ key: 'subject', label: 'Subject' }];

/** @param {object} [cal] @param {object} [options] */
function make(cal = {}, options = {}) {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new SPGrid(el, {
    columns,
    rows,
    locale: 'en',
    calendar: {
      start: 'from',
      end: 'to',
      title: 'subject',
      date: at(12, 9),
      allDay: 'whole',
      ...cal,
    },
    ...options,
  });
  return { el, grid };
}
/** @param {ParentNode} el @param {string} selector */
const texts = (el, selector) => [...el.querySelectorAll(selector)].map((n) => n.textContent);
/** @param {HTMLElement} el */
const dayCells = (el) =>
  [...el.querySelectorAll('.spg-cal-allday')].map((cell) => texts(cell, '.spg-cal-event-title'));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('core: all-day events', () => {
  const events = normalizeEvents(rows, { start: 'from', end: 'to', allDay: 'whole' });

  it('covers whole days, the day of the end included', () => {
    const holiday = events.find((e) => e.row.id === 2);
    expect(holiday?.allDay).toBe(true);
    expect(holiday?.start).toBe(at(11).getTime());
    expect(holiday?.end).toBe(at(13).getTime());
  });

  it('lasts one day without a usable end, and reads true, 1 and yes only', () => {
    const offsite = events.find((e) => e.row.id === 3);
    expect([offsite?.start, offsite?.end]).toEqual([at(13).getTime(), at(14).getTime()]);
    expect(events.find((e) => e.row.id === 4)?.allDay).toBeUndefined();
    const isAllDay = (/** @type {unknown} */ whole) =>
      normalizeEvents([{ from: at(9), whole }], { start: 'from', allDay: 'whole' })[0].allDay ===
      true;
    expect(['no', 0, null, undefined, 'false', ''].map(isAllDay)).toEqual(Array(6).fill(false));
    expect([true, 1, 'TRUE', ' 1 ', 'yes'].map(isAllDay)).toEqual(Array(5).fill(true));
  });

  it('is not an all-day event without the allDay field name', () => {
    const plain = normalizeEvents(rows, { start: 'from', end: 'to' });
    expect(plain.some((e) => e.allDay)).toBe(false);
  });

  it('allDayOn lists the events touching a day; daySegments leaves them out', () => {
    expect(allDayOn(events, at(11).getTime()).map((e) => e.row.id)).toEqual([2]);
    expect(allDayOn(events, at(12).getTime()).map((e) => e.row.id)).toEqual([2]);
    expect(allDayOn(events, at(13).getTime()).map((e) => e.row.id)).toEqual([3]);
    expect(allDayOn(events, at(10).getTime())).toEqual([]);
    expect(daySegments(events, at(11).getTime())).toEqual([]);
  });
});

describe('the all-day row of the time grid', () => {
  it('shows all-day events in their days, not in the time grid', () => {
    const { el } = make();
    expect(dayCells(el)).toEqual([[], [], [], ['Holiday'], ['Holiday'], ['Offsite'], []]);
    expect(el.querySelector('.spg-cal-allday-label')?.textContent).toBe('All day');
    expect(texts(el, '.spg-cal-col .spg-cal-event-title').sort()).toEqual([
      'Not all day',
      'Review',
    ]);
    expect(el.querySelector('.spg-cal-head .spg-cal-chip')).not.toBeNull();
  });

  it('is left out when no day shown holds one, and in the day view lists only that day', () => {
    const { el, grid } = make({ date: at(1) });
    expect(el.querySelector('.spg-cal-allday')).toBeNull();
    grid.setCalendarView({ view: 'day', date: at(12) });
    expect(dayCells(el)).toEqual([['Holiday']]);
  });

  it('is translated by labels.calendarAllDay', () => {
    const { el } = make({}, { labels: thaiLabels });
    expect(el.querySelector('.spg-cal-allday-label')?.textContent).toBe('ตลอดวัน');
  });

  it('activates the row on a click, like any event', () => {
    const spy = vi.fn();
    const { el } = make({}, { onRowActivate: spy });
    /** @type {HTMLElement} */ (el.querySelector('.spg-cal-allday .spg-cal-event')).click();
    expect(spy.mock.calls[0][0].row.subject).toBe('Holiday');
  });
});

describe('all-day events in the agenda and the month', () => {
  it('lists them first in their day, with the label instead of the times', () => {
    const more = [{ id: 9, subject: 'Standup', from: at(11, 8), to: at(11, 9) }, ...rows];
    const { el } = make({ view: 'agenda' }, { rows: more });
    const wed = /** @type {HTMLElement} */ (el.querySelector('[data-day="2026-11-11"]'));
    expect(texts(wed, '.spg-cal-event-title')).toEqual(['Holiday', 'Standup']);
    expect(wed.querySelector('.spg-cal-event-time')?.textContent).toBe('All day');
  });

  it('shows a day that only has an all-day event', () => {
    const { el } = make({ view: 'agenda' });
    expect(el.querySelector('[data-day="2026-11-13"]')).not.toBeNull();
  });

  it('puts them before timed events in a month cell, without a time', () => {
    const more = [{ id: 9, subject: 'Standup', from: at(11, 8), to: at(11, 9) }, ...rows];
    const { el } = make({ view: 'month', views: ['month'] }, { rows: more });
    const cell = /** @type {HTMLElement} */ (el.querySelector('[data-day="2026-11-11"]'));
    expect(texts(cell, '.spg-cal-event-title')).toEqual(['Holiday', 'Standup']);
    expect(cell.querySelectorAll('.spg-cal-chip-time').length).toBe(1);
    expect(cell.querySelector('.spg-cal-chip.is-all-day')).not.toBeNull();
  });
});

describe('calendar.color and calendar.colors', () => {
  /** @param {HTMLElement} el @param {string} title */
  const styleOf = (el, title) =>
    [...el.querySelectorAll('.spg-cal-event')]
      .find((e) => e.querySelector('.spg-cal-event-title')?.textContent === title)
      ?.getAttribute('style') ?? '';

  it('maps the value of a row field to a colour', () => {
    const { el } = make({ color: 'status', colors: { open: '#2e7d32', void: 'gray' } });
    expect(styleOf(el, 'Review')).toContain('--spg-cal-event-color:#2e7d32');
    expect(styleOf(el, 'Holiday')).toContain('--spg-cal-event-color:gray');
  });

  it('keeps the position of a box next to the colour', () => {
    const { el } = make({ color: 'status', colors: { open: 'teal' } });
    const style = styleOf(el, 'Review');
    expect(style).toContain('top:');
    expect(style).toContain('--spg-cal-event-color:teal');
  });

  it('reads the field as the colour itself without colors', () => {
    const tinted = rows.map((r) => ({ ...r, tint: r.id === 1 ? 'rgb(10, 20, 30)' : undefined }));
    const { el } = make({ color: 'tint' }, { rows: tinted });
    expect(styleOf(el, 'Review')).toContain('--spg-cal-event-color:rgb(10, 20, 30)');
    expect(styleOf(el, 'Offsite')).not.toContain('--spg-cal-event-color');
  });

  it('colours chips and agenda rows too, and leaves unlisted values on the accent', () => {
    const cal = { color: 'status', colors: { void: '#c00' } };
    const agenda = make({ ...cal, view: 'agenda' });
    expect(styleOf(agenda.el, 'Holiday')).toContain('#c00');
    expect(styleOf(agenda.el, 'Review')).not.toContain('--spg-cal-event-color');
    const month = make({ ...cal, view: 'month', views: ['month'] });
    expect(styleOf(month.el, 'Holiday')).toContain('#c00');
  });

  it('never lets a value carry other CSS or markup', () => {
    const hostile = [
      'red; background:url(x)',
      'url(javascript:alert(1))',
      '"><img src=x onerror=alert(1)>',
      'expression(alert(1))',
      'rgb(0,0,0); color: red',
      '',
    ];
    for (const tint of hostile) {
      const only = [{ id: 1, subject: 'X', from: at(10, 9), tint }];
      const { el } = make({ color: 'tint' }, { rows: only });
      expect(styleOf(el, 'X')).not.toContain('--spg-cal-event-color');
      expect(el.querySelector('img')).toBeNull();
    }
  });

  it('isColor and eventColor accept hex, names, rgb and hsl only', () => {
    const good = ['#0a7', '#00aa77', '#00aa77cc', 'teal', 'rgb(1,2,3)', 'hsla(10 20% 30% / 0.5)'];
    const bad = ['', 'a;b', 'url(x)', 'var(--x)', 12, null, '#12', 'red blue'];
    expect(good.map(isColor)).toEqual(good.map(() => true));
    expect(bad.map(isColor)).toEqual(bad.map(() => false));
    expect(eventColor({ k: 'constructor' }, { color: 'k', colors: {} })).toBeNull();
    expect(eventColor({ k: 'a' }, {})).toBeNull();
  });
});

describe('option checks', () => {
  /** @param {object} cal */
  const build = (cal) => () => make(cal);

  it('rejects a bad allDay, color or colors', () => {
    expect(build({ allDay: '' })).toThrow(TypeError);
    expect(build({ allDay: 3 })).toThrow(TypeError);
    expect(build({ color: 7 })).toThrow(TypeError);
    expect(build({ colors: [] })).toThrow(TypeError);
    expect(build({ colors: 'red' })).toThrow(TypeError);
    expect(build({ colors: { open: 'red;x' } })).toThrow(RangeError);
    expect(build({ colors: { open: 5 } })).toThrow(RangeError);
  });
});
