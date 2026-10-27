import { describe, expect, it } from 'vitest';
import { computeView } from '../../src/core/view.js';
import { resolveLabels } from '../../src/render/labels.js';

const columns = [{ key: 'id' }, { key: 'name' }];
const rows = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `n${i + 1}`, hidden: 'x' }));
/** @param {object} [overrides] */
const state = (overrides = {}) => ({
  columns,
  rows,
  sort: null,
  filter: null,
  page: 1,
  pageSize: null,
  ...overrides,
});

describe('computeView', () => {
  it('returns every row and no paging while pagination is off', () => {
    const view = computeView(state());
    expect(view.paging).toBeNull();
    expect(view.rows).toEqual(rows);
    expect(view.rows).not.toBe(rows);
  });

  it('filters, then sorts, then paginates', () => {
    const view = computeView(
      state({
        filter: { search: 'n' },
        sort: { key: 'id', direction: 'desc' },
        page: 2,
        pageSize: 4,
      }),
    );
    expect(view.rows.map((r) => r.id)).toEqual([6, 5, 4, 3]);
    expect(view.paging).toMatchObject({ page: 2, pageSize: 4, totalRows: 10, totalPages: 3 });
  });

  it('only searches the keys of columns', () => {
    expect(computeView(state({ filter: { search: 'x' } })).rows).toEqual([]);
  });

  it('clamps the page and keeps an empty result at page 1 of 1', () => {
    expect(computeView(state({ page: 99, pageSize: 4 })).paging?.page).toBe(3);
    const empty = computeView(state({ filter: { search: 'zzz' }, page: 5, pageSize: 4 }));
    expect(empty.rows).toEqual([]);
    expect(empty.paging).toMatchObject({ page: 1, totalRows: 0, totalPages: 1 });
  });

  it('passes the locale to sorting and searching', () => {
    const data = [
      { id: 1, name: 'z' },
      { id: 2, name: 'ä' },
      { id: 3, name: 'a' },
    ];
    const view = computeView(state({ rows: data, sort: { key: 'name', direction: 'asc' } }), {
      locale: 'sv',
    });
    expect(view.rows.map((r) => r.name)).toEqual(['a', 'z', 'ä']);
  });
});

describe('resolveLabels', () => {
  it('provides English defaults', () => {
    const labels = resolveLabels();
    expect(labels).toMatchObject({
      search: 'Search',
      empty: 'No data',
      pagination: 'Pagination',
      prev: 'Previous',
      next: 'Next',
      pageSize: 'Rows per page',
    });
    expect(labels.summary(1, 10, 25)).toBe('Showing 1–10 of 25');
    expect(labels.summary(0, 0, 0)).toBe('Showing 0 of 0');
  });

  it('overlays given labels but keeps defaults for undefined values', () => {
    const labels = resolveLabels({ search: 'ค้นหา', empty: undefined });
    expect(labels.search).toBe('ค้นหา');
    expect(labels.empty).toBe('No data');
  });
});
