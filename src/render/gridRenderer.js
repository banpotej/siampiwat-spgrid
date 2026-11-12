// @ts-check
import { searchKind } from '../core/columns.js';
import { toWords, DEFAULT_LOCALE } from '../core/filter.js';
import { groupItems } from '../core/group.js';
import { computeView } from '../core/view.js';
import { ColumnResizer } from './columnResize.js';
import { freezeColumns } from './frozenColumns.js';
import { highlightSearch } from './highlight.js';
import { bindHeaderEvents } from './headerEvents.js';
import { bindGroupToggle } from './groupEvents.js';
import { bindHeaderReorder } from './headerReorder.js';
import { renderIcon } from './icons.js';
import { renderPager } from './pager.js';
import { renderSummary } from './summary.js';
import { renderTable } from './table.js';

/** @typedef {import('../types.js').GridState} GridState */
/** @typedef {import('../types.js').Column} Column */

/**
 * Draws the grid's changing parts (table, empty text, filter summary, pager) into the static shell.
 */
export class GridRenderer {
  #shell;
  #labels;
  #icons;
  #rowKey;
  #locale;
  #pageSizeOptions;
  #highlight;
  #activatable;
  /** @type {ColumnResizer | null} */ #resizer = null;
  #unbindResize = () => {};
  #pagerHtml = '';
  /** @type {Set<string>} Ids of the collapsed groups (they stay collapsed while the data or the page changes). */
  #collapsed = new Set();
  /** @type {Parameters<GridRenderer['render']> | null} The last render's arguments, to draw again after a group toggles. */
  #last = null;
  #unbindGroups;
  #unbindGroupAll = () => {};
  /** @type {string[]} Ids of the group headers on the current page, collapsed or not. */
  #groupIds = [];
  #unbindHeader = () => {};
  /** @type {ResizeObserver | null} Re-measures the frozen columns when the table's size changes (a window resize, a late font). */
  #observer = null;

  /**
   * @param {{ shell: ReturnType<typeof import('./toolbar.js').mountShell>,
   *   labels: ReturnType<typeof import('./labels.js').resolveLabels>,
   *   icons: ReturnType<typeof import('./icons.js').resolveIcons>,
   *   rowKey?: string, locale?: string, pageSizeOptions?: number[], highlight?: boolean, resizable?: boolean,
   *   widthStorageKey?: string, activatable?: boolean }} opts
   */
  constructor({
    shell,
    labels,
    icons,
    rowKey,
    locale,
    pageSizeOptions = [],
    highlight = true,
    resizable = false,
    widthStorageKey,
    activatable = false,
  }) {
    this.#shell = shell;
    this.#labels = labels;
    this.#icons = icons;
    this.#rowKey = rowKey;
    this.#locale = locale;
    this.#pageSizeOptions = pageSizeOptions;
    this.#highlight = highlight;
    this.#activatable = activatable;
    if (resizable) {
      this.#resizer = new ColumnResizer(shell.host, widthStorageKey, () => this.#freeze());
      this.#unbindResize = this.#resizer.bind();
    }
    this.#unbindGroups = bindGroupToggle(shell.host, (id) => this.#toggleGroup(id));
    const all = shell.groupToggleButton;
    if (all) {
      const onClick = () => this.#toggleAll();
      all.addEventListener('click', onClick);
      this.#unbindGroupAll = () => all.removeEventListener('click', onClick);
    }
    if (typeof ResizeObserver !== 'undefined')
      this.#observer = new ResizeObserver(() => this.#freeze());
  }

