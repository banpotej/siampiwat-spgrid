// @ts-check
import { readJson, writeJson } from '../utils/storage.js';

const PREFIX = 'spgrid:columnWidths:';
const MIN_WIDTH = 48;
const KEY_STEP = 10;
const KEY_STEP_BIG = 40;

/**
 * Rounded up: a width rounded down by a fraction of a pixel would wrap text that fits exactly.
 *
 * @param {HTMLElement} th
 * @returns {number}
 */
const widthOf = (th) => Math.ceil(th.getBoundingClientRect().width);

/**
 * Column resizing: drag the handle (`.spg-resize`) on a header cell's edge, or focus it and press the left or right
 * arrow (Shift for bigger steps). The first resize freezes every column at its current pixel width and switches
 * the table to a fixed layout (`spg-fixed`); after that only the dragged column and the table's width change, so the
 * other columns keep their size and a table wider than its wrapper scrolls. The widths are kept here, and the
 * renderer puts them back after each render. With a storage key the widths are also saved in localStorage when a
 * resize ends, and read back on creation (so the table starts out pinned).
 */
export class ColumnResizer {
  #host;
  #storageKey;
  #onResize;
  /** @type {Map<string, number> | null} Pixel width per column key; null until the first resize. */
  #widths = null;
  /** @type {{ th: HTMLElement, startX: number, startWidth: number, sign: number } | null} */
  #drag = null;

  /**
   * @param {HTMLElement} host Element the table is rendered into (it stays, its content is replaced).
   * @param {string} [storageKey] Name to save the widths under; nothing is saved without it.
   * @param {() => void} [onResize] Called after the widths change, so things placed by them (frozen columns) can move.
   */
  constructor(host, storageKey, onResize = () => {}) {
    this.#host = host;
    this.#storageKey = storageKey;
    this.#onResize = onResize;
    const saved = storageKey === undefined ? undefined : readJson(PREFIX + storageKey);
    if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
      const entries = Object.entries(saved).filter(
        ([, w]) => typeof w === 'number' && Number.isFinite(w) && w >= MIN_WIDTH,
      );
      if (entries.length > 0) this.#widths = new Map(entries.map(([k, w]) => [k, Math.round(w)]));
    }
  }

  #save() {
    if (this.#storageKey !== undefined && this.#widths) {
      writeJson(PREFIX + this.#storageKey, Object.fromEntries(this.#widths));
    }
  }

  /** @returns {Map<string, number> | null} */
  get widths() {
    return this.#widths;
  }

  /** @returns {() => void} Unbind. */
  bind() {
    const host = this.#host;
    host.addEventListener('pointerdown', this.#onPointerDown);
    host.addEventListener('keydown', this.#onKeyDown);
    return () => {
      host.removeEventListener('pointerdown', this.#onPointerDown);
      host.removeEventListener('keydown', this.#onKeyDown);
    };
  }

  /** @param {Event} event @returns {{ handle: HTMLElement, th: HTMLElement } | null} */
  #target(event) {
    const handle = event.target instanceof Element ? event.target.closest('.spg-resize') : null;
    const th = handle?.closest('th');
    return handle instanceof HTMLElement && th instanceof HTMLElement && th.dataset.key
      ? { handle, th }
      : null;
  }

  /** Pin every column at its current width and fix the table layout (once). */
  #freeze() {
    if (this.#widths) return;
    const cells = [...this.#host.querySelectorAll('th[data-key]')].map(
      (th) => /** @type {HTMLElement} */ (th),
    );
    const measured = cells.map((th) => widthOf(th)); // all measured before any is changed
    this.#widths = new Map();
    cells.forEach((th, i) => {
      this.#widths?.set(/** @type {string} */ (th.dataset.key), measured[i]);
      th.style.width = `${measured[i]}px`;
    });
    this.#host.querySelector('table')?.classList.add('spg-fixed');
    this.#fitTable();
  }

  /** The table is as wide as its columns together, so one column growing widens the table. */
  #fitTable() {
    const table = this.#host.querySelector('table');
    if (!table || !this.#widths) return;
    let total = 0;
    for (const th of table.querySelectorAll('th[data-key]')) {
      total += this.#widths.get(/** @type {HTMLElement} */ (th).dataset.key ?? '') ?? 0;
    }
    table.style.width = `${total}px`;
    this.#onResize();
  }

  /** @param {HTMLElement} th @param {number} px */
  #setWidth(th, px) {
    const width = Math.max(MIN_WIDTH, Math.round(px));
    this.#widths?.set(/** @type {string} */ (th.dataset.key), width);
    th.style.width = `${width}px`;
    this.#fitTable();
  }

  /** @param {Event} event */
  #onPointerDown = (event) => {
    const hit = this.#target(event);
    if (!hit || !(event instanceof MouseEvent) || event.button !== 0) return;
    event.preventDefault(); // no text selection while dragging
    this.#freeze();
    const { handle, th } = hit;
    const rtl = getComputedStyle(th).direction === 'rtl';
    this.#drag = {
      th,
      startX: event.clientX,
      startWidth: this.#widths?.get(/** @type {string} */ (th.dataset.key)) ?? widthOf(th),
      sign: rtl ? -1 : 1,
    };
    handle.classList.add('spg-resizing');
    handle.setPointerCapture?.(/** @type {PointerEvent} */ (event).pointerId);

    /** @param {Event} e */
    const move = (e) => {
      const drag = this.#drag;
      if (drag && e instanceof MouseEvent) {
        this.#setWidth(drag.th, drag.startWidth + drag.sign * (e.clientX - drag.startX));
      }
    };
    const end = () => {
      this.#drag = null;
      this.#save();
      handle.classList.remove('spg-resizing');
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end);
      handle.removeEventListener('pointercancel', end);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  };

  /** @param {Event} event */
  #onKeyDown = (event) => {
    const hit = this.#target(event);
    if (!hit || !(event instanceof KeyboardEvent)) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    this.#freeze();
    const rtl = getComputedStyle(hit.th).direction === 'rtl';
    const step = event.shiftKey ? KEY_STEP_BIG : KEY_STEP;
    const direction = (event.key === 'ArrowRight' ? 1 : -1) * (rtl ? -1 : 1);
    const current =
      this.#widths?.get(/** @type {string} */ (hit.th.dataset.key)) ?? widthOf(hit.th);
    this.#setWidth(hit.th, current + direction * step);
    this.#save();
  };
}
