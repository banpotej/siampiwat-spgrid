// @ts-check

const ROW = 'tbody tr[data-row-index]';
const PAGE_STEP = 10; // rows PageUp / PageDown move

/** @param {HTMLElement} host @returns {HTMLElement[]} The rows drawn (group headers have no row index). */
const rowsOf = (host) => [...host.querySelectorAll(ROW)].filter((tr) => tr instanceof HTMLElement);

/**
 * Make the rows focusable with a roving tab stop: only the current row has `tabindex="0"`, the others `-1` (arrow keys
 * move between them, see `bindRowNavigation`), so Tab goes through the table in one stop.
 *
 * @param {HTMLElement} host
 * @param {{ activatable: boolean, current: number }} options `current`: position of the row that holds the tab stop;
 *   clamped into range.
 * @returns {number} The position that was used.
 */
export function prepareRows(host, { activatable, current }) {
  const rows = rowsOf(host);
  const at = Math.min(Math.max(current, 0), Math.max(rows.length - 1, 0));
  rows.forEach((tr, i) => {
    tr.classList.add('spg-focusable');
    if (activatable) tr.classList.add('spg-activatable');
    tr.setAttribute('tabindex', i === at ? '0' : '-1');
  });
  return at;
}

/**
 * Arrow keys (Up, Down), Home, End, PageUp and PageDown move focus between rows while a row, or its selection checkbox,
 * has it; the row that gets focus holds the tab stop. A click or Tab into a row (or a control in it) makes it current too.
 *
 * @param {HTMLElement} host
 * @param {(position: number) => void} onCurrent Told the position of the row that became current.
 * @returns {() => void} Unbind.
 */
export function bindRowNavigation(host, onCurrent) {
  /** @param {HTMLElement} tr */
  const makeCurrent = (tr) => {
    for (const row of rowsOf(host)) row.setAttribute('tabindex', row === tr ? '0' : '-1');
    onCurrent(Number(tr.dataset.rowIndex));
  };

  /** @param {FocusEvent} e */
  const onFocusIn = (e) => {
    const tr = e.target instanceof Element ? e.target.closest(ROW) : null;
    if (tr instanceof HTMLElement && host.contains(tr)) makeCurrent(tr);
  };

  /** @param {KeyboardEvent} e */
  const onKeyDown = (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement) || e.altKey || e.ctrlKey || e.metaKey) return;
    if (!target.matches(`${ROW}, input.spg-select`)) return;
    const rows = rowsOf(host);
    const from = rows.indexOf(/** @type {HTMLElement} */ (target.closest(ROW)));
    /** @type {Record<string, number>} */
    const to = {
      ArrowDown: from + 1,
      ArrowUp: from - 1,
      PageDown: from + PAGE_STEP,
      PageUp: from - PAGE_STEP,
      Home: 0,
      End: rows.length - 1,
    };
    if (from < 0 || !(e.key in to)) return;
    e.preventDefault();
    rows[Math.min(Math.max(to[e.key], 0), rows.length - 1)].focus();
  };

  host.addEventListener('focusin', onFocusIn);
  host.addEventListener('keydown', onKeyDown);
  return () => {
    host.removeEventListener('focusin', onFocusIn);
    host.removeEventListener('keydown', onKeyDown);
  };
}

/**
 * Remember what has focus inside the table (a row, or a selection checkbox) so it can be given back after the table is
 * drawn again, which replaces every element.
 *
 * @param {HTMLElement} host
 * @returns {() => void} Call it once the table is redrawn.
 */
export function keepFocus(host) {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || !host.contains(active)) return () => {};
  const tr = active.closest(ROW);
  const kind = active.matches('input.spg-select-all')
    ? 'all'
    : tr instanceof HTMLElement && active.matches(`${ROW}, input.spg-select`)
      ? active === tr
        ? 'row'
        : 'box'
      : null;
  if (kind === null) return () => {};
  const id = tr instanceof HTMLElement ? tr.dataset.rowId : undefined;
  const index = tr instanceof HTMLElement ? tr.dataset.rowIndex : undefined;
  return () => {
    const rows = rowsOf(host);
    const row =
      (id === undefined ? undefined : rows.find((r) => r.dataset.rowId === id)) ??
      rows.find((r) => r.dataset.rowIndex === index);
    /** @type {HTMLElement | null | undefined} */
    const target =
      kind === 'all'
        ? host.querySelector('input.spg-select-all')
        : kind === 'row'
          ? row
          : row?.querySelector('input.spg-select');
    target?.focus({ preventScroll: true });
  };
}
