import { afterEach, describe, expect, it, vi } from 'vitest';
import { SPGrid } from '../../src/index.js';

// Thursday 2026-11-12; its week is Sun 8 .. Sat 14. Local times, so the tests do not depend on the time zone.
/** @param {number} d @param {number} h @param {number} [m] */
const at = (d, h, m = 0) => new Date(2026, 10, d, h, m);
const rows = [
  { id: 1, subject: 'Pre CAB review', place: 'Room 1', from: at(9, 11), to: at(9, 12) },
  { id: 2, subject: 'Change meeting', place: 'Teams', from: at(10, 14, 30), to: at(10, 16) },
  { id: 3, subject: 'Migrate API', place: 'Teams', from: at(10, 15), to: at(10, 17) },
  { id: 4, subject: 'Birthday', place: 'HONO', from: at(12, 11, 30), to: at(12, 13) },
  { id: 5, subject: 'Next week', place: 'Room 2', from: at(17, 9), to: at(17, 10) },
];
const columns = [
  { key: 'subject', label: 'Subject' },
  { key: 'place', label: 'Place' },
];
const calendar = { start: 'from', end: 'to', title: 'subject', subtitle: 'place', date: at(12, 9) };

/** @param {object} [options] @param {object} [cal] */
function make(options = {}, cal = {}) {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new SPGrid(el, {
    columns,
    rows,
    rowKey: 'id',
    locale: 'en',
    calendar: { ...calendar, ...cal },
    ...options,
  });
  return { el, grid };
}

/** @param {HTMLElement} el */
const titles = (el) => [...el.querySelectorAll('.spg-cal-event-title')].map((t) => t.textContent);
/** @param {HTMLElement} el @param {string} selector */
const click = (el, selector) =>
  /** @type {HTMLElement} */ (el.querySelector(selector)).dispatchEvent(
    new MouseEvent('click', { bubbles: true }),
  );
/** @param {HTMLElement} el */
const dayNames = (el) =>
  [...el.querySelectorAll('.spg-cal-dayhead')].map(
    (d) =>
      `${d.querySelector('.spg-cal-dayname')?.textContent} ${d.querySelector('.spg-cal-daynum')?.textContent}`,
  );

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('calendar mode', () => {
  it('shows the events of the week instead of a table', () => {
    const { el } = make();
    expect(el.querySelector('table')).toBeNull();
    expect(el.querySelector('.spg-cal')?.getAttribute('data-view')).toBe('week');
    expect(dayNames(el)).toEqual([
      'Sun 8',
      'Mon 9',
      'Tue 10',
      'Wed 11',
      'Thu 12',
      'Fri 13',
      'Sat 14',
    ]);
    expect(titles(el)).toEqual(['Pre CAB review', 'Change meeting', 'Migrate API', 'Birthday']);
  });

  it('puts an event in its day column and sizes it by its time', () => {
    const { el } = make();
    const column = el.querySelector('[data-day="2026-11-12"]');
    const box = /** @type {HTMLElement} */ (column?.querySelector('.spg-cal-event'));
    expect(box.textContent).toContain('Birthday');
    expect(box.textContent).toContain('11:30–13:00');
    expect(box.textContent).toContain('HONO');
    // The grid runs 08:00-18:00 (10 hours): 11:30 is 3.5h in, the event lasts 1.5h.
    expect(box.style.top).toBe('35%');
    expect(box.style.height).toBe('15%');
    expect(box.style.left).toBe('0%');
    expect(box.style.width).toBe('100%');
  });

  it('grows the hours to hold an event outside 08:00-18:00', () => {
    const { el } = make({
      rows: [{ id: 1, subject: 'Early', from: at(12, 6, 30), to: at(12, 7) }],
    });
    expect(el.querySelector('.spg-cal-hour')?.textContent).toBe('06:00');
    expect(el.querySelectorAll('.spg-cal-hour')).toHaveLength(12); // 06:00 .. 17:00
  });

  it('places overlapping events side by side', () => {
    const { el } = make();
    const boxes = /** @type {HTMLElement[]} */ ([
      ...el.querySelectorAll('[data-day="2026-11-10"] .spg-cal-event'),
    ]);
    expect(boxes.map((b) => [b.style.left, b.style.width])).toEqual([
      ['0%', '50%'],
      ['50%', '50%'],
    ]);
  });

  it('keeps each box height in a variable so a hovered box can grow back to full width', () => {
    const { el } = make();
    const box = /** @type {HTMLElement} */ (
      el.querySelector('[data-day="2026-11-10"] .spg-cal-event')
    );
    expect(box.style.getPropertyValue('--spg-cal-h')).toBe(box.style.height);
  });

  it('does not use the table options: no pager, no group headers', () => {
    const { el } = make({ pageSize: 2, groupBy: ['place'] });
    expect(el.querySelector('.spg-pager')).toBeNull();
    expect(titles(el)).toHaveLength(4);
  });

  it('escapes the title and the subtitle', () => {
    const { el } = make({
      rows: [
        {
          id: 1,
          subject: '<img src=x onerror=alert(1)>',
          place: '<b>x</b>',
          from: at(12, 9),
          to: at(12, 10),
        },
      ],
    });
    expect(el.querySelector('.spg-cal img, .spg-cal b')).toBeNull();
    expect(titles(el)[0]).toBe('<img src=x onerror=alert(1)>');
  });

  it('leaves out a row with no readable start', () => {
    const { el } = make({ rows: [...rows, { id: 9, subject: 'No time', from: null }] });
    expect(titles(el)).not.toContain('No time');
  });

  it("draws the current time in today's column only", () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(at(12, 13, 20));
    const { el } = make({}, { date: undefined });
    expect(el.querySelectorAll('.spg-cal-now')).toHaveLength(1);
    expect(el.querySelector('.spg-cal-col.is-today')?.getAttribute('data-day')).toBe('2026-11-12');
    // 13:20 in an 08:00-18:00 grid = 5h20 of 10h.
    expect(/** @type {HTMLElement} */ (el.querySelector('.spg-cal-now')).style.top).toBe('53.333%');
  });
});

