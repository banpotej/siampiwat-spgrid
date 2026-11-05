// @ts-check
import { escapeHtml } from '../utils/escape.js';
import { openColumnDialog } from './columnDialog.js';
import { renderIcon } from './icons.js';

/** @typedef {import('../types.js').IconName} IconName */
/** @typedef {import('./columnDialog.js').ColumnSettings} ColumnSettings */
/** @typedef {import('./columnDialog.js').DialogLabels} DialogLabels */

/**
 * The "Settings" button; it joins the toolbar's input group and opens the settings modal.
 *
 * @param {string} label Text of the button's aria-label and tooltip.
 * @param {Record<IconName, string>} icons
 * @returns {string}
 */
export function renderColumnPicker(label, icons) {
  const text = escapeHtml(label);
  return `<button type="button" class="spg-tool-btn spg-columns-btn" aria-haspopup="dialog" aria-expanded="false" aria-label="${text}" title="${text}">${renderIcon(icons, 'settings')}</button>`;
}

/**
 * The button is marked `data-active` while any column is hidden (it turns blue, see columns.css).
 *
 * @param {HTMLElement | null} picker
 * @param {string[]} hidden
 */
export function syncColumnPicker(picker, hidden) {
  picker?.querySelector('.spg-columns-btn')?.toggleAttribute('data-active', hidden.length > 0);
}

/**
 * Bind the button: a click opens the settings modal; Apply reports the chosen settings through `onApply`.
 *
 * @param {HTMLElement} picker The toolbar: it holds the button.
 * @param {{
 *   columns: { key: string, label: string, sortable?: boolean }[],
 *   groupColumns?: { key: string, label: string }[],
 *   labels: DialogLabels,
 *   getState: () => ColumnSettings,
 *   onApply: (settings: ColumnSettings) => void,
 *   onReset?: () => void,
 * }} dialog
 * @returns {() => void} Unbind (also dismisses an open modal).
 */
export function bindColumnPicker(
  picker,
  { columns, groupColumns, labels, getState, onApply, onReset },
) {
  const button = /** @type {HTMLButtonElement} */ (picker.querySelector('.spg-columns-btn'));
  const root = /** @type {HTMLElement} */ (picker.closest('.spg-root') ?? picker);
  /** @type {(() => void) | null} */
  let dismiss = null;

  const onClick = () => {
    if (dismiss) return;
    button.setAttribute('aria-expanded', 'true');
    dismiss = openColumnDialog(
      root,
      columns,
      getState(),
      labels,
      (settings) => {
        dismiss = null;
        button.setAttribute('aria-expanded', 'false');
        if (settings) onApply(settings);
      },
      onReset,
      groupColumns,
    );
  };

  button.addEventListener('click', onClick);
  return () => {
    button.removeEventListener('click', onClick);
    dismiss?.();
  };
}
