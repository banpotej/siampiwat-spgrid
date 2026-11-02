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

const formatValue = (value, type) => {
  if (value === null || value === undefined || value === '') return '-';
  if (type === 'date') return new Date(value).toLocaleDateString('th-TH');
  if (type === 'boolean') return value ? 'ใช่' : 'ไม่ใช่';
  return String(value);
};

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text; // textContent: never parsed as HTML
  return node;
};

const badge = (tone, text) => el('span', `dg-badge dg-badge-${tone}`, text);

const GROUPS = [
  ['เอกสาร', ['rfqNumber', 'description', 'purchasingType', 'creationType', 'companyCode']],
  ['กำหนดการ', ['submittedDate', 'deliveryDate', 'deliveryComplete']],
  ['ผู้เกี่ยวข้อง', ['vendor', 'creator', 'recipient', 'claimer', 'cancelBy']],
];

/** One label/value pair of the details sheet. */
function detailItem(col, row) {
  const text = formatValue(row[col.key], col.type);
  const item = el('div', col.key === 'description' ? 'wide' : '');
  const dd = el('dd', text === '-' ? 'empty' : '');
  const tone = col.type === 'badge' ? col.badges?.[row[col.key]]?.tone : undefined;
  if (tone) dd.append(badge(tone, text));
  else dd.textContent = text;
  item.append(el('dt', '', col.label), dd);
  return item;
}

/** Row details: a tinted header (PO number + status), then the facts in groups. */
export function showDetails(row, columns) {
  const box = el('div', 'dg-modal-box details');

  const title = el('h2', 'dg-modal-title');
  title.id = 'details-title';
  const sub = el('span', 'details-sub');
  const tone = columns.find((c) => c.key === 'status')?.badges?.[row.status]?.tone;
  if (tone) sub.append(badge(tone, formatValue(row.status, 'badge')));
  title.append(el('span', 'details-eyebrow', 'รายละเอียด'), row.poNumber, sub);

  const close = el('button', 'dg-modal-x');
  close.type = 'button';
  close.setAttribute('aria-label', 'ปิด');
  close.innerHTML =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  const body = el('div', 'details-body');
  for (const [heading, keys] of GROUPS) {
    const list = el('dl');
    for (const key of keys) {
      const col = columns.find((c) => c.key === key);
      if (col) list.append(detailItem(col, row));
    }
    const section = el('section', 'details-group');
    section.append(el('h3', '', heading), list);
    body.append(section);
  }

  const head = el('div', 'details-head');
  head.append(title);
  box.append(close, head, body); // the button is positioned over the corner; first in tab order
  const closeModal = openModal(box, { labelledBy: 'details-title', focus: close });
  close.addEventListener('click', closeModal);
}

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
