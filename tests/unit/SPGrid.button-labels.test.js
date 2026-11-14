import { afterEach, describe, expect, it } from 'vitest';
import { SPGrid, thaiLabels } from '../../src/index.js';

const columns = [{ key: 'name', label: 'Name' }];

/** @param {object} [options] */
const make = (options = {}) => {
  const el = document.createElement('div');
  document.body.append(el);
  const grid = new SPGrid(el, {
    columns,
    rows: [{ name: 'a' }],
    searchable: true,
    searchButton: true,
    refreshButton: true,
    exportButton: true,
    advancedFilter: true,
    columnPicker: true,
    ...options,
  });
  return { el, grid };
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('buttonLabels', () => {
  it('puts spg-btn-labels on the root only when asked', () => {
    expect(
      make({ buttonLabels: true }).el.querySelector('.spg-root.spg-btn-labels'),
    ).not.toBeNull();
    expect(make().el.querySelector('.spg-btn-labels')).toBeNull();
    expect(make({ buttonLabels: false }).el.querySelector('.spg-btn-labels')).toBeNull();
  });

  it('leaves every button named by its aria-label, the text the CSS writes beside the icon', () => {
    const { el } = make({ buttonLabels: true, labels: thaiLabels });
    const names = [
      ...el.querySelectorAll('.spg-tool-btn, .spg-export, .spg-search-submit, .spg-search-reset'),
    ].map((b) => b.getAttribute('aria-label'));
    expect(names).toEqual([
      thaiLabels.searchButton,
      thaiLabels.clear,
      thaiLabels.refresh,
      thaiLabels.advancedFilter,
      thaiLabels.exportExcel,
      thaiLabels.columns,
    ]);
    expect(names.every((name) => name && name.length > 0)).toBe(true);
  });

  it('keeps the label in step when a button renames itself', () => {
    const { el, grid } = make({
      buttonLabels: true,
      groupBy: ['name'],
      groupToggleAllButton: true,
      labels: thaiLabels,
    });
    const button = el.querySelector('.spg-group-all');
    expect(button?.getAttribute('aria-label')).toBe(thaiLabels.collapseAllGroups);
    /** @type {HTMLElement} */ (button).click();
    expect(button?.getAttribute('aria-label')).toBe(thaiLabels.expandAllGroups);
    grid.destroy();
  });
});
