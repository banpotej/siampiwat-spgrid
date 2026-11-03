// @ts-check
import { isActionColumn } from '../core/columns.js';
import { resolveLabels } from './labels.js';

const FOCUSABLE =
  'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled)';

let seq = 0;

/** @typedef {import('../types.js').Column} Column */

/**
 * @typedef {object} DetailsOptions
 * @property {HTMLElement} [root] Element inside the grid that carries the theme tokens: the grid's container or its
 *   `.dg-root`. The modal is added to the `.dg-root` found there; default the first `.dg-root` on the page, else `document.body`.
 * @property {(row: Record<string, any>) => string} [title] The heading; default the first data column's value.
 * @property {[string, string[]][]} [groups] Sections: a heading (empty for none) and the keys of the columns it lists, in
 *   order. Default one section with every data column.
 * @property {string[]} [wide] Keys of the columns whose value takes a full line instead of half of one. Default none.
 * @property {import('../types.js').Labels} [labels] UI texts (`details`, `close`, `yes`, `no`); default English.
 * @property {string} [locale] BCP 47 tag for `date` columns; default the browser's.
 */

/**
 * @param {string} tag
 * @param {string} [className]
 * @param {string} [text] Set as textContent, so it is never parsed as HTML.
 * @returns {HTMLElement}
 */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Open `box` as a modal in the grid's own look (`.dg-modal*`) inside `root`. Esc and a click on the backdrop close
 * it, Tab stays inside it, and focus goes back to where it was.
 *
 * @param {HTMLElement} root
 * @param {HTMLElement} box The `.dg-modal-box` with its content.
 * @param {{ labelledBy: string, focus: HTMLElement }} options
 * @returns {() => void} Closes the modal.
 */
function openModal(root, box, { labelledBy, focus }) {
  const opener = /** @type {HTMLElement | null} */ (document.activeElement);
  const overlay = el('div', 'dg-modal');
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-labelledby', labelledBy);
  overlay.append(box);
  const close = () => {
    overlay.remove();
    opener?.focus?.();
  };
  overlay.addEventListener('click', (e) => e.target === overlay && close());
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') return close();
    if (e.key !== 'Tab') return;
    const items = [...box.querySelectorAll(FOCUSABLE)];
    const first = /** @type {HTMLElement} */ (items[0]);
    const last = /** @type {HTMLElement} */ (items[items.length - 1]);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  root.append(overlay);
  focus.focus();
  return close;
}

/**
 * Row details: a tinted header (title, and the status badge when there is a `status` badge column), then the
 * facts in groups. Every value is set as text, so row data is never parsed as HTML. Call it from `onRowActivate`
 * or `onAction`:
 *
 * `onRowActivate: ({ row }) => showDetails(row, columns, { root: container })`
 *
 * @param {Record<string, any>} row
 * @param {Column[]} columns Action columns are skipped.
 * @param {DetailsOptions} [options]
 * @returns {() => void} Closes the modal.
 */
export function showDetails(row, columns, options = {}) {
  const labels = resolveLabels(options.labels);
  const data = columns.filter((c) => !isActionColumn(c));
  const { title: titleOf = (r) => String(r[data[0]?.key] ?? ''), wide = [] } = options;
  const groups = options.groups ?? [['', data.map((c) => c.key)]];
  const root =
    options.root?.closest('.dg-root') ??
    options.root?.querySelector('.dg-root') ??
    document.querySelector('.dg-root') ??
    document.body;
  /** @param {Column} col @param {unknown} value */
  const text = (col, value) => {
    if (value === null || value === undefined || value === '') return '-';
    if (col.type === 'date')
      return new Date(/** @type {any} */ (value)).toLocaleDateString(options.locale);
    if (col.type === 'boolean') return value ? labels.yes : labels.no;
    return col.type === 'badge'
      ? (col.badges?.[String(value)]?.label ?? String(value))
      : String(value);
  };
  /** @param {Column} col */
  const toneOf = (col) =>
    col.type === 'badge' ? col.badges?.[String(row[col.key])]?.tone : undefined;
  /** @param {Column} col @param {string} value */
  const badge = (col, value) => el('span', `dg-badge dg-badge-${toneOf(col)}`, value);

  const id = `dg-details-${++seq}`;
  const title = el('h2', 'dg-modal-title');
  title.id = id;
  const sub = el('span', 'dg-details-sub');
  const status = data.find((c) => c.key === 'status');
  if (status && toneOf(status)) sub.append(badge(status, text(status, row.status)));
  title.append(el('span', 'dg-details-eyebrow', labels.details), titleOf(row), sub);

  const close = el('button', 'dg-modal-x');
  close.setAttribute('type', 'button');
  close.setAttribute('aria-label', labels.close);
  close.innerHTML =
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  const body = el('div', 'dg-details-body');
  for (const [heading, keys] of groups) {
    const list = el('dl');
    for (const col of keys.map((key) => data.find((c) => c.key === key))) {
      if (!col) continue;
      const value = text(col, row[col.key]);
      const item = el('div', wide.includes(col.key) ? 'dg-details-wide' : '');
      const dd = el('dd', value === '-' ? 'dg-details-empty' : '');
      if (toneOf(col) && value !== '-') dd.append(badge(col, value));
      else dd.textContent = value;
      item.append(el('dt', '', (col.label ?? col.key).replace(/\s*\n\s*/g, ' / ')), dd);
      list.append(item);
    }
    const section = el('section', 'dg-details-group');
    if (heading) section.append(el('h3', '', heading));
    section.append(list);
    body.append(section);
  }

  const head = el('div', 'dg-details-head');
  head.append(title);
  const box = el('div', 'dg-modal-box dg-details');
  box.append(close, head, body); // the button is positioned over the corner; first in tab order
  const closeModal = openModal(/** @type {HTMLElement} */ (root), box, {
    labelledBy: id,
    focus: close,
  });
  close.addEventListener('click', closeModal);
  return closeModal;
}
