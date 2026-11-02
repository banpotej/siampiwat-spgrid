import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataGrid, thaiLabels } from '../../src/index.js';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'city', label: 'City', sortable: true },
];
const rows = Array.from({ length: 30 }, (_, i) => ({
  name: `User ${i + 1}`,
  role: i % 2 ? 'Admin' : 'Dev',
  city: 'BKK',
}));

/** @param {object} [options] */
const make = (options = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new DataGrid(el, { columns, rows, ...options });
  return { el, grid };
};
/** @param {HTMLElement} el @param {string} selector */
const button = (el, selector) => /** @type {HTMLButtonElement} */ (el.querySelector(selector));
/** What the user does to reset: open the settings modal and press its Reset view button. */
const startReset = (/** @type {HTMLElement} */ el) => {
  button(el, '.dg-columns-btn').click();
  button(el, '.dg-settings-reset').click();
};

describe('toolbar buttons', () => {
  it('render only when turned on, as icon-only type=button named by their labels', () => {
    expect(make({ searchable: true }).el.querySelector('.dg-refresh')).toBeNull();
    const { el } = make({ searchable: true, refreshButton: true });
    const btn = button(el, '.dg-refresh');
    expect(btn.type).toBe('button');
    expect(btn.getAttribute('aria-label')).toBe('Refresh');
    expect(btn.title).toBe('Refresh');
    expect(btn.textContent).toBe('');
    expect(btn.querySelector('[data-icon]')?.getAttribute('data-icon')).toBe('refresh');
  });

  it('use the Thai labels and escape custom ones', () => {
    const { el } = make({ searchable: true, refreshButton: true, labels: thaiLabels });
    expect(button(el, '.dg-refresh').getAttribute('aria-label')).toBe('โหลดข้อมูลใหม่');
    const odd = make({ refreshButton: true, labels: { refresh: '<b>"R"</b>' } }).el;
    expect(button(odd, '.dg-refresh').getAttribute('aria-label')).toBe('<b>"R"</b>');
    expect(odd.querySelector('.dg-refresh b')).toBeNull();
  });

  it('sit at the end of the input group, in the order Refresh, Export, Settings', () => {
    const { el } = make({
      searchable: true,
      searchButton: true,
      refreshButton: true,
      resetButton: true,
      exportButton: true,
    });
    const group = /** @type {HTMLElement} */ (el.querySelector('.dg-input-group'));
    expect([...group.children].map((c) => c.className)).toEqual([
      'dg-search-field',
      'dg-search-submit',
      'dg-search-reset',
      'dg-tool-btn dg-refresh',
      'dg-export',
      'dg-tool-btn dg-columns-btn',
    ]);
  });

  it('stand alone in the toolbar without a search box', () => {
    const { el } = make({ refreshButton: true, resetButton: true });
    const toolbar = /** @type {HTMLElement} */ (el.querySelector('.dg-toolbar'));
    expect([...toolbar.children].map((c) => c.className)).toEqual([
      'dg-tool-btn dg-refresh',
      'dg-tool-btn dg-columns-btn',
    ]);
  });
});

describe('reset in the settings modal', () => {
  it('is offered only with resetButton, as a text button named by labels.resetView', () => {
    const none = make({ columnPicker: true }).el;
    button(none, '.dg-columns-btn').click();
    expect(none.querySelector('.dg-settings-reset')).toBeNull();
    const { el } = make({ resetButton: true });
    expect(el.querySelector('.dg-reset-view')).toBeNull();
    button(el, '.dg-columns-btn').click();
    expect(button(el, '.dg-settings-reset').textContent).toBe('Reset view');
    expect(el.querySelector('.dg-settings-list')).toBeNull();
    const thai = make({ resetButton: true, labels: thaiLabels }).el;
    button(thai, '.dg-columns-btn').click();
    expect(button(thai, '.dg-settings-reset').textContent).toBe('รีเซ็ตมุมมอง');
  });

  it('closes the settings modal and asks before it resets', async () => {
    const { el, grid } = make({ resetButton: true, columnPicker: true });
    grid.setSort({ key: 'name', direction: 'asc' });
    startReset(el);
    await vi.waitFor(() => button(el, '.dg-modal-ok'));
    expect(el.querySelectorAll('.dg-modal')).toHaveLength(1);
    expect(el.querySelector('.dg-settings')).toBeNull();
    expect(grid.getSort()).not.toBeNull();
  });
});

describe('refresh', () => {
  it('emits refresh and calls onRefresh on each click, changing nothing else', () => {
    const onRefresh = vi.fn();
    const { el, grid } = make({ refreshButton: true, onRefresh, pageSize: 10 });
    const spy = vi.fn();
    grid.on('refresh', spy);
    grid.setPage(2);
    button(el, '.dg-refresh').click();
    button(el, '.dg-refresh').click();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(onRefresh).toHaveBeenCalledTimes(2);
    expect(grid.getPage()).toBe(2);
  });

  it('removes its listener on destroy', () => {
    const { el, grid } = make({ refreshButton: true });
    const btn = button(el, '.dg-refresh');
    const remove = vi.spyOn(btn, 'removeEventListener');
    grid.destroy();
    expect(remove).toHaveBeenCalledWith('click', expect.any(Function));
  });
});

