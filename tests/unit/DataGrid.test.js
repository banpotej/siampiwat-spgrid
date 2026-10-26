import { describe, expect, it } from 'vitest';
import { DataGrid } from '../../src/index.js';

const columns = [{ key: 'id', label: 'ID' }, { key: 'name' }];

describe('DataGrid', () => {
  it('renders headers and rows', () => {
    const el = document.createElement('div');
    new DataGrid(el, { columns, rows: [{ id: 1, name: 'Ada' }] });
    expect([...el.querySelectorAll('th')].map((t) => t.textContent)).toEqual(['ID', 'name']);
    expect(el.querySelectorAll('tbody tr')).toHaveLength(1);
  });

  it('escapes cell content', () => {
    const el = document.createElement('div');
    new DataGrid(el, { columns, rows: [{ id: 1, name: '<script>x</script>' }] });
    expect(el.querySelector('script')).toBeNull();
    expect(el.querySelectorAll('td')[1].textContent).toBe('<script>x</script>');
  });

  it('setRows re-renders and destroy clears', () => {
    const el = document.createElement('div');
    const grid = new DataGrid(el, { columns });
    grid.setRows([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ]);
    expect(el.querySelectorAll('tbody tr')).toHaveLength(2);
    grid.destroy();
    expect(el.innerHTML).toBe('');
  });

  it('rejects invalid container', () => {
    expect(() => new DataGrid(/** @type {any} */ (null), { columns })).toThrow(TypeError);
  });
});
