import { afterEach, describe, expect, it } from 'vitest';
import { SPGrid } from '../../src/index.js';

const start = new Date(2026, 10, 12, 9);
const columns = [{ key: 'title', label: 'Title' }];

/** @param {Record<string, unknown>} [cal] @returns {HTMLElement} */
function make(cal = {}) {
  const el = document.createElement('div');
  document.body.append(el);
  new SPGrid(el, {
    columns,
    rows: [{ id: 1, title: 'Default title', start }],
    locale: 'en',
    calendar: { start: 'start', date: start, ...cal },
  });
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('calendar option checks', () => {
  /** @param {Record<string, unknown>} cal */
  const build = (cal) => () => make(cal);

  it('needs a start field', () => {
    expect(build({ start: undefined })).toThrow(TypeError);
    expect(build({ start: '' })).toThrow(TypeError);
  });

  it('rejects unknown views, a view that is not offered, and bad numbers', () => {
    expect(build({ view: 'year' })).toThrow(RangeError);
    expect(build({ views: ['day', 'year'] })).toThrow(RangeError);
    expect(build({ views: [] })).toThrow(RangeError);
    expect(build({ views: ['day'], view: 'week' })).toThrow(RangeError);
    expect(build({ firstDay: 7 })).toThrow(RangeError);
    expect(build({ firstDay: 1.5 })).toThrow(RangeError);
    expect(build({ hours: [10, 10] })).toThrow(RangeError);
    expect(build({ hours: [-1, 5] })).toThrow(RangeError);
    expect(build({ hours: [8, 25] })).toThrow(RangeError);
    expect(build({ date: 'not a date' })).toThrow(RangeError);
  });

  it('defaults to the week view and the title field', () => {
    const el = make();
    expect(el.querySelector('[data-view="week"]')).not.toBeNull();
    expect(el.querySelector('.spg-cal-event-title')?.textContent).toBe('Default title');
  });
});
