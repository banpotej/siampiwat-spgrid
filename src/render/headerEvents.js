// @ts-check
import { nextDirection } from '../core/sort.js';

/** @typedef {import('../types.js').SortState} SortState */

/**
 * Bind the one delegated click + keydown listener pair to the table header
 * inside `host` and return a function that removes it. Activating a sortable
 * <th> (click, Enter or Space) cycles its direction through `setSort`.
 *
 * @param {HTMLElement} host Element that currently contains the rendered table.
 * @param {{ getSort: () => SortState, setSort: (sort: SortState) => void }} grid
 * @returns {() => void} Unbind.
 */
export function bindHeaderEvents(host, { getSort, setSort }) {
  const thead = host.querySelector('thead');

  /** @param {Event} e */
  const onHeader = (e) => {
    if (e instanceof KeyboardEvent && e.key !== 'Enter' && e.key !== ' ') return;
    const th = e.target instanceof Element ? e.target.closest('th.dg-sortable') : null;
    const key = th instanceof HTMLElement ? th.dataset.key : undefined;
    if (!th || key === undefined) return;
    if (e instanceof KeyboardEvent) e.preventDefault(); // Space must not scroll the page

    const hadFocus = document.activeElement === th;
    const sort = getSort();
    const direction = nextDirection(sort?.key === key ? sort.direction : null);
    setSort(direction && { key, direction });

    // Re-rendering replaced the header; give keyboard users their place back.
    if (hadFocus) {
      for (const cell of host.querySelectorAll('th.dg-sortable')) {
        if (cell instanceof HTMLElement && cell.dataset.key === key) cell.focus();
      }
    }
  };

  thead?.addEventListener('click', onHeader);
  thead?.addEventListener('keydown', onHeader);
  return () => {
    thead?.removeEventListener('click', onHeader);
    thead?.removeEventListener('keydown', onHeader);
  };
}
