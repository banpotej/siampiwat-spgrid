// @ts-check
import { searchKind } from '../core/columns.js';
import { toWords, DEFAULT_LOCALE } from '../core/filter.js';
import { computeView } from '../core/view.js';
import { ColumnResizer } from './columnResize.js';
import { highlightSearch } from './highlight.js';
import { bindHeaderEvents } from './headerEvents.js';
import { bindHeaderReorder } from './headerReorder.js';
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
  #unbindHeader = () => {};

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
      this.#resizer = new ColumnResizer(shell.host, widthStorageKey);
      this.#unbindResize = this.#resizer.bind();
    }
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
    );
    if (this.#activatable) {
      // Rows are Tab stops that Enter activates (see rowActivate.js); the class gives them the pointer cursor.
      for (const tr of host.querySelectorAll('tbody tr[data-row-index]')) {
        tr.classList.add('dg-activatable');
        tr.setAttribute('tabindex', '0');
      }
    }
    if (this.#highlight && filter?.search) {
      const locale = this.#locale ?? DEFAULT_LOCALE;
      highlightSearch(host, columns, toWords(filter.search, locale), {
        locale,
        only: filter.searchColumn,
        // An enum or date column's search picks a value or a range: every shown row matches, so the whole cell is marked.
        whole: searchKind(state.columns.find((c) => c.key === filter.searchColumn)) !== 'text',
      });
    }
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
  }
}