describe('Reset view confirmation', () => {
  /** @param {object} [extra] */
  const messy = (extra = {}) => {
    const view = make({ resetButton: true, ...extra });
    view.grid.setSort({ key: 'name', direction: 'asc' });
    return view;
  };
  const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

  it('shows a modal with the label (Thai included) and changes nothing when the user cancels', async () => {
    const ask = vi.spyOn(window, 'confirm');
    const { el, grid } = messy();
    startReset(el);
    await settle();
    const modal = /** @type {HTMLElement} */ (el.querySelector('.dg-root > .dg-modal'));
    expect(modal.querySelector('[role="alertdialog"]')?.getAttribute('aria-modal')).toBe('true');
    expect(modal.querySelector('.dg-modal-title')?.textContent).toBe('Reset view');
    expect(modal.querySelector('.dg-modal-text')?.textContent).toContain('Reset the view?');
    expect(document.activeElement).toBe(modal.querySelector('.dg-modal-cancel'));
    button(el, '.dg-modal-cancel').click();
    await settle();
    expect(el.querySelector('.dg-modal')).toBeNull();
    expect(grid.getSort()).toEqual({ key: 'name', direction: 'asc' });
    const thai = messy({ labels: thaiLabels });
    startReset(thai.el);
    await settle();
    expect(thai.el.querySelector('.dg-modal-text')?.textContent).toContain('รีเซ็ตมุมมอง?');
    expect(thai.el.querySelector('.dg-modal-ok')?.textContent).toBe('รีเซ็ต');
    expect(thai.el.querySelector('.dg-modal-cancel')?.textContent).toBe('ยกเลิก');
    expect(ask).not.toHaveBeenCalled();
  });

  it('resets on the confirm button, and cancels on Esc or a click on the backdrop', async () => {
    const { el, grid } = messy();
    startReset(el);
    await settle();
    el.querySelector('.dg-modal')?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await settle();
    expect(el.querySelector('.dg-modal')).toBeNull();
    startReset(el);
    await settle();
    button(el, '.dg-modal').click();
    await settle();
    expect(el.querySelector('.dg-modal')).toBeNull();
    expect(grid.getSort()).not.toBeNull();
    startReset(el);
    await settle();
    button(el, '.dg-modal-ok').click();
    await vi.waitFor(() => expect(grid.getSort()).toBeNull());
    expect(el.querySelector('.dg-modal')).toBeNull();
  });

  it('escapes the message and labels shown in the modal', async () => {
    const { el } = messy({ labels: { confirmReset: '<b>x</b>', confirmOk: '<i>y</i>' } });
    startReset(el);
    await settle();
    expect(el.querySelector('.dg-modal b, .dg-modal i')).toBeNull();
    expect(el.querySelector('.dg-modal-text')?.textContent).toBe('<b>x</b>');
  });

  it('uses a custom confirmReset (sync or async) and its message from labels.confirmReset', async () => {
    const yes = vi.fn(() => Promise.resolve(true));
    const { el, grid } = messy({ confirmReset: yes, labels: { confirmReset: 'Sure?' } });
    startReset(el);
    await vi.waitFor(() => expect(grid.getSort()).toBeNull());
    expect(yes).toHaveBeenCalledWith('Sure?');
    const no = messy({ confirmReset: () => false });
    startReset(no.el);
    await settle();
    expect(no.grid.getSort()).not.toBeNull();
  });

  it('cancels unless the answer is exactly true, and when the dialog throws or rejects', async () => {
    for (const confirmReset of [
      () => 'yes',
      () => undefined,
      () => {
        throw new Error('x');
      },
      () => Promise.reject(new Error('x')),
    ]) {
      const { el, grid } = messy({ confirmReset });
      startReset(el);
      await settle();
      expect(grid.getSort()).not.toBeNull();
    }
  });

  it('is skipped with confirmReset: false, and never asked by resetView()', async () => {
    const ask = vi.spyOn(window, 'confirm');
    const { el, grid } = messy({ confirmReset: false });
    startReset(el);
    await vi.waitFor(() => expect(grid.getSort()).toBeNull());
    const direct = messy();
    direct.grid.resetView();
    expect(direct.grid.getSort()).toBeNull();
    expect(ask).not.toHaveBeenCalled();
  });

  it('does nothing when the grid was destroyed while the question was open', async () => {
    /** @type {(yes: boolean) => void} */
    let answer = () => {};
    const { el, grid } = messy({
      confirmReset: () => new Promise((resolve) => (answer = resolve)),
    });
    startReset(el);
    grid.destroy();
    answer(true);
    await settle();
    expect(grid.getSort()).not.toBeNull();
  });
});

