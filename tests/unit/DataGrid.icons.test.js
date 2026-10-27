import { describe, expect, it } from 'vitest';
import { DataGrid } from '../../src/index.js';
import { ICONS, resolveIcons } from '../../src/render/icons.js';
import { nav } from './helpers/pagination.js';

const columns = [
  { key: 'id', label: 'ID', sortable: true, align: 'right' },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'role', label: 'Role' },
];
const rows = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  role: 'x',
}));

/** @param {object} [options] */
const make = (options = {}) => {
  const el = document.createElement('div');
  const grid = new DataGrid(el, { columns, rows, ...options });
  return { el, grid };
};
/** @param {HTMLElement} el @param {number} col */
const th = (el, col) => /** @type {HTMLElement} */ (el.querySelectorAll('th')[col]);
/** Round-trip through the parser, so serialization differences (`<path/>`) do not matter. @param {string} markup */
const normalized = (markup) => {
  const div = document.createElement('div');
  div.innerHTML = markup;
  return div.innerHTML;
};
/** @param {HTMLElement} cell */
const sortIcon = (cell) => cell.querySelector('.dg-sort-icon')?.getAttribute('data-icon');

describe('built-in icons', () => {
  it('are decorative inline SVGs using currentColor in a 24px Material Symbols viewBox', () => {
    expect(Object.keys(ICONS).sort()).toEqual(
      [
        'arrow_upward',
        'arrow_downward',
        'unfold_more',
        'chevron_left',
        'chevron_right',
        'first_page',
        'last_page',
        'search',
        'close',
        'inbox',
      ].sort(),
    );
    for (const svg of Object.values(ICONS)) {
      expect(svg).toContain('viewBox="0 -960 960 960"');
      expect(svg).toContain('fill="currentColor"');
      expect(svg).toContain('aria-hidden="true"');
      expect(svg).toContain('focusable="false"');
      expect(svg).toContain('width="1em" height="1em"');
    }
  });
});

describe('sort icons', () => {
  it('swap with the sort state while aria-sort stays the source of truth', () => {
    const { el, grid } = make();
    expect(sortIcon(th(el, 1))).toBe('unfold_more');
    expect(th(el, 1).hasAttribute('aria-sort')).toBe(false);

    grid.setSort({ key: 'name', direction: 'asc' });
    expect(sortIcon(th(el, 1))).toBe('arrow_upward');
    expect(th(el, 1).getAttribute('aria-sort')).toBe('ascending');
    expect(sortIcon(th(el, 0))).toBe('unfold_more'); // other columns stay unsorted

    grid.setSort({ key: 'name', direction: 'desc' });
    expect(sortIcon(th(el, 1))).toBe('arrow_downward');
    expect(th(el, 1).getAttribute('aria-sort')).toBe('descending');

    grid.setSort(null);
    expect(sortIcon(th(el, 1))).toBe('unfold_more');
    expect(th(el, 1).hasAttribute('aria-sort')).toBe(false);
  });

  it('are hidden from assistive technology and do not change the header text', () => {
    const { el } = make();
    const icon = /** @type {HTMLElement} */ (th(el, 1).querySelector('.dg-sort-icon'));
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(th(el, 1).textContent).toBe('Name');
  });

  it('are absent from columns that are not sortable', () => {
    const { el } = make();
    expect(th(el, 2).querySelector('.dg-icon')).toBeNull();
  });
});

describe('pager icon buttons', () => {
  it('are labelled by aria-label (default and custom) and carry an icon, not text', () => {
    const { el } = make({ pageSize: 10 });
    /** @param {string} action */
    const button = (action) =>
      /** @type {HTMLButtonElement} */ (nav(el).querySelector(`[data-action="${action}"]`));
    expect(
      ['first', 'prev', 'next', 'last'].map((a) => button(a).getAttribute('aria-label')),
    ).toEqual(['First page', 'Previous', 'Next', 'Last page']);
    expect(button('first').querySelector('[data-icon="first_page"]')).not.toBeNull();
    expect(button('prev').querySelector('[data-icon="chevron_left"]')).not.toBeNull();
    expect(button('next').querySelector('[data-icon="chevron_right"]')).not.toBeNull();
    expect(button('last').querySelector('[data-icon="last_page"]')).not.toBeNull();
    expect(button('next').textContent).toBe('');

    const custom = make({
      pageSize: 10,
      labels: { first: 'แรก', last: '<i>สุดท้าย</i>', prev: 'ก่อน', next: 'ถัดไป' },
    });
    expect(nav(custom.el).querySelector('[data-action="first"]')?.getAttribute('aria-label')).toBe(
      'แรก',
    );
    expect(nav(custom.el).querySelector('[data-action="last"]')?.getAttribute('aria-label')).toBe(
      '<i>สุดท้าย</i>',
    );
    expect(custom.el.querySelector('i')).toBeNull();
  });

  it('disable First/Prev on the first page and Next/Last on the last', () => {
    const { el, grid } = make({ pageSize: 10 });
    /** @param {string} action */
    const disabled = (action) =>
      /** @type {HTMLButtonElement} */ (nav(el).querySelector(`[data-action="${action}"]`))
        .disabled;
    expect(['first', 'prev', 'next', 'last'].map(disabled)).toEqual([true, true, false, false]);
    grid.setPage(2);
    expect(['first', 'prev', 'next', 'last'].map(disabled)).toEqual([false, false, false, false]);
    grid.setPage(3);
    expect(['first', 'prev', 'next', 'last'].map(disabled)).toEqual([false, false, true, true]);
  });

  it('First and Last jump to the ends and keep focus on an enabled button', () => {
    const { el, grid } = make({ pageSize: 10 });
    document.body.append(el);
    /** @param {string} action */
    const click = (action) =>
      /** @type {HTMLButtonElement} */ (nav(el).querySelector(`[data-action="${action}"]`)).click();
    click('last');
    expect(grid.getPage()).toBe(3);
    expect(nav(el).contains(document.activeElement)).toBe(true);
    click('first');
    expect(grid.getPage()).toBe(1);
    el.remove();
  });
});

