import { afterEach, describe, expect, it, vi } from 'vitest';
import { SPGrid } from '../../src/index.js';

/** @type {import('../../src/types.js').Column[]} */
const columns = [
  { key: 'name', label: 'Name' },
  {
    key: 'view',
    render: (_v, row) => `<button type="button" data-cell-action="view">${row.name}</button>`,
  },
  { key: 'ops', actions: [{ name: 'open', label: 'Open' }] },
];
const rows = [
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Bo' },
];

afterEach(() => {
  document.body.innerHTML = '';
});

describe('actions in a selectable grid', () => {
  it('report the column of the clicked cell, not the one next to it', () => {
    const onAction = vi.fn();
    const onCellClick = vi.fn();
    const el = document.createElement('div');
    document.body.append(el);
    const grid = new SPGrid(el, { columns, rows, rowKey: 'id', selectable: true, onAction });
    grid.on('cellClick', onCellClick);
    /** @type {HTMLElement} */ (
      el.querySelector('tbody tr:nth-child(2) [data-cell-action]')
    ).click();
    expect(onAction.mock.calls[0][0]).toMatchObject({ action: 'view', key: 'view', rowKey: 2 });
    expect(onCellClick.mock.calls[0][0]).toMatchObject({ key: 'view' });
    /** @type {HTMLElement} */ (el.querySelector('tbody tr [data-action="open"]')).click();
    expect(onAction.mock.calls[1][0]).toMatchObject({ action: 'open', key: 'ops', rowKey: 1 });
  });

  it('are unchanged without selectable', () => {
    const onAction = vi.fn();
    const el = document.createElement('div');
    document.body.append(el);
    new SPGrid(el, { columns, rows, rowKey: 'id', onAction });
    /** @type {HTMLElement} */ (el.querySelector('tbody tr [data-cell-action]')).click();
    expect(onAction.mock.calls[0][0]).toMatchObject({ key: 'view', rowKey: 1 });
  });
});