describe('resetView', () => {
  const options = {
    searchable: true,
    searchColumnSelect: true,
    resetButton: true,
    columnPicker: true,
    pageSize: 10,
    pageSizeOptions: [10, 20],
    hiddenColumns: ['city'],
  };

  /** @param {ReturnType<typeof make>} view */
  const mess = ({ el, grid }) => {
    grid.setFilter({ search: 'user 1' });
    grid.setSearchColumn('name');
    grid.setSort({ key: 'name', direction: 'desc' });
    grid.setHiddenColumns(['role']);
    grid.setPageSize(20);
    grid.setPage(1);
    expect(el.querySelector('th[data-key="city"]')).not.toBeNull();
  };

  it('puts search, column, sort, hidden columns, page size and page back to the starting view', () => {
    const view = make(options);
    const { el, grid } = view;
    mess(view);
    grid.resetView();
    expect(grid.getFilter()).toBeNull();
    expect(grid.getSearchColumn()).toBeNull();
    expect(grid.getSort()).toBeNull();
    expect(grid.getHiddenColumns()).toEqual(['city']);
    expect(grid.getPageSize()).toBe(10);
    expect(grid.getPage()).toBe(1);
    expect(/** @type {HTMLInputElement} */ (el.querySelector('input.dg-search')).value).toBe('');
    expect(
      /** @type {HTMLSelectElement} */ (el.querySelector('select.dg-search-column')).value,
    ).toBe('');
    /** @type {HTMLButtonElement} */ (el.querySelector('.dg-columns-btn')).click(); // the modal shows the reset state
    const checked = (/** @type {string} */ key) =>
      /** @type {HTMLInputElement} */ (el.querySelector(`.dg-settings input[data-key="${key}"]`))
        .checked;
    expect(checked('city')).toBe(false);
    expect(checked('role')).toBe(true);
    expect(el.querySelectorAll('tbody tr')).toHaveLength(10);
    expect([...el.querySelectorAll('th')].map((th) => th.dataset.key)).toEqual(['name', 'role']);
  });

  it('is what the Reset view button does, once the user confirms', async () => {
    const view = make(options);
    mess(view);
    startReset(view.el);
    await vi.waitFor(() => button(view.el, '.dg-modal-ok'));
    expect(view.grid.getSort()).not.toBeNull();
    button(view.el, '.dg-modal-ok').click();
    await vi.waitFor(() => expect(view.grid.getSort()).toBeNull());
    expect(view.grid.getPageSize()).toBe(10);
  });

  it('emits the events of what changed, and none when the view already is the starting one', () => {
    const { grid } = make(options);
    const sort = vi.fn();
    const filter = vi.fn();
    const columnsChange = vi.fn();
    const page = vi.fn();
    grid.on('sortChange', sort);
    grid.on('filterChange', filter);
    grid.on('columnsChange', columnsChange);
    grid.on('pageChange', page);
    grid.resetView();
    for (const spy of [sort, filter, columnsChange, page]) expect(spy).not.toHaveBeenCalled();
    grid.setSort({ key: 'name', direction: 'asc' });
    grid.setFilter({ search: 'x' });
    grid.setHiddenColumns([]);
    grid.setPageSize(20);
    for (const spy of [sort, filter, columnsChange, page]) spy.mockClear();
    grid.resetView();
    expect(sort).toHaveBeenCalledWith(null);
    expect(filter).toHaveBeenCalledWith(null);
    expect(columnsChange).toHaveBeenCalledWith(['city']);
    expect(page).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
  });

  it('turns pagination back off when it was off to begin with', () => {
    const { el, grid } = make({});
    grid.setPageSize(5);
    expect(el.querySelectorAll('tbody tr')).toHaveLength(5);
    grid.resetView();
    expect(grid.getPageSize()).toBeNull();
    expect(el.querySelectorAll('tbody tr')).toHaveLength(30);
  });

  it('overwrites what was saved in localStorage with the starting values', () => {
    const saved = { columnStorageKey: 'po', pageSizeStorageKey: 'po' };
    const view = make({ ...options, ...saved });
    view.grid.setHiddenColumns(['role']);
    view.grid.setPageSize(20);
    view.grid.resetView();
    expect(JSON.parse(localStorage.getItem('datagrid:columns:po') ?? 'null')).toEqual(['city']);
    expect(localStorage.getItem('datagrid:pageSize:po')).toBe('10');
    expect(make({ ...options, ...saved }).grid.getPageSize()).toBe(10);
  });

  it('is a no-op after destroy', () => {
    const { grid } = make(options);
    grid.destroy();
    expect(() => grid.resetView()).not.toThrow();
  });
});