describe('views and navigation', () => {
  it('offers the four views and switches between them', () => {
    const { el } = make();
    const buttons = [...el.querySelectorAll('[data-cal-view]')];
    expect(buttons.map((b) => b.textContent)).toEqual(['Agenda', 'Day', 'Work week', 'Week']);
    expect(el.querySelector('[data-cal-view="week"]')?.getAttribute('aria-pressed')).toBe('true');

    click(el, '[data-cal-view="workWeek"]');
    expect(dayNames(el)).toEqual(['Mon 9', 'Tue 10', 'Wed 11', 'Thu 12', 'Fri 13']);
    expect(el.querySelector('[data-cal-view="workWeek"]')?.getAttribute('aria-pressed')).toBe(
      'true',
    );

    click(el, '[data-cal-view="day"]');
    expect(dayNames(el)).toEqual(['Thu 12']);
    expect(titles(el)).toEqual(['Birthday']);
  });

  it('keeps focus on the button that was used', () => {
    const { el } = make();
    /** @type {HTMLElement} */ (el.querySelector('[data-cal="next"]')).focus();
    click(el, '[data-cal="next"]');
    expect(document.activeElement).toBe(el.querySelector('[data-cal="next"]'));
  });

  it('moves by a week (a day in the day view) and back to today', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(at(12, 9));
    const { el } = make();
    click(el, '[data-cal="next"]');
    expect(dayNames(el)[0]).toBe('Sun 15');
    expect(titles(el)).toEqual(['Next week']);
    click(el, '[data-cal="prev"]');
    click(el, '[data-cal="prev"]');
    expect(dayNames(el)[0]).toBe('Sun 1');
    click(el, '[data-cal="today"]');
    expect(dayNames(el)[0]).toBe('Sun 8');
    click(el, '[data-cal-view="day"]');
    click(el, '[data-cal="next"]');
    expect(dayNames(el)).toEqual(['Fri 13']);
  });

  it('lists the days that have events in the agenda, with an empty text otherwise', () => {
    const { el } = make({}, { view: 'agenda' });
    expect([...el.querySelectorAll('.spg-cal-agenda-head')].map((h) => h.textContent)).toEqual([
      'Monday, November 9',
      'Tuesday, November 10',
      'Thursday, November 12',
    ]);
    expect(titles(el)).toEqual(['Pre CAB review', 'Change meeting', 'Migrate API', 'Birthday']);
    click(el, '[data-cal="next"]');
    click(el, '[data-cal="next"]');
    expect(el.querySelector('.spg-cal-empty')?.textContent).toBe('No events');
  });

  it('honours views, view, firstDay and hours', () => {
    const { el } = make({}, { views: ['day', 'week'], view: 'day', firstDay: 1, hours: [9, 12] });
    expect([...el.querySelectorAll('[data-cal-view]')].map((b) => b.textContent)).toEqual([
      'Day',
      'Week',
    ]);
    expect(dayNames(el)).toEqual(['Thu 12']);
    click(el, '[data-cal-view="week"]');
    expect(dayNames(el)[0]).toBe('Mon 9');
    expect(el.querySelector('.spg-cal-hour')?.textContent).toBe('09:00');
    expect(el.querySelectorAll('.spg-cal-hour')).toHaveLength(8); // 09:00 to 17:00: the 14:30-17:00 events push the end past 12:00
  });

  it('uses the Thai labels the grid is given', () => {
    const { el } = make({ labels: { calendarToday: 'วันนี้', calendarWeek: 'สัปดาห์' } });
    expect(el.querySelector('[data-cal="today"]')?.textContent).toBe('วันนี้');
    expect(el.querySelector('[data-cal-view="week"]')?.textContent).toBe('สัปดาห์');
  });
});

