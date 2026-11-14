// @ts-check
import { CALENDAR_VIEWS, toTime } from '../core/calendar.js';
import { isColor } from './calendarEvents.js';

/** @typedef {import('../calendarTypes.js').CalendarOptions} CalendarOptions */

/**
 * @param {unknown} calendar The `calendar` option.
 * @throws {TypeError} not an object, `start`, `allDay` or `color` is not a field name, or `colors` is not an object
 * @throws {RangeError} a `colors` entry that is not a colour, an unknown view, `view` not among `views`, `firstDay` or `hours` out of range, or an unreadable `date`
 */
export function assertCalendar(calendar) {
  const c = /** @type {Partial<CalendarOptions> | null} */ (calendar);
  if (typeof c !== 'object' || c === null || typeof c.start !== 'string' || c.start === '') {
    throw new TypeError('SPGrid: calendar.start must be the name of a row field');
  }
  for (const field of /** @type {const} */ (['allDay', 'color'])) {
    if (c[field] !== undefined && (typeof c[field] !== 'string' || c[field] === '')) {
      throw new TypeError(`SPGrid: calendar.${field} must be the name of a row field`);
    }
  }
  if (c.colors !== undefined) {
    if (typeof c.colors !== 'object' || c.colors === null || Array.isArray(c.colors)) {
      throw new TypeError('SPGrid: calendar.colors must be an object of colours');
    }
    for (const [value, color] of Object.entries(c.colors)) {
      if (!isColor(color))
        throw new RangeError(`SPGrid: calendar.colors["${value}"] is not a colour`);
    }
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
