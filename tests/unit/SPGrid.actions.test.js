import { afterEach, describe, expect, it, vi } from 'vitest';
import { SPGrid } from '../../src/index.js';

const rows = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  canCancel: i % 2 === 0,
  _view: 'secret',
}));

const columns = () => [
  {
    key: '_view',
    ariaLabel: 'View',
    actions: [{ name: 'view', label: 'View', className: 'btn-v' }],
  },
  {
    key: '_cancel',
    ariaLabel: 'Cancel',
    actions: [{ name: 'cancel', label: 'Cancel', visible: (/** @type {any} */ r) => r.canCancel }],
  },
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
];

/** @param {object} [options] */
function make(options = {}) {
  const el = document.createElement('div');
  const grid = new SPGrid(el, { columns: columns(), rows, pageSize: 5, ...options });
  const calls = /** @type {any[]} */ ([]);
  grid.on('action', (payload) => calls.push(payload));
  return { el, grid, calls };
}

/** @param {HTMLElement} el @param {string} name @param {number} [i] */
const btn = (el, name, i = 0) =>
  /** @type {HTMLButtonElement} */ (el.querySelectorAll(`button[data-action="${name}"]`)[i]);
/** @param {HTMLElement} el */
const headers = (el) => [...el.querySelectorAll('thead th')];

afterEach(() => vi.restoreAllMocks());

describe('action columns', () => {
  it('render a real button per row, with the name, class and escaped label', () => {
    const { el } = make({ pageSize: undefined });
    const views = el.querySelectorAll('button[data-action="view"]');
    expect(views).toHaveLength(25);
    expect(views[0].getAttribute('type')).toBe('button');
    expect(views[0].classList.contains('spg-action')).toBe(true);
    expect(views[0].classList.contains('btn-v')).toBe(true);
    expect(views[0].textContent).toBe('View');
  });

  it('escape the label and the class name', () => {
    const { el } = make({
      columns: [
        { key: '_a', actions: [{ name: 'x', label: '<img onerror=x>', className: 'a"b' }] },
      ],
    });
    expect(el.querySelector('img')).toBeNull();
    const button = btn(el, 'x');
    expect(button.textContent).toBe('<img onerror=x>');
    expect(button.getAttribute('class')).toContain('a"b');
    expect(button.getAttributeNames()).not.toContain('b');
  });

  it('hide a button when visible(row) is false', () => {
    const { el } = make({ pageSize: undefined });
    // rows with an even index (odd ids) can be cancelled: 13 of 25.
    expect(el.querySelectorAll('button[data-action="cancel"]')).toHaveLength(13);
    const second = el.querySelectorAll('tbody tr')[1];
    expect(second.querySelector('button[data-action="cancel"]')).toBeNull();
    expect(second.querySelector('button[data-action="view"]')).not.toBeNull();
  });

  it('disable a button when disabled(row) is true, and title it', () => {
    const { el } = make({
      columns: [
        {
          key: '_a',
          actions: [
            {
              name: 'v',
              label: 'V',
              title: 'See "it"',
              disabled: (/** @type {any} */ r) => r.id === 1,
            },
          ],
        },
      ],
    });
    expect(btn(el, 'v', 0).disabled).toBe(true);
    expect(btn(el, 'v', 1).disabled).toBe(false);
    expect(btn(el, 'v', 1).getAttribute('title')).toBe('See "it"');
  });

  it('are never sortable: no affordance, tabindex, aria-sort or icon; the header is named by ariaLabel', () => {
    const { el } = make({
      columns: [
        { key: '_v', sortable: true, ariaLabel: 'View', actions: [{ name: 'v', label: 'V' }] },
        { key: 'id', sortable: true },
      ],
    });
    const th = /** @type {HTMLElement} */ (headers(el)[0]);
    expect(th.classList.contains('spg-sortable')).toBe(false);
    expect(th.hasAttribute('tabindex')).toBe(false);
    expect(th.hasAttribute('aria-sort')).toBe(false);
    expect(th.querySelector('.spg-sort-icon')).toBeNull();
    expect(th.getAttribute('aria-label')).toBe('View');
    expect(th.textContent).toBe('');
    th.click();
    expect(el.querySelector('th[aria-sort]')).toBeNull();
  });

  it('are not searched, filtered or sorted by key', () => {
    const { grid, el } = make({ pageSize: undefined });
    grid.setFilter({ search: 'secret' }); // every row has _view: 'secret', but it is not a data column
    expect(el.querySelectorAll('tbody tr.spg-empty')).toHaveLength(1);
    expect(() => grid.setFilter({ columnFilters: { _view: 'secret' } })).toThrow(RangeError);
    expect(() => grid.setSort({ key: '_view', direction: 'asc' })).toThrow(RangeError);
  });
});