describe('with the grid features', () => {
  it('filters the events by the search text and the filter API', () => {
    const { el, grid } = make({ searchable: true });
    const input = /** @type {HTMLInputElement} */ (el.querySelector('input[type="search"], input'));
    input.value = 'teams';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    vi.useFakeTimers();
    vi.runAllTimers();
    grid.setFilter({ search: 'teams' });
    expect(titles(el)).toEqual(['Change meeting', 'Migrate API']);
    grid.setFilter(null);
    expect(titles(el)).toHaveLength(4);
  });

  it('shows the empty text when nothing is left', () => {
    const { el, grid } = make();
    grid.setFilter({ search: 'zzz' });
    expect(el.querySelector('[role="status"]')?.textContent).toBe('No data');
  });

  it('keeps the view and the day across setRows', () => {
    const { el, grid } = make();
    click(el, '[data-cal-view="day"]');
    grid.setRows([{ id: 7, subject: 'Only one', from: at(12, 10), to: at(12, 11) }]);
    expect(dayNames(el)).toEqual(['Thu 12']);
    expect(titles(el)).toEqual(['Only one']);
  });

  it('reports a clicked event through onRowActivate, and Enter on a focused one', () => {
    const onRowActivate = vi.fn();
    const { el } = make({ onRowActivate });
    const birthday = /** @type {HTMLElement} */ (
      [...el.querySelectorAll('.spg-cal-event')].find((e) => e.textContent?.includes('Birthday'))
    );
    birthday
      .querySelector('.spg-cal-event-title')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onRowActivate).toHaveBeenCalledTimes(1);
    expect(onRowActivate.mock.calls[0][0]).toMatchObject({ row: rows[3], rowKey: 4 });

    birthday.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }),
    );
    expect(onRowActivate).toHaveBeenCalledTimes(2);
  });

  it('does not activate on a double-click a second time', () => {
    const onRowActivate = vi.fn();
    const { el } = make({ onRowActivate });
    const box = /** @type {HTMLElement} */ (el.querySelector('.spg-cal-event'));
    for (const type of ['click', 'click', 'dblclick']) {
      box.dispatchEvent(new MouseEvent(type, { bubbles: true }));
    }
    expect(onRowActivate).toHaveBeenCalledTimes(2); // the two clicks; the dblclick adds none
  });

  it('removes its listeners on destroy', () => {
    const { el, grid } = make();
    grid.destroy();
    expect(el.innerHTML).toBe('');
  });
});
