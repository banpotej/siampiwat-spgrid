// @ts-check
import { escapeHtml } from '../utils/escape.js';

/**
 * @typedef {object} ConfirmDialog Where and how the built-in dialog shows up.
 * @property {HTMLElement | null} root Element that carries the theme tokens (`.spg-root`); the dialog is added inside it.
 * @property {string} title
 * @property {string} ok
 * @property {string} cancel
 */

/**
 * Show the built-in modal and wait for the answer. Esc, a click on the backdrop and Cancel answer no.
 *
 * @param {string} message
 * @param {ConfirmDialog} dialog
 * @returns {Promise<boolean>}
 */
function showDialog(message, { root, title, ok, cancel }) {
  if (!root) return Promise.resolve(window.confirm(message));
  const opener = /** @type {HTMLElement | null} */ (document.activeElement);
  const overlay = document.createElement('div');
  overlay.className = 'spg-modal';
  overlay.innerHTML =
    `<div class="spg-modal-box" role="alertdialog" aria-modal="true" aria-labelledby="spg-modal-title" aria-describedby="spg-modal-text">` +
    `<div class="spg-modal-icon" aria-hidden="true">!</div>` +
    `<h2 class="spg-modal-title" id="spg-modal-title">${escapeHtml(title)}</h2>` +
    `<p class="spg-modal-text" id="spg-modal-text">${escapeHtml(message)}</p>` +
    `<div class="spg-modal-actions">` +
    `<button type="button" class="spg-modal-btn spg-modal-cancel">${escapeHtml(cancel)}</button>` +
    `<button type="button" class="spg-modal-btn spg-modal-ok">${escapeHtml(ok)}</button>` +
    `</div></div>`;
  const cancelBtn = /** @type {HTMLButtonElement} */ (overlay.querySelector('.spg-modal-cancel'));
  const okBtn = /** @type {HTMLButtonElement} */ (overlay.querySelector('.spg-modal-ok'));
  return new Promise((resolve) => {
    /** @param {boolean} answer */
    const close = (answer) => {
      overlay.removeEventListener('keydown', onKey);
      overlay.remove();
      opener?.focus?.();
      resolve(answer);
    };
    /** @param {KeyboardEvent} event */
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(false);
      } else if (event.key === 'Tab') {
        // Keep focus inside the dialog: two buttons, so Tab just swaps between them.
        event.preventDefault();
        (document.activeElement === okBtn ? cancelBtn : okBtn).focus();
      }
    };
    overlay.addEventListener('keydown', onKey);
    overlay.addEventListener('click', (event) => event.target === overlay && close(false));
    cancelBtn.addEventListener('click', () => close(false));
    okBtn.addEventListener('click', () => close(true));
    root.append(overlay);
    cancelBtn.focus(); // the safe choice gets the focus, so a stray Enter never resets
  });
}

/**
 * Ask the user to confirm an action.
 *
 * @param {false | ((message: string) => boolean | Promise<boolean>) | undefined} confirm `false` skips the question
 *   (always yes); a function is your own dialog; undefined shows the built-in modal.
 * @param {string} message
 * @param {ConfirmDialog} dialog Used by the built-in modal only.
 * @returns {Promise<boolean>} True only when the answer is exactly `true`; a throwing or rejecting dialog counts as no.
 */
export async function askConfirm(confirm, message, dialog) {
  if (confirm === false) return true;
  try {
    return (await (confirm ?? ((text) => showDialog(text, dialog)))(message)) === true;
  } catch {
    return false;
  }
}