describe('action event', () => {
  it('emits { action, row, key } with the original row object', () => {
    const { el, calls } = make();
    btn(el, 'view', 2).click();
    expect(calls).toHaveLength(1);
    expect(calls[0].action).toBe('view');
    expect(calls[0].key).toBe('_view');
    expect(calls[0].row).toBe(rows[2]);
    expect(calls[0].rowKey).toBeUndefined();
  });

  it('resolves the right row after sort + filter + page change', () => {
    const { el, grid, calls } = make();
    grid.setFilter({ search: 'user 2' }); // ids 2, 12, 20-25 -> 8 rows
    grid.setSort({ key: 'id', direction: 'desc' }); // 25 24 23 22 21 | 20 12 2
    grid.setPage(2);
    expect(
      [...el.querySelectorAll('tbody tr td:nth-child(3)')].map((td) => td.textContent),
    ).toEqual(['20', '12', '2']);
    expect(el.querySelectorAll('button[data-action="cancel"]')).toHaveLength(0); // all even ids
    btn(el, 'view', 1).click();
    expect(calls).toHaveLength(1);
    expect(calls[0].row).toBe(rows[11]); // id 12
  });

  it('carries rowKey and renders data-row-id when options.rowKey is set', () => {
    const { el, calls } = make({ rowKey: 'id' });
    expect(el.querySelector('tbody tr')?.getAttribute('data-row-id')).toBe('1');
    btn(el, 'view', 1).click();
    expect(calls[0].rowKey).toBe(2);
  });

  it('is also delivered to options.onAction', () => {
    const onAction = vi.fn();
    const { el } = make({ onAction });
    btn(el, 'view').click();
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction.mock.calls[0][0].row).toBe(rows[0]);
  });

  it('emits nothing for a disabled button', () => {
    const { el, calls } = make({
      columns: [
        { key: '_a', actions: [{ name: 'v', label: 'V', disabled: () => true }] },
        { key: 'id' },
      ],
    });
    btn(el, 'v').click();
    expect(calls).toHaveLength(0);
  });

  it('emits once per click even after several renders', () => {
    const { el, grid, calls } = make();
    grid.render();
    grid.render();
    grid.setRows([...rows]);
    btn(el, 'view').click();
    expect(calls).toHaveLength(1);
  });

  it('ignores clicks that are not on an action', () => {
    const { el, calls } = make();
    /** @type {HTMLElement} */ (el.querySelector('tbody td:nth-child(3)')).click();
    expect(calls).toHaveLength(0);
  });

  it('removes its listener on destroy()', () => {
    // Every addEventListener must be matched by a removeEventListener once the grid is destroyed.
    const active = new Map();
    const add = EventTarget.prototype.addEventListener;
    const remove = EventTarget.prototype.removeEventListener;
    vi.spyOn(EventTarget.prototype, 'addEventListener').mockImplementation(
      /** @this {any} */ function (
        /** @type {any} */ type,
        /** @type {any} */ fn,
        /** @type {any} */ opts,
      ) {
        active.set(fn, type);
        return add.call(this, type, fn, opts);
      },
    );
    vi.spyOn(EventTarget.prototype, 'removeEventListener').mockImplementation(
      /** @this {any} */ function (
        /** @type {any} */ type,
        /** @type {any} */ fn,
        /** @type {any} */ opts,
      ) {
        active.delete(fn);
        return remove.call(this, type, fn, opts);
      },
    );
    const { el, grid, calls } = make();
    const button = btn(el, 'view');
    expect([...active.values()].filter((t) => t === 'click').length).toBeGreaterThan(1);
    grid.destroy();
    expect([...active.values()].filter((t) => t === 'click')).toEqual([]);
    button.click(); // detached, but its old ancestors must no longer react
    expect(calls).toHaveLength(0);
  });
});

