// @ts-check

/** @typedef {'agenda' | 'day' | 'workWeek' | 'week' | 'month'} CalendarViewName */

/**
 * @typedef {object} CalendarOptions The `calendar` option: show the rows as events on a calendar instead of a table.
 * @property {string} start Row field with the start: a Date, a timestamp, an ISO string, or 'YYYY-MM-DD' (midnight of that
 *   day). A row whose start is blank or unreadable is not drawn.
 * @property {string} [end] Row field with the end (same kinds as `start`). An event with no end, or one that is not after
 *   its start, lasts 30 minutes. An event over midnight is drawn on each day it touches.
 * @property {string} [title] Row field shown as the event's title (escaped); default 'title'.
 * @property {string} [subtitle] Row field shown under the title, e.g. the place (escaped).
 * @property {CalendarViewName} [view] The view to open on; default 'week'.
 * @property {CalendarViewName[]} [views] The views the buttons offer, in order; default the four without 'month':
 *   'agenda', 'day', 'workWeek' (Monday to Friday) and 'week'; add 'month' (a grid of the weeks of the month, a few events
 *   per day and a "+N more" that opens the day) to get a month view.
 * @property {Date | string | number} [date] A moment inside the day or week to open on; default now.
 * @property {number} [firstDay] First day of the week, 0 (Sunday) to 6 (Saturday); default 0.
 * @property {[number, number]} [hours] The hours the time grid shows at least, `[from, to]` with 0 <= from < to <= 24; it
 *   grows to hold the events of the days shown. Default `[8, 18]`.
 */

export {};