  /**
   * @param {GridState} state
   * @param {{ columns: Column[], hidden: string[], filter: import('../types.js').FilterState | null,
   *   sort: Parameters<typeof bindHeaderEvents>[1], reorder: Parameters<typeof bindHeaderReorder>[1] | null }} view
   *   `columns`: the columns to show; `hidden`: keys of the hidden ones; `filter`: the public filter; `sort`: what a
   *   click on a sortable header calls; `reorder`: what moving a header cell calls (null: columns cannot be moved).
   * @returns {ReturnType<typeof computeView>} The rows and paging shown.
   */
  render(state, { columns, hidden, filter, sort, reorder }) {
    this.#last = [state, { columns, hidden, filter, sort, reorder }];
    this.#unbindHeader();
    const view = computeView(state, { locale: this.#locale, hidden });
    const { host, status, summary, pagerHost } = this.#shell;
    const { rows, paging } = view;
    host.innerHTML = renderTable(
      columns,
      rows,
      state.sort,
      this.#labels,
      this.#icons,
      this.#rowKey,
      this.#locale,
      {
        enabled: this.#resizer !== null,
        widths: this.#resizer?.widths ?? null,
        label: this.#labels.resizeColumn,
      },
      reorder !== null,
      { keys: state.groupBy, collapsed: this.#collapsed, columns: state.columns },
    );
    if (this.#activatable) {
      // Rows are Tab stops that Enter activates (see rowActivate.js); the class gives them the pointer cursor.
      for (const tr of host.querySelectorAll('tbody tr[data-row-index]')) {
        tr.classList.add('spg-activatable');
        tr.setAttribute('tabindex', '0');
      }
    }
    this.#freeze();
    this.#observer?.disconnect();
    const table = host.querySelector('table');
    if (table) this.#observer?.observe(table);
    if (this.#highlight && filter?.search) {
      const locale = this.#locale ?? DEFAULT_LOCALE;
      highlightSearch(host, columns, toWords(filter.search, locale), {
        locale,
        only: filter.searchColumn,
        // An enum or date column's search picks a value or a range: every shown row matches, so the whole cell is marked.
        whole: searchKind(state.columns.find((c) => c.key === filter.searchColumn)) !== 'text',
      });
    }
    this.#groupIds = groupItems(rows, state.groupBy)
      .filter((item) => item.type === 'group')
      .map((item) => item.id);
    this.#syncToggleAll();
    status.textContent = rows.length === 0 ? this.#labels.empty : '';
    const unbindSort = bindHeaderEvents(host, sort);
    const unbindReorder = reorder ? bindHeaderReorder(host, reorder) : () => {};
    this.#unbindHeader = () => {
      unbindSort();
      unbindReorder();
    };
    if (summary) {
      const html = renderSummary({
        filter,
        columns: state.columns,
        shown: view.total,
        total: state.rows.length,
        labels: this.#labels,
        icons: this.#icons,
      });
      summary.innerHTML = html;
      summary.hidden = html === '';
    }
    // Only touch the pager when it changed, so focus on it survives unrelated renders.
    const pagerHtml = paging
      ? renderPager({
          paging,
          labels: this.#labels,
          pageSizeOptions: this.#pageSizeOptions,
          icons: this.#icons,
        })
      : '';
    if (pagerHtml !== this.#pagerHtml) pagerHost.innerHTML = this.#pagerHtml = pagerHtml;
    return view;
  }

  destroy() {
    this.#unbindHeader();
    this.#unbindResize();
    this.#unbindGroups();
    this.#unbindGroupAll();
    this.#observer?.disconnect();
  }

  /** Freeze the leading columns the root's `data-freeze` asks for (none when it is absent). */
  #freeze() {
    const { host } = this.#shell;
    freezeColumns(host, Number(host.closest('.spg-root')?.getAttribute('data-freeze') ?? 0));
  }

  /** True while some group on the page is open. */
  #anyOpen() {
    return this.#groupIds.some((id) => !this.#collapsed.has(id));
  }

  /** Show the Collapse all / Expand all button only while grouped, named for what a click does now. */
  #syncToggleAll() {
    const button = this.#shell.groupToggleButton;
    if (!button) return;
    button.hidden = this.#groupIds.length === 0;
    const open = this.#anyOpen();
    const label = open ? this.#labels.collapseAllGroups : this.#labels.expandAllGroups;
    button.setAttribute('aria-label', label);
    button.title = label;
    button.innerHTML = renderIcon(this.#icons, open ? 'unfold_less' : 'unfold_more');
  }

  /** Collapse every group on the page, or expand every group when none is open. */
  #toggleAll() {
    if (this.#anyOpen()) for (const id of this.#groupIds) this.#collapsed.add(id);
    else this.#collapsed.clear();
    if (this.#last) this.render(...this.#last);
  }

  /** Collapse or expand a group and draw the table again, keeping focus on the group's button. @param {string} id */
  #toggleGroup(id) {
    if (!this.#collapsed.delete(id)) this.#collapsed.add(id);
    if (this.#last) this.render(...this.#last);
    const rows = this.#shell.host.querySelectorAll('tr.spg-group-row');
    const row = [...rows].find((r) => r instanceof HTMLElement && r.dataset.groupId === id);
    row?.querySelector('button')?.focus();
  }
}
