// @ts-check

/** @typedef {import('../types.js').Row} Row */

/** What a double-click leaves alone: the control itself already does something with a click. */
const INTERACTIVE = 'button, a, input, select, textarea, label, [data-action], [data-cell-action]';

/**
 * Bind row activation to the persistent table host: a double-click on a row, or Enter while the row itself has
 * focus (`GridRenderer` makes the rows focusable). Buttons, links and form controls inside a row keep their own
 * behaviour. The row is looked up in the rows currently shown (never parsed from text). Returns the unbind function.
 *
 * @param {HTMLElement} host
 * @param {{
 *   getRows: () => Row[], rowKey?: string,
 *   emit: (event: 'rowActivate', payload: any) => void,
 * }} grid
 * @returns {() => void} Unbind.
 */
export function bindRowActivate(host, { getRows, rowKey, emit }) {
  /** @param {MouseEvent | KeyboardEvent} e @param {Element | null} tr */
  const activate = (e, tr) => {
    const row = getRows()[Number(tr instanceof HTMLElement ? tr.dataset.rowIndex : NaN)];
    if (!row) return;
    emit('rowActivate', {
      row,
      rowKey: rowKey === undefined ? undefined : row[rowKey],
      originalEvent: e,
    });
  };

  /** @param {MouseEvent} e */
  const onDblClick = (e) => {
    const target = e.target instanceof Element ? e.target : null;
    if (!target || target.closest(INTERACTIVE)) return;
    const tr = target.closest('tbody tr[data-row-index]');
    if (!tr || !host.contains(tr)) return;
    window.getSelection()?.removeAllRanges(); // the double-click also selected a word
    activate(e, tr);
  };

  /** @param {KeyboardEvent} e */
  const onKeyDown = (e) => {
    const target = e.target;
    if (e.key !== 'Enter' || !(target instanceof HTMLTableRowElement)) return;
    if (!target.matches('tbody tr[data-row-index]') || !host.contains(target)) return;
    // The handler may move focus (a dialog): without this the Enter would then press the button that got it.
    e.preventDefault();
    activate(e, target);
  };

  host.addEventListener('dblclick', onDblClick);
  host.addEventListener('keydown', onKeyDown);
  return () => {
    host.removeEventListener('dblclick', onDblClick);
    host.removeEventListener('keydown', onKeyDown);
  };
}