describe('search box icons', () => {
  it('has a leading search icon and a clear button with an aria-label', () => {
    const { el } = make({ searchable: true, labels: { clear: 'ล้าง' } });
    expect(el.querySelector('.dg-search-field [data-icon="search"]')).not.toBeNull();
    const clear = /** @type {HTMLButtonElement} */ (el.querySelector('.dg-search-clear'));
    expect(clear.getAttribute('aria-label')).toBe('ล้าง');
    expect(clear.querySelector('[data-icon="close"]')).not.toBeNull();
    expect(
      make({ searchable: true }).el.querySelector('.dg-search-clear')?.getAttribute('aria-label'),
    ).toBe('Clear search');
  });
});

describe('empty state', () => {
  it('shows the inbox icon with the (escaped) text and still announces it', () => {
    const { el } = make({ rows: [], labels: { empty: 'ไม่พบ <u>x</u>' } });
    const cell = /** @type {HTMLElement} */ (el.querySelector('tr.dg-empty td'));
    expect(cell.querySelector('[data-icon="inbox"]')).not.toBeNull();
    expect(cell.textContent).toBe('ไม่พบ <u>x</u>');
    expect(el.querySelector('u')).toBeNull();
    const status = /** @type {HTMLElement} */ (el.querySelector('[role="status"]'));
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.textContent).toBe('ไม่พบ <u>x</u>');
  });
});

describe('options.icons', () => {
  it('overrides a single icon and keeps the others', () => {
    const custom = '<svg data-test="mine" viewBox="0 0 1 1"><path d="M0 0"/></svg>';
    const { el, grid } = make({ icons: { arrow_upward: custom } });
    grid.setSort({ key: 'name', direction: 'asc' });
    const icon = /** @type {HTMLElement} */ (th(el, 1).querySelector('.dg-sort-icon'));
    expect(icon.querySelector('svg')?.getAttribute('data-test')).toBe('mine');
    expect(icon.getAttribute('aria-hidden')).toBe('true'); // still decorative

    grid.setSort({ key: 'name', direction: 'desc' });
    expect(th(el, 1).querySelector('.dg-sort-icon')?.innerHTML).toBe(
      normalized(ICONS.arrow_downward),
    );
  });

  it('ignores unknown names and non-string values', () => {
    const icons = resolveIcons(
      /** @type {any} */ ({ nope: '<svg></svg>', search: 42, close: undefined }),
    );
    expect(icons).toEqual(ICONS);
    expect(icons).not.toHaveProperty('nope');
  });
});

describe('user data never reaches an icon', () => {
  it('escapes labels, cell values and keys, and leaves every icon exactly as built', () => {
    const evil = '<img src=x onerror=alert(1)>';
    const { el } = make({
      columns: [{ key: 'v', label: evil, sortable: true }],
      rows: [{ v: evil }],
      labels: {
        search: evil,
        clear: evil,
        empty: evil,
        first: evil,
        last: evil,
        prev: evil,
        next: evil,
      },
      searchable: true,
      pageSize: 1,
    });
    expect(el.querySelector('img')).toBeNull();
    for (const icon of el.querySelectorAll('.dg-icon')) {
      const name = /** @type {keyof typeof ICONS} */ (icon.getAttribute('data-icon'));
      expect(icon.innerHTML).toBe(normalized(ICONS[name]));
    }
    expect(el.querySelectorAll('.dg-icon').length).toBeGreaterThan(5);
  });
});

describe('look options', () => {
  it('striped, density, stickyHeader and maxHeight set modifier classes and styles', () => {
    const base = make().el.querySelector('.dg-root');
    expect(base?.className).toBe('dg-root');

    const { el } = make({ striped: true, density: 'compact', stickyHeader: true, maxHeight: 300 });
    const root = /** @type {HTMLElement} */ (el.querySelector('.dg-root'));
    expect(root.classList.contains('dg-striped')).toBe(true);
    expect(root.classList.contains('dg-compact')).toBe(true);
    expect(root.classList.contains('dg-sticky')).toBe(true);
    const wrap = /** @type {HTMLElement} */ (el.querySelector('.dg-table-wrap'));
    expect(wrap.classList.contains('dg-scroll')).toBe(true);
    expect(wrap.style.maxHeight).toBe('300px');

    const css = make({ maxHeight: '20rem' }).el.querySelector('.dg-table-wrap');
    expect(/** @type {HTMLElement} */ (css).style.maxHeight).toBe('20rem');
    expect(make({ density: 'comfortable' }).el.querySelector('.dg-compact')).toBeNull();
  });

  it('a hostile maxHeight cannot inject other CSS', () => {
    const { el } = make({ maxHeight: '10px; background: red' });
    const wrap = /** @type {HTMLElement} */ (el.querySelector('.dg-table-wrap'));
    expect(wrap.style.background).toBe('');
    expect(wrap.getAttribute('style') ?? '').not.toContain('red');
  });

  it('column.align adds an alignment class to header and cells; unknown values are ignored', () => {
    const { el } = make({
      columns: [
        { key: 'id', align: 'right' },
        { key: 'name', align: /** @type {any} */ ('x" onclick="y') },
      ],
    });
    expect(el.querySelector('th.dg-align-right')).not.toBeNull();
    expect(el.querySelectorAll('td.dg-align-right')).toHaveLength(25);
    expect(el.querySelector('[onclick]')).toBeNull();
  });
});
