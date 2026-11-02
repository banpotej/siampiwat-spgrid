// @ts-check

/**
 * Column reordering on the table header inside `host`: drag a header cell onto another (it lands before or after
 * it, by which half is hit), or focus a header cell and press Alt+Left / Alt+Right to move it one place. The
 * grid does the move through `onMove`; this only reports what the user asked for.
 *
 * @param {HTMLElement} host Element that currently contains the rendered table.
 * @param {(key: string, target: string, after: boolean) => void} onMove Move `key` before or after `target`
 *   (in reading order, so right-to-left is already taken care of).
 * @returns {() => void} Unbind.
 */
export function bindHeaderReorder(host, onMove) {
  const thead = host.querySelector('thead');
  if (!thead) return () => {};
  /** @type {string | null} */ let dragging = null;
  let fromHandle = false;

  /** @param {Event} e @returns {HTMLElement | null} */
  const cell = (e) => {
    const th = e.target instanceof Element ? e.target.closest('th[data-key]') : null;
    return th instanceof HTMLElement ? th : null;
  };
  const rtl = (/** @type {Element} */ el) => getComputedStyle(el).direction === 'rtl';
  const clearMarks = () => {
    for (const el of thead.querySelectorAll('.dg-dragging, .dg-drop-before, .dg-drop-after')) {
      el.classList.remove('dg-dragging', 'dg-drop-before', 'dg-drop-after');
    }
  };
  /** @param {HTMLElement} th @param {MouseEvent} e @returns {boolean} The pointer is in the half where "after" lies. */
  const isAfter = (th, e) => {
    const box = th.getBoundingClientRect();
    return e.clientX >= box.left + box.width / 2 !== rtl(th);
  };

  /** @param {Event} e */
  const onPointerDown = (e) => {
    fromHandle = e.target instanceof Element && e.target.closest('.dg-resize') !== null;
  };
  /** @param {Event} e */
  const onDragStart = (e) => {
    const th = cell(e);
    if (!th || fromHandle) {
      e.preventDefault(); // grabbing a resize handle resizes; it never drags the column
      return;
    }
    dragging = th.dataset.key ?? null;
    th.classList.add('dg-dragging');
    const transfer = /** @type {DragEvent} */ (e).dataTransfer;
    transfer?.setData('text/plain', dragging ?? ''); // Firefox starts no drag without data
    if (transfer) transfer.effectAllowed = 'move';
  };
  /** @param {Event} e */
  const onDragOver = (e) => {
    const th = cell(e);
    if (dragging === null || !th || !(e instanceof MouseEvent)) return;
    e.preventDefault(); // allow the drop
    for (const el of thead.querySelectorAll('.dg-drop-before, .dg-drop-after')) {
      el.classList.remove('dg-drop-before', 'dg-drop-after');
    }
    if (th.dataset.key !== dragging)
      th.classList.add(isAfter(th, e) ? 'dg-drop-after' : 'dg-drop-before');
  };
  /** @param {Event} e */
  const onDrop = (e) => {
    const th = cell(e);
    const key = dragging;
    if (key === null || !th || !(e instanceof MouseEvent)) return;
    e.preventDefault();
    const after = isAfter(th, e);
    dragging = null;
    clearMarks();
    if (th.dataset.key !== undefined) onMove(key, th.dataset.key, after);
  };
  const onDragEnd = () => {
    dragging = null;
    clearMarks();
  };
  /** @param {Event} e */
  const onKeyDown = (e) => {
    const th = cell(e);
    if (!(e instanceof KeyboardEvent) || !e.altKey || !th || e.target !== th) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const forward = (e.key === 'ArrowRight') !== rtl(th); // towards the next cell in the DOM
    const neighbour = forward ? th.nextElementSibling : th.previousElementSibling;
    const key = th.dataset.key;
    const target = neighbour instanceof HTMLElement ? neighbour.dataset.key : undefined;
    if (key === undefined || target === undefined) return;
    onMove(key, target, forward);
    // The header was redrawn; give keyboard users their place back.
    for (const next of host.querySelectorAll('th[data-key]')) {
      if (next instanceof HTMLElement && next.dataset.key === key) next.focus();
    }
  };

  /** @type {[string, (e: Event) => void][]} */
  const listeners = [
    ['pointerdown', onPointerDown],
    ['dragstart', onDragStart],
    ['dragover', onDragOver],
    ['drop', onDrop],
    ['dragend', onDragEnd],
    ['keydown', onKeyDown],
  ];
  for (const [type, fn] of listeners) thead.addEventListener(type, fn);
  return () => {
    for (const [type, fn] of listeners) thead.removeEventListener(type, fn);
  };
}
