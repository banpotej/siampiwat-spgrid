// @ts-check

/** @typedef {import('../types.js').Column} Column */
/** @typedef {import('../types.js').Row} Row */

/**
 * Bind the ONE delegated click listener for action buttons (`button[data-action]`) and cell actions
 * (`[data-cell-action]`, put there by a column's `render()`) to the persistent table host, and return a
 * function that removes it. The row is looked up in the rows currently shown (never parsed from text),
 * the column by the cell's position (not counting the selection column). Disabled buttons emit nothing. Native buttons already click on
 * Enter and Space, so keyboard users are covered.
 *
 * Cell actions emit 'cellClick' (with the original event, so a link's default can be prevented) and
 * 'action', so a consumer needs just one handler for both.
 *
 * @param {HTMLElement} host
 * @param {{
 *   getRows: () => Row[], getColumns: () => Column[], rowKey?: string,
 *   emit: (event: 'action' | 'cellClick', payload: any) => void,
 * }} grid
 * @returns {() => void} Unbind.
 */
export function bindActionEvents(host, { getRows, getColumns, rowKey, emit }) {
  /** @param {Event} e */
  const onClick = (e) => {
    const target =
      e.target instanceof Element ? e.target.closest('[data-action], [data-cell-action]') : null;
    const tr = target?.closest('tbody tr');
    const td = target?.closest('td');
    if (!target || !tr || !td || !host.contains(target)) return;
    if (target instanceof HTMLButtonElement && target.disabled) return;
    const row = getRows()[Number(tr instanceof HTMLElement ? tr.dataset.rowIndex : NaN)];
    // The selection column (`selectable`) is a cell before the first column's.
    const lead = td.parentElement?.querySelector(':scope > .spg-select-cell') ? 1 : 0;
    const column = getColumns()[td.cellIndex - lead];
    if (!row || !column) return;

    const base = { key: column.key, row, rowKey: rowKey === undefined ? undefined : row[rowKey] };
    const cellAction = target instanceof HTMLElement ? target.dataset.cellAction : undefined;
    if (cellAction !== undefined) {
      emit('cellClick', { ...base, originalEvent: e });
      emit('action', { action: cellAction, ...base });
    } else if (target instanceof HTMLElement && target.dataset.action !== undefined) {
      emit('action', { action: target.dataset.action, ...base });
    }
  };

  host.addEventListener('click', onClick);
  return () => host.removeEventListener('click', onClick);
}
