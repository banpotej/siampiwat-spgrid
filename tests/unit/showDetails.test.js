import { beforeEach, describe, expect, it } from 'vitest';
import { DataGrid, showDetails, thaiLabels } from '../../src/index.js';

/** @type {import('../../src/index.js').Column[]} */
const columns = [
  { key: 'actions', actions: [{ name: 'view', label: 'View' }] },
  { key: 'no', label: 'No.' },
  { key: 'name', label: 'Name\nชื่อ' },
  { key: 'day', label: 'Day', type: 'date' },
  { key: 'paid', label: 'Paid', type: 'boolean' },
  {
    key: 'status',
    label: 'Status',
    type: 'badge',
    badges: { open: { label: 'Open', tone: 'info' } },
  },
  { key: 'note', label: 'Note' },
];
const row = {
  no: 'A-1',
  name: '<img src=x onerror=alert(1)>',
  day: new Date(2026, 10, 3),
  paid: true,
  status: 'open',
  note: null,
};

/** @returns {{ container: HTMLElement, root: HTMLElement }} */
const grid = () => {
  const container = document.createElement('div');
  document.body.append(container);
  new DataGrid(container, { columns, rows: [row] });
  return { container, root: /** @type {HTMLElement} */ (container.querySelector('.dg-root')) };
};

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('showDetails', () => {
  it('opens a labelled modal inside the grid root, from its container or the root itself', () => {
    const { container, root } = grid();
    showDetails(row, columns, { root: container });
    expect(root.querySelectorAll('.dg-modal')).toHaveLength(1);
    const dialog = /** @type {HTMLElement} */ (root.querySelector('[role="dialog"]'));
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.querySelector(`#${dialog.getAttribute('aria-labelledby')}`)).not.toBeNull();
    showDetails(row, columns, { root });
    expect(root.querySelectorAll('.dg-modal')).toHaveLength(2);
  });

  it('falls back to the first grid on the page, and to the body without one', () => {
    const { root } = grid();
    showDetails(row, columns);
    expect(root.querySelector('.dg-modal')).not.toBeNull();
    document.body.innerHTML = '';
    showDetails(row, columns);
    expect(document.body.querySelector(':scope > .dg-modal')).not.toBeNull();
  });

  it('lists every data column by default (no action column), with raw text, never as HTML', () => {
    const { container } = grid();
    showDetails(row, columns, { root: container });
    const terms = [...document.querySelectorAll('.dg-details dt')].map((dt) => dt.textContent);
    expect(terms).toEqual(['No.', 'Name / ชื่อ', 'Day', 'Paid', 'Status', 'Note']);
    expect(document.querySelector('.dg-details img')).toBeNull();
    expect(document.querySelectorAll('.dg-details dd')[1].textContent).toBe(row.name);
  });

  it('formats dates, booleans, badges and empty values', () => {
    const { container } = grid();
    showDetails(row, columns, { root: container, locale: 'en-GB' });
    const values = [...document.querySelectorAll('.dg-details dd')].map((dd) => dd.textContent);
    expect(values).toEqual(['A-1', row.name, '03/11/2026', 'Yes', 'Open', '-']);
    expect(document.querySelector('.dg-details dd .dg-badge-info')?.textContent).toBe('Open');
    expect(document.querySelector('.dg-details dd.dg-details-empty')).not.toBeNull();
  });

  it('puts the title, the status badge and an eyebrow in the header', () => {
    const { container } = grid();
    showDetails(row, columns, { root: container, title: (r) => `PO ${r.no}` });
    const head = /** @type {HTMLElement} */ (document.querySelector('.dg-details-head'));
    expect(head.textContent).toContain('PO A-1');
    expect(head.querySelector('.dg-details-eyebrow')?.textContent).toBe('Details');
    expect(head.querySelector('.dg-badge-info')).not.toBeNull();
  });

  it('uses the first data column as the default title', () => {
    const { container } = grid();
    showDetails(row, columns, { root: container });
    expect(document.querySelector('.dg-details-head')?.textContent).toContain('A-1');
  });

  it('shows the groups given, in order, with their headings, and marks wide items', () => {
    const { container } = grid();
    showDetails(row, columns, {
      root: container,
      groups: [
        ['First', ['name', 'unknown']],
        ['Second', ['no']],
      ],
      wide: ['name'],
    });
    const sections = [...document.querySelectorAll('.dg-details-group')];
    expect(sections.map((s) => s.querySelector('h3')?.textContent)).toEqual(['First', 'Second']);
    expect(sections[0].querySelectorAll('dt')).toHaveLength(1); // an unknown key is skipped
    expect(sections[0].querySelector('.dg-details-wide')).not.toBeNull();
    expect(sections[1].querySelector('.dg-details-wide')).toBeNull();
  });

  it('can be relabelled, and has Thai texts in thaiLabels', () => {
    const { container } = grid();
    showDetails(row, columns, { root: container, labels: thaiLabels });
    expect(document.querySelector('.dg-details-eyebrow')?.textContent).toBe('รายละเอียด');
    expect(document.querySelector('.dg-modal-x')?.getAttribute('aria-label')).toBe('ปิด');
    expect(document.querySelectorAll('.dg-details dd')[3].textContent).toBe('ใช่');
  });

  it('closes with the button, Esc, the backdrop or the returned function, and returns focus', () => {
    const { container } = grid();
    const opener = document.createElement('button');
    document.body.append(opener);
    for (const close of [
      () => /** @type {HTMLElement} */ (document.querySelector('.dg-modal-x')).click(),
      () =>
        document
          .querySelector('.dg-modal')
          ?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })),
      () => /** @type {HTMLElement} */ (document.querySelector('.dg-modal')).click(),
    ]) {
      opener.focus();
      showDetails(row, columns, { root: container });
      expect(document.activeElement).toBe(document.querySelector('.dg-modal-x'));
      close();
      expect(document.querySelector('.dg-modal')).toBeNull();
      expect(document.activeElement).toBe(opener);
    }
    showDetails(row, columns, { root: container })();
    expect(document.querySelector('.dg-modal')).toBeNull();
  });

  it('keeps Tab inside the modal', () => {
    const { container } = grid();
    showDetails(row, columns, { root: container });
    const close = /** @type {HTMLElement} */ (document.querySelector('.dg-modal-x'));
    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    close.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true); // only one focusable item: first and last are the same
  });
});
