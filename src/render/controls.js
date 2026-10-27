// @ts-check
import { bindActionEvents } from './actionEvents.js';
import { bindPagerEvents } from './pagerEvents.js';
import { bindSearchEvents } from './searchEvents.js';

/**
 * Bind the grid's delegated listeners (search box, pager, action clicks) and return one function that
 * removes them all.
 *
 * @param {ReturnType<typeof import('./toolbar.js').mountShell>} shell
 * @param {{
 *   debounce: number, onSearch: (search: string) => void,
 *   pager: Parameters<typeof bindPagerEvents>[1],
 *   actions: Omit<Parameters<typeof bindActionEvents>[1], never>,
 * }} grid
 * @returns {() => void}
 */
export function bindControls(shell, { debounce, onSearch, pager, actions }) {
  const unbind = [bindPagerEvents(shell.pagerHost, pager), bindActionEvents(shell.host, actions)];
  if (shell.toolbar && shell.search) {
    unbind.push(bindSearchEvents(shell.toolbar, shell.search, { debounce, onSearch }));
  }
  return () => unbind.forEach((fn) => fn());
}
