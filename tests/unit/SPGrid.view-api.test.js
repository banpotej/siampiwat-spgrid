import { beforeEach, describe, expect, it } from 'vitest';
import { SPGrid } from '../../src/index.js';

beforeEach(() => localStorage.clear());

const columns = ['a', 'b', 'c'].map((key) => ({ key, label: key.toUpperCase() }));
const rows = [{ a: 1, b: 2, c: 3 }];

/** @param {object} [extra] */
const make = (extra = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new SPGrid(el, { columns, rows, ...extra });
  return { el, grid, root: /** @type {HTMLElement} */ (el.querySelector('.spg-root')) };
};

describe('getViewSettings / setViewSettings', () => {
  it('reports the defaults without any toggle option', () => {
    expect(make().grid.getViewSettings()).toEqual({
      striped: false,
      wrapped: true,
      gridLines: 'default',
      lineStyle: 'default',
      freezeColumns: 0,
    });
  });

  it('reports the options the grid started with', () => {
    const { grid } = make({ striped: true, textWrap: false, gridLines: 'both', freezeColumns: 1 });
    expect(grid.getViewSettings()).toMatchObject({
      striped: true,
      wrapped: false,
      gridLines: 'both',
      freezeColumns: 1,
    });
  });

  it('changes the look from code, with no toggle option', () => {
    const { el, grid, root } = make();
    grid.setViewSettings({
      striped: true,
      wrapped: false,
      gridLines: 'vertical',
      lineStyle: 'solid',
      freezeColumns: 2,
    });
    expect(grid.getViewSettings()).toEqual({
      striped: true,
      wrapped: false,
      gridLines: 'vertical',
      lineStyle: 'solid',
      freezeColumns: 2,
    });
    expect(root.classList.contains('spg-striped')).toBe(true);
    expect(root.classList.contains('spg-nowrap')).toBe(true);
    expect(root.classList.contains('spg-lines-vertical')).toBe(true);
    expect(root.classList.contains('spg-line-solid')).toBe(true);
    expect(el.querySelectorAll('thead th.spg-frozen')).toHaveLength(2);
  });

  it('leaves the settings that are not given as they are', () => {
    const { grid } = make({ striped: true });
    grid.setViewSettings({ lineStyle: 'dotted' });
    expect(grid.getViewSettings()).toMatchObject({ striped: true, lineStyle: 'dotted' });
  });

  it('returns a copy', () => {
    const { grid } = make();
    grid.getViewSettings().striped = true;
    expect(grid.getViewSettings().striped).toBe(false);
  });

  it('saves each setting under its storage key', () => {
    const { grid } = make({
      stripedStorageKey: 's',
      gridLinesStorageKey: 'g',
      freezeColumnsStorageKey: 'f',
    });
    grid.setViewSettings({ striped: true, gridLines: 'none', freezeColumns: 1 });
    expect(localStorage.getItem('spgrid:striped:s')).toBe('true');
    expect(localStorage.getItem('spgrid:gridLines:g')).toBe('"none"');
    expect(localStorage.getItem('spgrid:freezeColumns:f')).toBe('1');
    expect(make({ stripedStorageKey: 's' }).grid.getViewSettings().striped).toBe(true);
  });

  it('rejects a value of the wrong kind and changes nothing', () => {
    const { grid } = make();
    expect(() =>
      grid.setViewSettings({ striped: true, gridLines: /** @type {any} */ ('wavy') }),
    ).toThrow(RangeError);
    expect(() => grid.setViewSettings({ lineStyle: /** @type {any} */ ('x') })).toThrow(RangeError);
    expect(() => grid.setViewSettings({ freezeColumns: -1 })).toThrow(RangeError);
    expect(() => grid.setViewSettings({ freezeColumns: 1.5 })).toThrow(RangeError);
    expect(() => grid.setViewSettings({ wrapped: /** @type {any} */ ('no') })).toThrow(TypeError);
    expect(grid.getViewSettings().striped).toBe(false);
  });

  it('does nothing after destroy()', () => {
    const { grid } = make();
    grid.destroy();
    expect(() => grid.setViewSettings({ striped: true })).not.toThrow();
  });
});
