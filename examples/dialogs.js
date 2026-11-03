const FOCUSABLE =
  'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled)';

/**
 * Open `box` as a modal in the grid's own look (.dg-modal*); it lives inside .dg-root for the theme tokens.
 * Esc and a click on the backdrop close it, Tab stays inside it, and focus goes back to where it was.
 *
 * @param {HTMLElement} box The `.dg-modal-box` with its content.
 * @param {{ role?: string, labelledBy: string, describedBy?: string, focus: HTMLElement, onClose?: () => void }} options
 * @returns {() => void} Closes the modal.
 */
export function openModal(box, { role = 'dialog', labelledBy, describedBy, focus, onClose }) {
  const opener = document.activeElement;
  const overlay = document.createElement('div');
  overlay.className = 'dg-modal';
  box.setAttribute('role', role);
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-labelledby', labelledBy);
  if (describedBy) box.setAttribute('aria-describedby', describedBy);
  overlay.append(box);

  const close = () => {
    overlay.remove();
    opener?.focus?.();
    onClose?.();
  };
  overlay.addEventListener('click', (e) => e.target === overlay && close());
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return close();
    if (e.key !== 'Tab') return;
    const items = [...box.querySelectorAll(FOCUSABLE)];
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  document.querySelector('#grid .dg-root').append(overlay);
  focus.focus();
  return close;
}

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text; // textContent: never parsed as HTML
  return node;
};

/** Ask before cancelling a PO; resolves true only on the red button. */
export function confirmCancel(row) {
  return new Promise((resolve) => {
    const box = el('div', 'dg-modal-box confirm-cancel');
    const icon = el('div', 'dg-modal-icon', '!');
    icon.setAttribute('aria-hidden', 'true');
    const title = el('h2', 'dg-modal-title', 'ยกเลิกใบสั่งซื้อ');
    title.id = 'cancel-title';
    const text = el('p', 'dg-modal-text', 'ต้องการยกเลิกเอกสาร ');
    text.id = 'cancel-text';
    text.append(el('strong', '', row.poNumber), ' ใช่หรือไม่');
    const no = el('button', 'dg-modal-btn dg-modal-cancel', 'ไม่ยกเลิก');
    const yes = el('button', 'dg-modal-btn dg-modal-ok', 'ยกเลิกเอกสาร');
    no.type = yes.type = 'button';
    const actions = el('div', 'dg-modal-actions');
    actions.append(no, yes);
    box.append(icon, title, text, actions);

    let answer = false;
    const close = openModal(box, {
      role: 'alertdialog',
      labelledBy: 'cancel-title',
      describedBy: 'cancel-text',
      focus: no, // the safe choice gets the focus
      onClose: () => resolve(answer),
    });
    yes.addEventListener('click', () => {
      answer = true;
      close();
    });
    no.addEventListener('click', close);
  });
}
