// @ts-check

/** @typedef {import('../calendarTypes.js').CalendarViewName} CalendarViewName */
/** @typedef {import('../types.js').Row} Row */
/** @typedef {{ index: number, row: Row, start: number, end: number }} CalendarEvent `index`: position in the rows given. */
/** @typedef {{ event: CalendarEvent, from: number, to: number }} DaySegment `from` / `to`: minutes since midnight. */
/** @typedef {DaySegment & { col: number, cols: number }} PlacedSegment The side-by-side column of an overlapping event. */

export const CALENDAR_VIEWS = /** @type {CalendarViewName[]} */ ([
  'agenda',
  'day',
  'workWeek',
  'week',
  'month',
]);
/** The views offered when `calendar.views` is not set ('month' is opt-in). */
export const DEFAULT_VIEWS = CALENDAR_VIEWS.filter((v) => v !== 'month');

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DEFAULT_MINUTES = 30; // an event without an end (or ending before it starts)
const MIN_MINUTES = 15; // the shortest box drawn, so a short event stays visible and clickable

/**
 * @param {unknown} value A Date, a timestamp, an ISO string, or 'YYYY-MM-DD' (midnight of that day, local time).
 * @returns {number | null} Milliseconds since the epoch, or null for a blank or unreadable value.
 */
export function toTime(value) {
  if (value === null || value === undefined || value === '') return null;
  let time;
  const day = typeof value === 'string' ? DATE_ONLY.exec(value) : null;
  if (day) time = new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])).getTime();
  else if (value instanceof Date) time = value.getTime();
  else time = new Date(/** @type {string | number} */ (value)).getTime();
  return Number.isNaN(time) ? null : time;
}

/** @param {number} time @returns {number} Local midnight of that day. */
export function startOfDay(time) {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

/** @param {number} time @param {number} count @returns {number} `count` calendar days later, at the same local time. */
export function addDays(time, count) {
  const date = new Date(time);
  date.setDate(date.getDate() + count);
  return date.getTime();
}

/**
 * The days a view shows, as local midnights: one for 'day', else the week around `anchor` (Monday to Friday for
 * 'workWeek'). 'agenda' lists the same days as 'week'. 'month' gives whole weeks, from the one holding the 1st to the one
 * holding the last day of the month.
 *
 * @param {CalendarViewName} view
 * @param {number} anchor Any moment inside the day or week to show.
 * @param {number} [firstDay] First day of the week, 0 (Sunday) to 6.
 * @returns {number[]}
 */
export function visibleDays(view, anchor, firstDay = 0) {
  const day = startOfDay(anchor);
  if (view === 'day') return [day];
  const offset = (new Date(day).getDay() - firstDay + 7) % 7;
  if (view === 'month') {
    const date = new Date(day);
    const gridStart = addDays(day, -date.getDate() + 1);
    const gridOffset = (new Date(gridStart).getDay() - firstDay + 7) % 7;
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).getTime();
    const weeks = Math.ceil((gridOffset + new Date(monthEnd).getDate()) / 7);
    return Array.from({ length: weeks * 7 }, (_, i) => addDays(gridStart, i - gridOffset));
  }
  const first = addDays(day, -offset);
  const week = Array.from({ length: 7 }, (_, i) => addDays(first, i));
  return view === 'workWeek' ? week.filter((d) => ![0, 6].includes(new Date(d).getDay())) : week;
}

/**
 * @param {CalendarViewName} view
 * @param {number} anchor
 * @param {1 | -1} direction
 * @returns {number} One day away for 'day', one month for 'month' (the day number is kept, or the month's last day), else
 *   one week.
 */
export function shiftAnchor(view, anchor, direction) {
  if (view === 'month') {
    const date = new Date(anchor);
    const target = new Date(date.getFullYear(), date.getMonth() + direction, 1);
    const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
    target.setHours(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
    target.setDate(Math.min(date.getDate(), last));
    return target.getTime();
  }
  return addDays(anchor, (view === 'day' ? 1 : 7) * direction);
}

/**
 * The rows that have a readable start as events, in the order given. An end that is missing, unreadable or not after the
 * start becomes 30 minutes after it.
 *
 * @param {Row[]} rows
 * @param {{ start: string, end?: string }} fields Row fields holding the times.
 * @returns {CalendarEvent[]}
 */
export function normalizeEvents(rows, { start, end }) {
  /** @type {CalendarEvent[]} */
  const events = [];
  rows.forEach((row, index) => {
    const from = toTime(row[start]);
    if (from === null) return;
    const to = end === undefined ? null : toTime(row[end]);
    const last = to !== null && to > from ? to : from + DEFAULT_MINUTES * 60000;
    events.push({ index, row, start: from, end: last });
  });
  return events;
}

/**
 * The part of each event that falls on `day`, clipped to that day, earliest first (an event over midnight gives a
 * segment on each of its days).
 *
 * @param {CalendarEvent[]} events
 * @param {number} day Local midnight.
 * @returns {DaySegment[]}
 */
export function daySegments(events, day) {
  const next = addDays(day, 1);
  /** @type {DaySegment[]} */
  const segments = [];
  for (const event of events) {
    if (event.end <= day || event.start >= next) continue;
    const from = (Math.max(event.start, day) - day) / 60000;
    const to = (Math.min(event.end, next) - day) / 60000;
    const top = Math.min(from, 1440 - MIN_MINUTES);
    segments.push({ event, from: top, to: Math.max(to, top + MIN_MINUTES) });
  }
  return segments.sort((a, b) => a.from - b.from || b.to - a.to || a.event.index - b.event.index);
}

/**
 * The hours the time grid covers: `[from, to]` grown to hold every segment (whole hours).
 *
 * @param {DaySegment[]} segments
 * @param {[number, number]} hours The wanted range, 0 <= from < to <= 24.
 * @returns {[number, number]}
 */
export function hourRange(segments, [from, to]) {
  const first = Math.min(from * 60, ...segments.map((s) => s.from));
  const last = Math.max(to * 60, ...segments.map((s) => s.to));
  return [Math.floor(first / 60), Math.ceil(last / 60)];
}

/**
 * Put overlapping segments side by side: each gets a column (`col`) and the number of columns its cluster of overlapping
 * segments needs (`cols`), so a box is 1 / `cols` of the day's width.
 *
 * @param {DaySegment[]} segments Earliest first, as `daySegments` returns them.
 * @returns {PlacedSegment[]}
 */
export function placeSegments(segments) {
  /** @type {PlacedSegment[]} */
  const placed = [];
  /** @type {PlacedSegment[]} */
  let cluster = [];
  /** @type {number[]} End of the last segment in each column of the cluster. */
  let ends = [];
  let clusterEnd = 0;
  const flush = () => {
    for (const item of cluster) item.cols = ends.length;
    placed.push(...cluster);
    cluster = [];
    ends = [];
  };
  for (const segment of segments) {
    if (segment.from >= clusterEnd) flush();
    let col = ends.findIndex((end) => end <= segment.from);
    if (col === -1) col = ends.length;
    ends[col] = segment.to;
    clusterEnd = cluster.length === 0 ? segment.to : Math.max(clusterEnd, segment.to);
    cluster.push({ ...segment, col, cols: 1 });
  }
  flush();
  return placed;
}
