import { describe, expect, it } from 'vitest';
import {
  addDays,
  daySegments,
  hourRange,
  normalizeEvents,
  placeSegments,
  shiftAnchor,
  startOfDay,
  toTime,
  visibleDays,
} from '../../src/core/calendar.js';

// Local times everywhere, so the tests do not depend on the machine's time zone.
/** @param {number} d @param {number} [h] @param {number} [m] */
const at = (d, h = 0, m = 0) => new Date(2026, 10, d, h, m).getTime(); // 2026-11-d (Nov 1 is a Sunday)
/** @param {number[]} days */
const dayNumbers = (days) => days.map((d) => new Date(d).getDate());

describe('toTime', () => {
  it('reads a Date, a timestamp, an ISO string and a date-only string as local midnight', () => {
    expect(toTime(new Date(2026, 10, 5, 9))).toBe(at(5, 9));
    expect(toTime(at(5, 9))).toBe(at(5, 9));
    expect(toTime('2026-11-05T09:00:00')).toBe(at(5, 9));
    expect(toTime('2026-11-05')).toBe(at(5));
  });

  it('returns null for a blank or unreadable value', () => {
    for (const value of [null, undefined, '', 'soon', new Date('x')]) {
      expect(toTime(value)).toBeNull();
    }
  });
});

describe('days', () => {
  it('startOfDay and addDays work in local calendar days', () => {
    expect(startOfDay(at(5, 13, 20))).toBe(at(5));
    expect(addDays(at(30, 9), 3)).toBe(at(33, 9)); // Nov 30 + 3 = Dec 3
    expect(new Date(addDays(at(30, 9), 3)).getMonth()).toBe(11);
  });

  it('shows one day, the week around the anchor, or Monday to Friday', () => {
    expect(dayNumbers(visibleDays('day', at(12, 13)))).toEqual([12]);
    expect(dayNumbers(visibleDays('week', at(12)))).toEqual([8, 9, 10, 11, 12, 13, 14]);
    expect(dayNumbers(visibleDays('agenda', at(12)))).toEqual([8, 9, 10, 11, 12, 13, 14]);
    expect(dayNumbers(visibleDays('workWeek', at(12)))).toEqual([9, 10, 11, 12, 13]);
  });

  it('starts the week on firstDay', () => {
    expect(dayNumbers(visibleDays('week', at(12), 1))).toEqual([9, 10, 11, 12, 13, 14, 15]);
    expect(dayNumbers(visibleDays('week', at(8), 1))).toEqual([2, 3, 4, 5, 6, 7, 8]); // Sunday: the week before
  });

  it('shows whole weeks around the month, and moves by a month', () => {
    // November 2026: Sunday the 1st to Monday the 30th, so five weeks from Sun 1 (Oct 2026 ends Sat 31).
    const nov = dayNumbers(visibleDays('month', at(12)));
    expect(nov).toHaveLength(35);
    expect(nov[0]).toBe(1);
    expect(nov[34]).toBe(5); // Dec 5
    expect(dayNumbers(visibleDays('month', at(12), 1))[0]).toBe(26); // Monday first: Oct 26
    expect(dayNumbers(visibleDays('month', at(12), 1))).toHaveLength(42); // the 30th is a Monday: six weeks
    expect(new Date(shiftAnchor('month', at(12), 1)).getMonth()).toBe(11);
    expect(new Date(shiftAnchor('month', new Date(2026, 0, 31).getTime(), 1)).getDate()).toBe(28); // Feb has no 31st
    expect(new Date(shiftAnchor('month', at(12), -1)).getMonth()).toBe(9);
  });

  it('moves by a day in the day view and by a week otherwise', () => {
    expect(shiftAnchor('day', at(12), 1)).toBe(at(13));
    expect(shiftAnchor('day', at(12), -1)).toBe(at(11));
    expect(shiftAnchor('week', at(12), 1)).toBe(at(19));
    expect(shiftAnchor('workWeek', at(12), -1)).toBe(at(5));
    expect(shiftAnchor('agenda', at(12), 1)).toBe(at(19));
  });
});