describe('custom render and cell actions', () => {
  it('inserts render() output unescaped, passing (value, row); default cells stay escaped', () => {
    const render = vi.fn((/** @type {any} */ v) => `<b class="x">${v}</b>`);
    const data = [{ id: 1, name: 'Ada', note: '<i>raw</i>' }];
    const { el } = make({
      columns: [{ key: 'name', render }, { key: 'note' }],
      rows: data,
    });
    expect(el.querySelector('td b.x')?.textContent).toBe('Ada');
    expect(render).toHaveBeenCalledWith('Ada', data[0]);
    expect(el.querySelector('td:nth-child(2) i')).toBeNull();
    expect(el.querySelector('td:nth-child(2)')?.textContent).toBe('<i>raw</i>');
  });

  it('treats a null/undefined render() result as empty', () => {
    const { el } = make({ columns: [{ key: 'name', render: () => undefined }], rows });
    expect(el.querySelector('td')?.textContent).toBe('');
  });

  it('emits action and cellClick for a [data-cell-action] element', () => {
    const { el, grid, calls } = make({
      rowKey: 'id',
      columns: [
        {
          key: 'name',
          render: (/** @type {any} */ v) => `<a href="#" data-cell-action="open">${v}</a>`,
        },
      ],
    });
    const cellClicks = /** @type {any[]} */ ([]);
    grid.on('cellClick', (p) => cellClicks.push(p));
    /** @type {HTMLElement} */ (el.querySelectorAll('a[data-cell-action]')[3]).click();
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({ action: 'open', key: 'name', rowKey: 4 });
    expect(calls[0].row).toBe(rows[3]);
    expect(cellClicks).toHaveLength(1);
    expect(cellClicks[0].originalEvent).toBeInstanceOf(MouseEvent);
    expect(cellClicks[0].row).toBe(rows[3]);
  });
});

describe('column header options', () => {
  it('splits a multi-line label into escaped lines joined by <br>', () => {
    const { el } = make({ columns: [{ key: 'a', label: 'เลขที่\nRFQ <b>' }] });
    expect(el.querySelector('.spg-th-label')?.innerHTML).toBe('เลขที่<br>RFQ &lt;b&gt;');
  });

  it('applies width and align to the header and cells; ignores an unsafe width', () => {
    const { el } = make({
      columns: [
        { key: 'id', width: '80px', align: 'center' },
        { key: 'name', width: 'red; background: url(x)' },
      ],
    });
    const [a, b] = /** @type {HTMLElement[]} */ (headers(el));
    expect(a.style.width).toBe('80px');
    expect(b.getAttribute('style')).toBeNull();
    expect(a.classList.contains('spg-align-center')).toBe(true);
    expect(el.querySelector('td')?.classList.contains('spg-align-center')).toBe(true);
  });

  it('sets aria-label on a header only when ariaLabel is given', () => {
    const { el } = make({ columns: [{ key: 'id', ariaLabel: 'Open' }, { key: 'name' }] });
    const [a, b] = headers(el);
    expect(a.getAttribute('aria-label')).toBe('Open');
    expect(b.hasAttribute('aria-label')).toBe(false);
  });
});

