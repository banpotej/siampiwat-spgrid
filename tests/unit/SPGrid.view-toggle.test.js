import { afterEach, describe, expect, it, vi } from 'vitest';
import { SPGrid, thaiLabels } from '../../src/index.js';

/** @param {number} d @param {number} h */
const at = (d, h) => new Date(2026, 10, d, h);
const rows = [
  { id: 1, subject: 'Pre CAB review', place: 'Room 1', from: at(9, 11), to: at(9, 12) },
  { id: 2, subject: 'Change meeting', place: 'Teams', from: at(10, 14), to: at(10, 15) },
  { id: 3, subject: 'Birthday', place: 'HONO', from: at(12, 11), to: at(12, 13) },
];
const columns = [
  { key: 'subject', label: 'Subject' },
  { key: 'place', label: 'Place' },
];
const calendar = { start: 'from', end: 'to', title: 'subject', date: at(12, 9) };

/** @param {object} [options] */
function make(options = {}) {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new SPGrid(el, {
    columns,
    rows,
    rowKey: 'id',
    locale: 'en',
    calendar,
    defaultView: 'grid',
    viewToggle: true,
    ...options,
  });
  return { el, grid };
}

/** @param {HTMLElement} el */
const button = (el) => /** @type {HTMLButtonElement} */ (el.querySelector('.spg-view-toggle'));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('viewToggle', () => {
  it('starts on the table and names the button for the calendar', () => {
    const { el, grid } = make();
    expect(grid.getView()).toBe('grid');
    expect(el.querySelector('table')).not.toBeNull();
    expect(el.querySelector('.spg-cal')).toBeNull();
    expect(button(el).getAttribute('aria-label')).toBe('Show as calendar');
    expect(button(el).title).toBe('Show as calendar');
    expect(button(el).querySelector('[data-icon="calendar_today"]')).not.toBeNull();
  });

  it('switches to the calendar and back on a click', () => {
    const { el, grid } = make();
    button(el).click();
    expect(grid.getView()).toBe('calendar');
    expect(el.querySelector('table')).toBeNull();
    expect(el.querySelectorAll('.spg-cal-event')).toHaveLength(3);
    expect(button(el).getAttribute('aria-label')).toBe('Show as table');
    expect(button(el).querySelector('[data-icon="view_column"]')).not.toBeNull();

    button(el).click();
    expect(grid.getView()).toBe('grid');
    expect(el.querySelector('.spg-cal')).toBeNull();
    expect(el.querySelectorAll('tbody tr[data-row-index]')).toHaveLength(3);
  });

  it('uses the grid labels', () => {
    const { el } = make({ labels: thaiLabels });
    expect(button(el).getAttribute('aria-label')).toBe('แสดงเป็นปฏิทิน');
    button(el).click();
    expect(button(el).getAttribute('aria-label')).toBe('แสดงเป็นตาราง');
  });

  it('is not rendered without the option', () => {
    const { el } = make({ viewToggle: undefined });
    expect(button(el)).toBeNull();
  });

  it('keeps the search, the page and the sort across a switch', () => {
    const { el, grid } = make({
      searchable: true,
      pageSize: 2,
      defaultSort: { key: 'subject', direction: 'desc' },
    });
    grid.setFilter({ search: 'teams' });
    button(el).click();
    expect([...el.querySelectorAll('.spg-cal-event-title')].map((t) => t.textContent)).toEqual([
      'Change meeting',
    ]);
    button(el).click();
    expect(grid.getFilter()?.search).toBe('teams');
    expect(grid.getSort()).toEqual({ key: 'subject', direction: 'desc' });
    expect(el.querySelectorAll('tbody tr[data-row-index]')).toHaveLength(1);
  });

  it('brings the pager and the group headers back with the table', () => {
    const { el, grid } = make({ pageSize: 2, groupBy: ['place'] });
    expect(el.querySelector('.spg-pager')).not.toBeNull();
    grid.setView('calendar');
    expect(el.querySelector('.spg-pager')).toBeNull();
    grid.setView('grid');
    expect(el.querySelector('.spg-pager')).not.toBeNull();
    expect(el.querySelector('tr.spg-group-row')).not.toBeNull();
  });

  it('activates a row by double-click in the table and an event by click in the calendar', () => {
    const onRowActivate = vi.fn();
    const { el, grid } = make({ onRowActivate });
    const row = /** @type {HTMLElement} */ (el.querySelector('tbody tr[data-row-index]'));
    row.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onRowActivate).not.toHaveBeenCalled();
    row.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    expect(onRowActivate).toHaveBeenCalledTimes(1);
    grid.setView('calendar');
    el.querySelector('.spg-cal-event')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(onRowActivate).toHaveBeenCalledTimes(2);
  });

  it('keeps the calendar day and view while the table shows in between', () => {
    const { el, grid } = make();
    grid.setView('calendar');
    /** @type {HTMLElement} */ (el.querySelector('[data-cal-view="day"]')).click();
    grid.setView('grid');
    grid.setView('calendar');
    expect(el.querySelector('.spg-cal')?.getAttribute('data-view')).toBe('day');
    expect(el.querySelectorAll('.spg-cal-event')).toHaveLength(1);
  });
});

describe('getView / setView / defaultView', () => {
  it('starts on the calendar when the grid has one and defaultView is left out', () => {
    const { grid } = make({ defaultView: undefined, viewToggle: undefined });
    expect(grid.getView()).toBe('calendar');
  });

  it('is always the table without a calendar option', () => {
    const { grid } = make({ calendar: undefined, defaultView: undefined, viewToggle: undefined });
    expect(grid.getView()).toBe('grid');
    expect(() => grid.setView('calendar')).toThrow(RangeError);
  });

  it('throws for an unknown view and leaves the grid as it was', () => {
    const { el, grid } = make();
    // @ts-expect-error not a view
    expect(() => grid.setView('month')).toThrow(RangeError);
    expect(grid.getView()).toBe('grid');
    expect(el.querySelector('table')).not.toBeNull();
  });

  it('works without the viewToggle option', () => {
    const { el, grid } = make({ viewToggle: undefined });
    grid.setView('calendar');
    expect(el.querySelector('.spg-cal')).not.toBeNull();
    expect(el.querySelector('.spg-view-toggle')).toBeNull();
  });

  it('emits viewChange (and onViewChange) only when the view changes', () => {
    const onViewChange = vi.fn();
    const { grid } = make({ onViewChange });
    const listener = vi.fn();
    grid.on('viewChange', listener);
    grid.setView('grid');
    expect(listener).not.toHaveBeenCalled();
    grid.setView('calendar');
    grid.setView('calendar');
    grid.setView('grid');
    expect(listener.mock.calls).toEqual([['calendar'], ['grid']]);
    expect(onViewChange).toHaveBeenCalledTimes(2);
  });

  it('does nothing after destroy', () => {
    const { grid } = make();
    grid.destroy();
    expect(() => grid.setView('calendar')).not.toThrow();
    expect(grid.getView()).toBe('grid');
  });
});

describe('option checks', () => {
  /** @param {object} options */
  const build = (options) => () =>
    new SPGrid(document.createElement('div'), { columns, rows, ...options });

  it('rejects viewToggle without a calendar', () => {
    expect(build({ viewToggle: true })).toThrow(RangeError);
  });

  it('rejects an unknown defaultView and the calendar view without a calendar', () => {
    expect(build({ calendar, defaultView: 'month' })).toThrow(RangeError);
    expect(build({ defaultView: 'calendar' })).toThrow(RangeError);
    expect(build({ defaultView: 'grid' })).not.toThrow();
  });
});
