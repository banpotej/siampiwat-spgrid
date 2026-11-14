// @ts-check
import { normalizeSelectable, selectionState } from '../core/selection.js';
import { escapeHtml } from '../utils/escape.js';
import { askConfirm } from './confirm.js';

/** @typedef {import('../types.js').Row} Row */
/** @typedef {import('../types.js').SelectionActionDef} SelectionActionDef */

/**
 * The bar over the table that goes with `selectable`: a "select all on this page" box (when the header row, which has
 * one, is not drawn), how many rows are selected, the `selectionActions` buttons and Clear selection. The parts that do
 * not apply stay hidden; `bindSelectionBar` shows and hides them.
 *
 * @param {{ actions: SelectionActionDef[], showAll: boolean,
 *   labels: Pick<Required<import('../types.js').Labels>, 'selectionActions' | 'selectAllOnPage' | 'clearSelection'> }} parts
 * @returns {string}
 */
export function renderSelectionBar({ actions, showAll, labels }) {
  const all = showAll
    ? `<label class="spg-sel-all"><input type="checkbox" class="spg-bar-all"><span>${escapeHtml(labels.selectAllOnPage)}</span></label>`
    : '';
  const buttons = actions
    .map(
      (a) =>
        `<button type="button" class="spg-sel-action${a.primary ? ' is-primary' : ''}" data-action="${escapeHtml(a.name)}">${escapeHtml(a.label)}</button>`,
    )
    .join('');
  return (
    `<div class="spg-selection-bar" role="toolbar" aria-label="${escapeHtml(labels.selectionActions)}" hidden>` +
    `${all}<span class="spg-sel-count" aria-live="polite" hidden></span>` +
    `<span class="spg-sel-actions" hidden>${buttons}</span>` +
    `<button type="button" class="spg-sel-clear" hidden>${escapeHtml(labels.clearSelection)}</button></div>`
  );
}

/**
 * @param {import('../types.js').SPGridOptions} options
 * @param {Parameters<typeof renderSelectionBar>[0]['labels']} labels
 * @returns {string} The bar's markup, or '' when the grid has none: it needs `selectable` and either `selectionActions` or
 *   a header row that is not drawn in 'multiple' mode (whose checkbox otherwise selects the page).
 */
export function selectionBarFor(options, labels) {
  const mode = normalizeSelectable(options.selectable);
  const showAll = options.showHeader === false && mode === 'multiple';
  if (!mode || !(options.selectionActions || showAll)) return '';
  return renderSelectionBar({ actions: options.selectionActions ?? [], showAll, labels });
}

/**
 * Keep the bar in step with the selection and run its buttons: an action asks first when it has `confirm`, then reports
 * `{ action, rows }` through `emit`.
 *
 * @param {HTMLElement} bar The element `renderSelectionBar` made.
 * @param {{
 *   actions: SelectionActionDef[],
 *   labels: Pick<Required<import('../types.js').Labels>, 'selectedCount' | 'confirmSelectionAction' | 'cancel'>,
 *   rowKey?: string,
 *   selection: { rows: () => Row[], change: (rows: Row[], on: boolean) => void },
 *   state: () => import('../types.js').GridState,
 *   visible: () => Row[],
 *   emit: (payload: { action: string, rows: Row[] }) => void,
 * }} grid
 * @returns {{ update: () => void, unbind: () => void }} `update` after every state change; `unbind` on destroy.
 */
export function bindSelectionBar(
  bar,
  { actions, labels, rowKey, selection, state, visible, emit },
) {
  const part = (/** @type {string} */ selector) =>
    /** @type {HTMLElement | null} */ (bar.querySelector(selector));
  const [count, buttons, clear] = [
    part('.spg-sel-count'),
    part('.spg-sel-actions'),
    part('.spg-sel-clear'),
  ];
  const all = /** @type {HTMLInputElement | null} */ (bar.querySelector('input.spg-bar-all'));

  const update = () => {
    const selected = selection.rows().length;
    if (count) {
      count.textContent = selected > 0 ? labels.selectedCount(selected) : '';
      count.hidden = selected === 0;
    }
    if (buttons) buttons.hidden = selected === 0;
    if (clear) clear.hidden = selected === 0;
    if (all) {
      const page = selectionState(visible(), state().selected, rowKey);
      all.checked = page === 'all';
      all.indeterminate = page === 'some';
    }
    bar.hidden = selected === 0 && !all;
  };

  /** @param {Event} e */
  const onClick = async (e) => {
    const target = e.target instanceof Element ? e.target : null;
    if (target?.closest('.spg-sel-clear')) return selection.change(selection.rows(), false);
    const button = target?.closest('.spg-sel-action');
    const action = actions.find(
      (a) => button instanceof HTMLElement && a.name === button.dataset.action,
    );
    if (!action || selection.rows().length === 0) return;
    if (action.confirm !== undefined && action.confirm !== false) {
      const message =
        typeof action.confirm === 'string'
          ? action.confirm
          : labels.confirmSelectionAction(action.label, selection.rows().length);
      const yes = await askConfirm(undefined, message, {
        root: bar.closest('.spg-root'),
        title: action.label,
        ok: action.label,
        cancel: labels.cancel,
      });
      if (!yes) return;
    }
    const rows = selection.rows(); // read after the question: the selection may have changed meanwhile
    if (rows.length > 0) emit({ action: action.name, rows });
  };

  /** @param {Event} e */
  const onChange = (e) => {
    if (e.target === all && all) selection.change(visible(), all.checked);
  };

  bar.addEventListener('click', onClick);
  bar.addEventListener('change', onChange);
  update();
  return {
    update,
    unbind: () => {
      bar.removeEventListener('click', onClick);
      bar.removeEventListener('change', onChange);
    },
  };
}
