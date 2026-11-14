import { afterEach, describe, expect, it, vi } from 'vitest';
import { SPGrid } from '../../src/index.js';

// Thursday 2026-11-12; its week is Sun 8 .. Sat 14. Local times, so the tests do not depend on the time zone.
/** @param {number} d @param {number} [h] */
const at = (d, h = 0) => new Date(2026, 10, d, h);
const rows = [
  { id: 1, subject: 'Review', from: at(9, 11), to: at(9, 12) },
  { id: 2, subject: 'Next week', from: at(17, 9), to: at(17, 10) },
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
    calendar: { start: 'from', end: 'to', title: 'subject', date: at(12, 9), ...cal },
    ...options,
  });
  return { el, grid };
}
/** @param {HTMLElement} el @param {string} selector */
const click = (el, selector) =>
  /** @type {HTMLElement} */ (el.querySelector(selector)).dispatchEvent(
    new MouseEvent('click', { bubbles: true }),
  );
/** @param {HTMLElement} el */
const titles = (el) => [...el.querySelectorAll('.spg-cal-event-title')].map((t) => t.textContent);

afterEach(() => {
  document.body.innerHTML = '';
});

describe('getCalendarView', () => {
  it('reports the view, the moment and the days it covers (end exclusive)', () => {
    const { grid } = make();
    const state = /** @type {any} */ (grid.getCalendarView());
    expect(state.view).toBe('week');
    expect(state.date).toEqual(at(12, 9));
    expect(state.start).toEqual(at(8));
    expect(state.end).toEqual(at(15));
  });

  it('covers a single day, a work week and the weeks of a month', () => {
    const { grid } = make({ views: ['day', 'workWeek', 'month'] });
    grid.setCalendarView({ view: 'day' });
    expect(grid.getCalendarView()?.start).toEqual(at(12));
    expect(grid.getCalendarView()?.end).toEqual(at(13));
    grid.setCalendarView({ view: 'workWeek' });
    expect(grid.getCalendarView()?.start).toEqual(at(9));
    expect(grid.getCalendarView()?.end).toEqual(at(14)); // Friday 13 is the last day
    grid.setCalendarView({ view: 'month' });
    expect(grid.getCalendarView()?.start).toEqual(new Date(2026, 10, 1));
    expect(grid.getCalendarView()?.end).toEqual(new Date(2026, 11, 6));
  });

  it('is null without the calendar option', () => {
    const el = document.createElement('div');
    expect(new SPGrid(el, { columns, rows }).getCalendarView()).toBeNull();
  });

  it('returns a copy', () => {
    const { grid } = make();
    /** @type {any} */ (grid.getCalendarView()).date.setFullYear(1999);
    expect(grid.getCalendarView()?.date).toEqual(at(12, 9));
  });
});

describe('setCalendarView', () => {
  it('opens another day and redraws', () => {
    const { el, grid } = make();
    expect(titles(el)).toEqual(['Review']);
    grid.setCalendarView({ date: at(17, 9) });
    expect(titles(el)).toEqual(['Next week']);
    expect(grid.getCalendarView()?.start).toEqual(at(15));
  });

  it('opens another view and keeps the omitted day', () => {
    const { el, grid } = make();
    grid.setCalendarView({ view: 'day' });
    expect(el.querySelector('.spg-cal')?.getAttribute('data-view')).toBe('day');
    expect(grid.getCalendarView()?.date).toEqual(at(12, 9));
  });

  it('accepts a date string or a timestamp', () => {
    const { grid } = make();
    grid.setCalendarView({ date: '2026-11-17' });
    expect(grid.getCalendarView()?.start).toEqual(at(15));
    grid.setCalendarView({ date: at(10).getTime() });
    expect(grid.getCalendarView()?.start).toEqual(at(8));
  });

  it('throws on a view that is not offered, an unreadable date, or no calendar', () => {
    const { grid } = make({ views: ['day', 'week'] });
    expect(() => grid.setCalendarView({ view: 'month' })).toThrow(RangeError);
    expect(() => grid.setCalendarView({ date: 'nope' })).toThrow(RangeError);
    const plain = new SPGrid(document.createElement('div'), { columns, rows });
    expect(() => plain.setCalendarView({ view: 'day' })).toThrow(RangeError);
    expect(grid.getCalendarView()?.view).toBe('week');
  });

  it('does nothing after destroy', () => {
    const { grid } = make();
    grid.destroy();
    expect(() => grid.setCalendarView({ view: 'day' })).not.toThrow();
  });
});

describe('calendarChange', () => {
  it('fires once per move from the buttons, with the new state', () => {
    const spy = vi.fn();
    const { el, grid } = make({ views: ['day', 'week'] }, { onCalendarChange: spy });
    const other = vi.fn();
    grid.on('calendarChange', other);
    click(el, '[data-cal="next"]');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(other).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].start).toEqual(at(15));
    click(el, '[data-cal-view="day"]');
    expect(spy.mock.calls[1][0].view).toBe('day');
    click(el, '[data-cal="prev"]');
    expect(spy.mock.calls[2][0].start).toEqual(at(18)); // the day view moved a day back
  });

  it('fires for setCalendarView and not when nothing moves', () => {
    const { el, grid } = make();
    const spy = vi.fn();
    grid.on('calendarChange', spy);
    grid.setCalendarView({ view: 'week' });
    grid.setCalendarView({ date: at(10) }); // another day, same week
    click(el, '[data-cal-view="week"]');
    expect(spy).not.toHaveBeenCalled();
    grid.setCalendarView({ date: at(17) });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('fires when Today moves the calendar, and the unsubscribe works', () => {
    const { el, grid } = make({ date: at(1) }); // not the week of the real today
    const spy = vi.fn();
    const off = grid.on('calendarChange', spy);
    click(el, '[data-cal="today"]');
    expect(spy).toHaveBeenCalledTimes(1);
    off();
    click(el, '[data-cal="next"]');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('fires when a month cell opens its day', () => {
    const many = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      subject: `E${i}`,
      from: at(12, 8 + i),
    }));
    const { el, grid } = make({ views: ['day', 'month'], view: 'month' }, { rows: many });
    const spy = vi.fn();
    grid.on('calendarChange', spy);
    click(el, '[data-cal-day]');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].view).toBe('day');
    expect(grid.getCalendarView()?.start).toEqual(at(12));
  });
});
