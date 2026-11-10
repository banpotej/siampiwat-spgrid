// @ts-check
import { openConditionDialog } from './conditionDialog.js';

/**
 * Bind the Advanced filter button: a click opens the condition modal; Apply sets the grid's advanced filter. The button
 * takes the accent tint (`data-active`) while a filter is set, however it was set.
 *
 * @param {import('../SPGrid.js').SPGrid} grid
 * @param {ReturnType<typeof import('./toolbar.js').mountShell>} shell
 * @param {Required<import('../types.js').Labels>} labels
 * @param {() => import('../types.js').Column[]} getColumns
 * @returns {() => void} Unbind (also dismisses an open modal).
 */
export function bindAdvancedFilter(grid, shell, labels, getColumns) {
  const button = shell.advancedButton;
  if (!button) return () => {};
  const root = /** @type {HTMLElement} */ (shell.host.closest('.spg-root') ?? shell.host);
  /** @type {(() => void) | null} */
  let dismiss = null;
  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-expanded', 'false');
  const sync = () => button.toggleAttribute('data-active', grid.getAdvancedFilter() !== null);

  const onClick = () => {
    if (dismiss) return;
    button.setAttribute('aria-expanded', 'true');
    dismiss = openConditionDialog(root, getColumns(), grid.getAdvancedFilter(), labels, (tree) => {
      dismiss = null;
      button.setAttribute('aria-expanded', 'false');
      if (tree !== undefined) grid.setAdvancedFilter(tree);
    });
  };
  button.addEventListener('click', onClick);
  const unsubscribe = grid.on('filterChange', sync);
  return () => {
    button.removeEventListener('click', onClick);
    unsubscribe();
    dismiss?.();
  };
}
