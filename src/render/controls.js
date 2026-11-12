// @ts-check
import { bindActionEvents } from './actionEvents.js';
import { bindColumnPicker } from './columnPicker.js';
import { bindPagerEvents } from './pagerEvents.js';
import { bindRowActivate } from './rowActivate.js';
import { bindSearchEvents } from './searchEvents.js';
import { bindSummaryEvents } from './summary.js';

/**
 * Bind the grid's delegated listeners (search box, pager, action clicks, toolbar buttons, filter chips) and
 * return one function that removes them all.
 *
 * @param {ReturnType<typeof import('./toolbar.js').mountShell>} shell
 * @param {{
 *   debounce: number, submit: boolean, onSearch: (search: string) => void, onColumn: (key: string | null) => void,
 *   onExport: () => void, onRefresh: () => void, onView: () => void,
 *   columnPicker: Parameters<typeof bindColumnPicker>[1],
 *   onRemoveFilter: Parameters<typeof bindSummaryEvents>[1],
 *   pager: { getPage: () => number, setPage: (page: number) => void, setPageSize: (size: number) => void },
 *   actions: Omit<Parameters<typeof bindActionEvents>[1], never>,
 *   rowActivate?: Parameters<typeof bindRowActivate>[1],
 * }} grid
 * @returns {() => void}
 */
export function bindControls(
  shell,
  {
    debounce,
    submit,
    onSearch,
    onColumn,
    onExport,
    onRefresh,
    onView,
    columnPicker,
    onRemoveFilter,
    pager,
    actions,
    rowActivate,
  },
) {
  const unbind = [
    bindPagerEvents(shell.pagerHost, {
      getPage: () => pager.getPage(),
      setPage: (page) => pager.setPage(page),
      setPageSize: (size) => pager.setPageSize(size),
    }),
    bindActionEvents(shell.host, actions),
  ];
  if (rowActivate) unbind.push(bindRowActivate(shell.host, rowActivate));
  if (shell.toolbar && shell.search) {
    unbind.push(
      bindSearchEvents(shell.toolbar, shell.search, {
        debounce,
        submit,
        onSearch,
        onColumn,
        valueSelect: shell.searchValue,
        dateRange: shell.searchRange,
      }),
    );
  }
  if (shell.columnPicker) unbind.push(bindColumnPicker(shell.columnPicker, columnPicker));
  if (shell.summary) unbind.push(bindSummaryEvents(shell.summary, onRemoveFilter));
  for (const [button, onClick] of /** @type {const} */ ([
    [shell.exportButton, onExport],
    [shell.viewButton, onView],
    [shell.refreshButton, onRefresh],
  ])) {
    if (!button) continue;
    button.addEventListener('click', onClick);
    unbind.push(() => button.removeEventListener('click', onClick));
  }
  return () => unbind.forEach((fn) => fn());
}
