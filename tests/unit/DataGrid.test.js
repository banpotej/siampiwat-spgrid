import { describe, expect, it } from 'vitest';
import { SPGrid } from '../../src/index.js';

const columns = [{ key: 'id', label: 'ID' }, { key: 'name' }];

describe('SPGrid', () => {
  it('renders headers and rows', () => {
    const el = document.createElement('div');
    new SPGrid(el, { columns, rows: [{ id: 1, name: 'Ada' }] });
    expect([...el.querySelectorAll('th')].map((t) => t.textContent)).toEqual(['ID', 'name']);
    expect(el.querySelectorAll('tbody tr')).toHaveLength(1);
  });

  it('escapes cell content', () => {
    const el = document.createElement('div');
    new SPGrid(el, { columns, rows: [{ id: 1, name: '<script>x</script>' }] });
    expect(el.querySelector('script')).toBeNull();
    expect(el.querySelectorAll('td')[1].textContent).toBe('<script>x</script>');
  });

  it('setRows re-renders and destroy clears', () => {
    const el = document.createElement('div');
    const grid = new SPGrid(el, { columns });
    grid.setRows([
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ]);
    expect(el.querySelectorAll('tbody tr')).toHaveLength(2);
    grid.destroy();
    expect(el.innerHTML).toBe('');
  });

  it('setRows with the same array does not re-render', () => {
    const el = document.createElement('div');
    const rows = [{ id: 1, name: 'a' }];
    const grid = new SPGrid(el, { columns, rows });
    const table = el.querySelector('table');
    grid.setRows(rows);
    expect(el.querySelector('table')).toBe(table);
  });

  it('render() still forces a re-render', () => {
    const el = document.createElement('div');
    const grid = new SPGrid(el, { columns, rows: [{ id: 1, name: 'a' }] });
    const table = el.querySelector('table');
    grid.render();
    expect(el.querySelector('table')).not.toBe(table);
  });

  it('setRows after destroy does not render', () => {
    const el = document.createElement('div');
    const grid = new SPGrid(el, { columns });
    grid.destroy();
    grid.setRows([{ id: 1, name: 'a' }]);
    expect(el.innerHTML).toBe('');
  });

  it('rejects invalid container', () => {
    expect(() => new SPGrid(/** @type {any} */ (null), { columns })).toThrow(TypeError);
  });

  it.each([
    ['undefined', undefined],
    ['a string selector', '#app'],
    ['a plain object', {}],
    ['a number', 0],
  ])('throws TypeError when container is %s', (_name, value) => {
    expect(() => new SPGrid(/** @type {any} */ (value), { columns })).toThrow(TypeError);
  });

  it('setRows replaces the rendered content', () => {
    const el = document.createElement('div');
    const grid = new SPGrid(el, { columns, rows: [{ id: 1, name: 'old' }] });
    grid.setRows([{ id: 2, name: 'new' }]);
    const cells = [...el.querySelectorAll('tbody td')].map((td) => td.textContent);
    expect(cells).toEqual(['2', 'new']);
  });

  it('destroy empties the container', () => {
    const el = document.createElement('div');
    const grid = new SPGrid(el, { columns, rows: [{ id: 1, name: 'a' }] });
    expect(el.children.length).toBeGreaterThan(0);
    grid.destroy();
    expect(el.children).toHaveLength(0);
    expect(el.innerHTML).toBe('');
  });

  it('renders null and undefined cells as empty and 0 as "0"', () => {
    const el = document.createElement('div');
    new SPGrid(el, {
      columns: [{ key: 'a' }, { key: 'b' }, { key: 'c' }, { key: 'missing' }],
      rows: [{ a: null, b: undefined, c: 0 }],
    });
    const cells = [...el.querySelectorAll('tbody td')].map((td) => td.textContent);
    expect(cells).toEqual(['', '', '0', '']);
  });

  it('escapes HTML in cells and headers without creating elements', () => {
    const el = document.createElement('div');
    new SPGrid(el, {
      columns: [{ key: 'x', label: '<b>head</b>' }],
      rows: [{ x: '<img src=x onerror="alert(1)"> & "q" \'s\'' }],
    });
    expect(el.querySelector('img')).toBeNull();
    expect(el.querySelector('b')).toBeNull();
    expect(el.querySelector('th')?.textContent).toBe('<b>head</b>');
    expect(el.querySelector('td')?.textContent).toBe('<img src=x onerror="alert(1)"> & "q" \'s\'');
  });
});
