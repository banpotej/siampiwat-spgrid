// @ts-check
import { renderIcon } from './icons.js';

/** @typedef {'grid' | 'calendar'} ViewName */

/** Every mode a grid with the `calendar` option can show. */
export const VIEWS = /** @type {const} */ (['grid', 'calendar']);

/**
 * @param {unknown} view
 * @param {boolean} hasCalendar Whether the grid has the `calendar` option.
 * @throws {RangeError} an unknown view, or `'calendar'` without the `calendar` option
 */
export function assertView(view, hasCalendar) {
  if (!VIEWS.some((name) => name === view)) throw new RangeError(`SPGrid: unknown view "${view}"`);
  if (view === 'calendar' && !hasCalendar) {
    throw new RangeError('SPGrid: the calendar view needs the calendar option');
  }
}

/** Which mode of a grid with a `calendar` is showing, and the toolbar button that switches it. */
export class ViewMode {
  #hasCalendar;
  /** @type {ViewName} */ #view;

  /**
   * @param {ViewName | undefined} view The `defaultView` option (the calendar when the grid has one).
   * @param {boolean} hasCalendar
   */
  constructor(view, hasCalendar) {
    this.#hasCalendar = hasCalendar;
    this.#view = view ?? (hasCalendar ? 'calendar' : 'grid');
  }

  get view() {
    return this.#view;
  }

  /**
   * @param {ViewName} view
   * @returns {boolean} True when the mode changed.
   * @throws {RangeError} see `assertView`
   */
  set(view) {
    assertView(view, this.#hasCalendar);
    const changed = view !== this.#view;
    this.#view = view;
    return changed;
  }

  /**
   * Name the button for the mode a click leads to, with that mode's icon.
   *
   * @param {HTMLElement | null} button
   * @param {{ viewGrid: string, viewCalendar: string }} labels
   * @param {Record<import('../types.js').IconName, string>} icons
   */
  syncButton(button, labels, icons) {
    if (!button) return;
    const toCalendar = this.#view === 'grid';
    const label = toCalendar ? labels.viewCalendar : labels.viewGrid;
    button.setAttribute('aria-label', label);
    button.title = label;
    button.innerHTML = renderIcon(icons, toCalendar ? 'calendar_today' : 'view_column');
  }
}