describe('normalizeEvents', () => {
  const rows = [
    { id: 1, s: '2026-11-05T09:00:00', e: '2026-11-05T10:00:00' },
    { id: 2, s: '2026-11-05T11:00:00' },
    { id: 3, s: '2026-11-05T12:00:00', e: '2026-11-05T11:00:00' },
    { id: 4, s: null, e: '2026-11-05T11:00:00' },
    { id: 5, s: 'nope' },
  ];
  const events = normalizeEvents(rows, { start: 's', end: 'e' });

  it('drops rows with no readable start and keeps the position in the rows given', () => {
    expect(events.map((e) => [e.index, e.row.id])).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
  });

  it('lasts 30 minutes when the end is missing or not after the start', () => {
    expect(events[0].end).toBe(at(5, 10));
    expect(events[1].end).toBe(at(5, 11, 30));
    expect(events[2].end).toBe(at(5, 12, 30));
    expect(normalizeEvents(rows, { start: 's' })[0].end).toBe(at(5, 9, 30));
  });
});

describe('daySegments', () => {
  const rows = [
    { id: 'late', s: at(5, 14), e: at(5, 15) },
    { id: 'early', s: at(5, 9), e: at(5, 10, 30) },
    { id: 'over', s: at(5, 23), e: at(6, 1) },
    { id: 'other', s: at(7, 9), e: at(7, 10) },
    { id: 'tiny', s: at(5, 12), e: at(5, 12, 1) },
  ];
  const events = normalizeEvents(rows, { start: 's', end: 'e' });

  it('gives the events of the day in minutes since midnight, earliest first', () => {
    const segments = daySegments(events, at(5));
    expect(segments.map((s) => [s.event.row.id, s.from, s.to])).toEqual([
      ['early', 540, 630],
      ['tiny', 720, 735], // drawn at least 15 minutes tall
      ['late', 840, 900],
      ['over', 1380, 1440],
    ]);
  });

  it('clips an event over midnight on each of its days', () => {
    expect(daySegments(events, at(6)).map((s) => [s.event.row.id, s.from, s.to])).toEqual([
      ['over', 0, 60],
    ]);
    expect(daySegments(events, at(8))).toEqual([]);
  });

  it('keeps a start inside the last quarter hour on the grid', () => {
    const [segment] = daySegments(normalizeEvents([{ s: at(5, 23, 55) }], { start: 's' }), at(5));
    expect(segment.from).toBe(1425);
    expect(segment.to).toBe(1440);
  });
});

describe('hourRange', () => {
  /** @param {number} from @param {number} to */
  const seg = (from, to) => ({ event: /** @type {any} */ ({}), from, to });

  it('keeps the wanted hours when every event fits', () => {
    expect(hourRange([seg(600, 660)], [8, 18])).toEqual([8, 18]);
    expect(hourRange([], [8, 18])).toEqual([8, 18]);
  });

  it('grows to whole hours that hold an early or a late event', () => {
    expect(hourRange([seg(390, 450), seg(1100, 1170)], [8, 18])).toEqual([6, 20]);
  });
});

describe('placeSegments', () => {
  /** @param {number} id @param {number} from @param {number} to */
  const seg = (id, from, to) => ({ event: /** @type {any} */ ({ index: id }), from, to });
  /** @param {ReturnType<typeof seg>[]} segments */
  const layout = (segments) => placeSegments(segments).map((s) => [s.event.index, s.col, s.cols]);

  it('gives a lone event the whole width', () => {
    expect(layout([seg(1, 60, 120)])).toEqual([[1, 0, 1]]);
    expect(layout([])).toEqual([]);
  });

  it('puts events that touch end to start in the same column', () => {
    expect(layout([seg(1, 60, 120), seg(2, 120, 180)])).toEqual([
      [1, 0, 1],
      [2, 0, 1],
    ]);
  });

  it('splits overlapping events into side-by-side columns', () => {
    expect(layout([seg(1, 60, 180), seg(2, 90, 150)])).toEqual([
      [1, 0, 2],
      [2, 1, 2],
    ]);
  });

  it('reuses a free column and sizes each cluster on its own', () => {
    // 1 and 2 overlap, 3 fits under 2 in column 1 but 1 still covers column 0; 4 is alone later.
    expect(layout([seg(1, 60, 240), seg(2, 60, 120), seg(3, 120, 180), seg(4, 300, 360)])).toEqual([
      [1, 0, 2],
      [2, 1, 2],
      [3, 1, 2],
      [4, 0, 1],
    ]);
  });

  it('counts three at once as three columns', () => {
    expect(layout([seg(1, 60, 180), seg(2, 70, 180), seg(3, 80, 180)])).toEqual([
      [1, 0, 3],
      [2, 1, 3],
      [3, 2, 3],
    ]);
  });
});
