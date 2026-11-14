// @ts-check

/** @typedef {import('../types.js').Row} Row */

const ROW = 'tbody tr[data-row-index]';

/**
 * Bind the selection checkboxes and the Space key to the persistent table host: a click on a row's checkbox (de)selects
 * that row, the header checkbox (de)selects every row on the page, and Space while a row itself has focus toggles it.
 * The row is looked up in the rows currently shown (never parsed from text). Returns the unbind function.
 *
 * @param {HTMLElement} host
 * @param {{ getRows: () => Row[], change: (rows: Row[], on: boolean) => void }} grid
 * @returns {() => void} Unbind.
 */
export function bindSelection(host, { getRows, change }) {
  /** @param {Element | null} el @returns {Row | undefined} */
  const rowOf = (el) => {
    const tr = el?.closest(ROW);
    return tr instanceof HTMLElement && host.contains(tr)
      ? getRows()[Number(tr.dataset.rowIndex)]
      : undefined;
  };

  /** @param {Event} e */
  const onChange = (e) => {
    const box = e.target;
    if (!(box instanceof HTMLInputElement)) return;
    if (box.classList.contains('spg-select-all')) return change(getRows(), box.checked);
    const row = box.classList.contains('spg-select') ? rowOf(box) : undefined;
    if (row) change([row], box.checked);
  };

  /** @param {KeyboardEvent} e */
  const onKeyDown = (e) => {
    const tr = e.target;
    if (e.key !== ' ' || !(tr instanceof HTMLElement) || !tr.matches(ROW)) return;
    const row = rowOf(tr);
    if (!row) return;
    e.preventDefault(); // Space would scroll the page
    change([row], tr.getAttribute('aria-selected') !== 'true');
  };

  host.addEventListener('change', onChange);
  host.addEventListener('keydown', onKeyDown);
  return () => {
    host.removeEventListener('change', onChange);
    host.removeEventListener('keydown', onKeyDown);
  };
}