describe('action icons', () => {
  /** @param {any[]} actions @param {object} [options] */
  const makeIcons = (actions, options = {}) => {
    const el = document.createElement('div');
    new SPGrid(el, {
      columns: [{ key: '_a', actions }, { key: 'id' }],
      rows: [{ id: 1 }],
      ...options,
    });
    return el;
  };

  it('renders a decorative built-in icon; the button is icon-only, named and titled by the label', () => {
    const el = makeIcons([{ name: 'view', label: 'View', icon: 'visibility' }]);
    const button = /** @type {HTMLElement} */ (el.querySelector('button.spg-action'));
    const icon = /** @type {HTMLElement} */ (button.firstElementChild);
    expect(icon.className).toBe('spg-icon spg-action-icon');
    expect(icon.getAttribute('data-icon')).toBe('visibility');
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.querySelector('svg')).not.toBeNull();
    expect(button.textContent).toBe('');
    expect(button.className).toBe('spg-action spg-action-icononly');
    expect(button.getAttribute('aria-label')).toBe('View');
    expect(button.title).toBe('View');
  });

  it('keeps an explicit title as the tooltip, and shows the text too with showLabel', () => {
    const el = makeIcons([
      { name: 'a', label: 'A', icon: 'edit', title: 'Edit "it"' },
      { name: 'b', label: 'B', icon: 'edit', showLabel: true },
    ]);
    const [a, b] = /** @type {HTMLElement[]} */ ([...el.querySelectorAll('button.spg-action')]);
    expect(a.title).toBe('Edit "it"');
    expect(a.getAttribute('aria-label')).toBe('A');
    expect(b.textContent).toBe('B');
    expect(b.className).toBe('spg-action');
    expect(b.hasAttribute('aria-label')).toBe(false);
    expect(b.title).toBe('');
  });

  it('escapes the label in aria-label and title of an icon-only button', () => {
    const el = makeIcons([{ name: 'x', label: '<b>"x"</b>', icon: 'edit' }]);
    const button = /** @type {HTMLElement} */ (el.querySelector('button.spg-action'));
    expect(button.getAttribute('aria-label')).toBe('<b>"x"</b>');
    expect(button.title).toBe('<b>"x"</b>');
    expect(button.querySelector('b')).toBeNull();
  });

  it('renders no icon without `icon` or with an unknown / inherited name', () => {
    for (const icon of [undefined, 'nope', 'toString', 42]) {
      const el = makeIcons([{ name: 'view', label: 'View', icon }]);
      expect(el.querySelector('.spg-action-icon')).toBeNull();
      expect(el.querySelector('button')?.textContent).toBe('View');
    }
  });

  it('uses a replacement from options.icons', () => {
    const el = makeIcons([{ name: 'view', label: 'View', icon: 'edit' }], {
      icons: { edit: '<svg data-mine="1"></svg>' },
    });
    expect(el.querySelector('.spg-action-icon [data-mine]')).not.toBeNull();
  });

  it('still reports the action when the icon is clicked', () => {
    const onAction = vi.fn();
    const el = makeIcons([{ name: 'view', label: 'View', icon: 'visibility' }], { onAction });
    el.querySelector('.spg-action-icon svg path')?.dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    );
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction.mock.calls[0][0].action).toBe('view');
  });
});

describe('action column width', () => {
  it('marks only the headers of action columns, so CSS can shrink them to their buttons', () => {
    const el = document.createElement('div');
    new SPGrid(el, {
      columns: [
        { key: 'name', label: 'Name' },
        { key: 'ops', actions: [{ name: 'view', label: 'View' }] },
      ],
      rows: [{ name: 'Ada' }],
    });
    expect(
      [...el.querySelectorAll('th')].map((th) => th.classList.contains('spg-action-col')),
    ).toEqual([false, true]);
    expect(el.querySelector('td.spg-action-cell')).not.toBeNull();
  });
});
