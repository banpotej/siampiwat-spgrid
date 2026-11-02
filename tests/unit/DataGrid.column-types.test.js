import { describe, expect, it } from 'vitest';
import { DataGrid, thaiLabels } from '../../src/index.js';

/** @param {any[]} columns @param {any[]} rows @param {Partial<import('../../src/types.js').DataGridOptions>} [options] */
const cells = (columns, rows, options = {}) => {
  const el = document.createElement('div');
  new DataGrid(el, { columns, rows, locale: 'en-US', ...options });
  return /** @type {HTMLElement[]} */ ([...el.querySelectorAll('tbody td')]);
};

describe('badge', () => {
  const columns = [
    {
      key: 's',
      type: 'badge',
      badges: {
        done: { tone: 'success', icon: 'check', label: 'Done!' },
        bad: { tone: 'hacker" onclick="x' },
        constructor: { tone: 'danger' },
      },
    },
  ];

  it('uses the tone, icon and label of the value', () => {
    const [td] = cells(columns, [{ s: 'done' }]);
    const badge = /** @type {HTMLElement} */ (td.querySelector('.dg-badge'));
    expect(badge.className).toBe('dg-badge dg-badge-success dg-badge-icon');
    expect(badge.querySelector('[data-icon="check"]')).not.toBeNull();
    expect(td.textContent).toBe('Done!');
  });

  it('falls back to neutral for unknown values and tones, and escapes the text', () => {
    const tds = cells(columns, [{ s: 'bad' }, { s: '<b>x</b>' }, { s: 'toString' }]);
    expect(tds[0].querySelector('.dg-badge')?.className).toBe('dg-badge dg-badge-neutral');
    expect(tds[1].querySelector('b')).toBeNull();
    expect(tds[1].textContent).toBe('<b>x</b>');
    expect(tds[2].querySelector('.dg-badge-neutral')).not.toBeNull();
  });

  it('only looks at own keys of badges', () => {
    const [td] = cells(columns, [{ s: 'constructor' }]);
    expect(td.querySelector('.dg-badge-danger')).not.toBeNull();
  });
});

describe('date', () => {
  const columns = [{ key: 'd', type: 'date' }];

  it('formats Dates, ISO strings and timestamps with a calendar icon', () => {
    const tds = cells(columns, [
      { d: new Date(Date.UTC(2026, 9, 5, 12)) },
      { d: '2026-10-05' },
      { d: Date.UTC(2026, 9, 5, 12) },
    ]);
    for (const td of tds) {
      expect(td.querySelector('[data-icon="calendar_today"]')).not.toBeNull();
      expect(td.querySelector('time')?.textContent).toBe('Oct 5, 2026');
    }
    expect(tds[1].querySelector('time')?.getAttribute('datetime')).toBe('2026-10-05T00:00:00.000Z');
  });

  it('honours `format` and shows an unparsable value as escaped text', () => {
    const [a, b] = cells(
      [{ key: 'd', type: 'date', format: { year: 'numeric', month: 'long' } }],
      [{ d: '2026-10-05' }, { d: '<i>soon</i>' }],
    );
    expect(a.textContent).toBe('October 2026');
    expect(b.querySelector('i')).toBeNull();
    expect(b.textContent).toBe('<i>soon</i>');
  });
});

describe('boolean', () => {
  it('renders an accessible yes/no chip, in the grid labels', () => {
    const [yes, no] = cells([{ key: 'b', type: 'boolean' }], [{ b: true }, { b: false }], {
      labels: thaiLabels,
    });
    expect(yes.querySelector('.dg-bool-yes')?.getAttribute('aria-label')).toBe('ใช่');
    expect(yes.querySelector('[data-icon="check"]')).not.toBeNull();
    expect(no.querySelector('.dg-bool-no')?.getAttribute('aria-label')).toBe('ไม่ใช่');
    expect(yes.className).toBe('dg-align-center');
  });
});

describe('number', () => {
  it('formats with the locale and `format`, and is right-aligned', () => {
    const [a, b, c] = cells(
      [{ key: 'n', type: 'number', format: { style: 'currency', currency: 'THB' } }],
      [{ n: 1234.5 }, { n: '12' }, { n: 'abc' }],
    );
    expect(a.textContent?.replace(/\s/g, ' ')).toBe('THB 1,234.50');
    expect(b.textContent?.replace(/\s/g, ' ')).toBe('THB 12.00');
    expect(c.textContent).toBe('abc');
    expect(a.className).toBe('dg-align-right');
  });

  it('lets `align` win over the default', () => {
    const [td] = cells([{ key: 'n', type: 'number', align: 'left' }], [{ n: 1 }]);
    expect(td.className).toBe('dg-align-left');
  });
});

describe('all types', () => {
  it('show a muted dash for blank values', () => {
    for (const type of ['badge', 'date', 'boolean', 'number']) {
      const tds = cells([{ key: 'v', type }], [{ v: null }, {}, { v: '' }]);
      for (const td of tds) expect(td.querySelector('.dg-cell-empty')?.textContent).toBe('–');
    }
  });

  it('are ignored when `render` is set, and plain text stays as before', () => {
    const [a, b] = cells(
      [
        { key: 'v', type: 'badge', render: (/** @type {unknown} */ v) => `<i>${v}</i>` },
        { key: 'w' },
      ],
      [{ v: 'x', w: null }],
    );
    expect(a.innerHTML).toBe('<i>x</i>');
    expect(b.innerHTML).toBe('');
  });

  it('keep sorting on the raw value', () => {
    const el = document.createElement('div');
    const grid = new DataGrid(el, {
      columns: [{ key: 'd', type: 'date', sortable: true }],
      rows: [{ d: new Date(2026, 5, 1) }, { d: new Date(2026, 0, 1) }],
      locale: 'en-US',
    });
    grid.setSort({ key: 'd', direction: 'asc' });
    expect(el.querySelector('tbody tr td time')?.textContent).toBe('Jan 1, 2026');
  });
});
