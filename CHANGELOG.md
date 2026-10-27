# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Static table rendering via `DataGrid` with `columns` and `rows`.
- `setRows()`, `render()` and `destroy()` methods.
- `escapeHtml()` utility.
- Single-column sorting UI: `sortable` column option, header click / Enter / Space cycles
  asc -> desc -> none, `aria-sort` and `tabindex` on headers, CSS sort indicator
  (`--dg-sort-indicator-color`, `--dg-focus-color`, `--dg-sort-hover-bg`).
- `getSort()`, `setSort()` and `on('sortChange', fn)` methods; `locale` and `onSortChange` options.
- `test:watch` npm script.
- Search box: `searchable`, `searchDebounce`, `labels` and `onFilterChange` options; `getFilter()`,
  `setFilter()` and `on('filterChange', fn)`. Filtering runs before sorting and only searches the keys of
  `columns`. Empty results show a single "No data" row announced via an `aria-live` region.
- CSS variables `--dg-toolbar-gap`, `--dg-input-border`, `--dg-input-radius`, `--dg-empty-color`.
- Internal `filterRows()` (`src/core/filter.js`) and `FilterState` type: case-insensitive,
  accent-safe global search (words ANDed) plus per-column filters; exposed through `setFilter()`
  (there is no per-column filter UI yet).
- Internal `paginate()` and `getPageWindow()` (`src/core/paginate.js`) with `PageState`/`PageResult` types:
  1-based, clamped paging (an empty list still has one page) and a pager window with ellipsis markers.
- Pagination UI: `pageSize`, `pageSizeOptions` and `onPageChange` options; `labels.pagination`, `prev`, `next`,
  `pageSize` and `summary`; `getPage()`, `setPage()`, `getPageSize()`, `setPageSize()` and
  `on('pageChange', fn)`. Pipeline is filter -> sort -> paginate. The pager is a `<nav>` with Prev/Next, page
  buttons (`aria-current="page"`), a "Showing X–Y of Z" summary and an optional rows-per-page select.
  Off by default (all rows, no pager). Searching, filtering or sorting goes back to page 1; `setRows()` keeps
  the page, clamped into range. Focus stays on the pager after a click.
- CSS variables `--dg-pager-gap`, `--dg-pager-border`, `--dg-pager-bg`, `--dg-pager-active-bg`,
  `--dg-pager-active-color`, `--dg-pager-muted-color`, `--dg-pager-disabled-opacity`.
- Internal `computeView()` (`src/core/view.js`, filter -> sort -> paginate), `normalizeSort()` and
  `assertPageSize()`; `examples/basic.html` (3 rows) for the smoke/sort/filter e2e tests.
- Material Symbols icons as inline SVG (`src/render/icons.js`, `NOTICE`; Apache-2.0, no new dependency, no network):
  sort arrows and unsorted hint, First/Prev/Next/Last pager buttons, search and clear icons, empty-state inbox.
  `options.icons` overrides any icon (trusted SVG string); `IconName` type exported.
- Search box clear button (`labels.clear`), `labels.first` / `labels.last` and First/Last page buttons in the pager.
- Look options `striped`, `density` ('compact' | 'comfortable'), `stickyHeader`, `maxHeight` and `column.align`.
- Theming: modern default look, dark mode (`prefers-color-scheme` and `[data-theme="dark"]`), `forced-colors` and
  `prefers-reduced-motion` support, container-query layout (<= 600px) and 44px touch targets. New CSS variables:
  `--dg-bg`, `--dg-color`, `--dg-muted-color`, `--dg-border-color`, `--dg-header-bg`, `--dg-header-color`,
  `--dg-row-hover-bg`, `--dg-stripe-bg`, `--dg-accent`, `--dg-accent-contrast`, `--dg-radius`,
  `--dg-cell-padding-y`, `--dg-cell-padding-x`, `--dg-cell-padding-y-compact`, `--dg-cell-padding-x-compact`,
  `--dg-font-family`, `--dg-font-size`, `--dg-line-height`.
- Visual e2e (`tests/e2e/visual.spec.js`) writes screenshots to `test-results/visual/`; no snapshot assertions yet.
- Example only: `examples/index.html` is now the PO List (mock data from `examples/mock/purchaseOrders.js`); the old four-grid demo moved to `tests/e2e/fixtures/grids.html` for the e2e tests. No `src/` change.
- `thaiLabels` export: a ready-made Thai set of `labels` (`labels: thaiLabels`).

- Action columns (`column.actions`: `{ name, label, className?, title?, visible?, disabled? }`), custom cells
  (`column.render(value, row)`, unescaped HTML: the caller escapes), multi-line headers (`\n` in `label` becomes `<br>`),
  `column.width` / `column.ariaLabel`, `options.rowKey` and `options.onAction`. New events `on('action')` (action
  buttons and `[data-cell-action]` elements) and `on('cellClick')`, both from one delegated click listener that finds the
  row among the rows currently shown. Action columns are never sortable, searched or filtered. Types `ActionDef`,
  `ActionEventPayload`, `CellClickPayload` and `Column` are exported.
- CSS variables `--dg-action-bg`, `--dg-action-color`, `--dg-action-radius`, `--dg-action-padding`.
- `tests/e2e/fixtures/actions.html` and `tests/e2e/actions.spec.js`.

### Changed

- Markup: everything is wrapped in `.dg-root`; header cells hold `<span class="dg-th">` with the label and the sort
  icon (the CSS `::after` sort glyph is gone); Prev/Next are icon buttons named by `aria-label` (no text);
  the empty row holds an icon and the text in `.dg-empty-content`.
- Default look changed (borders, radius, colors, padding); `--dg-input-radius`, `--dg-toolbar-gap`,
  `--dg-focus-color` and `--dg-sort-indicator-color` have new default values.
- CSS is split into `src/styles/*.css`, imported by `src/datagrid.css` (still one `datagrid.css` in `dist/`).
- `NOTICE` is published with the package (`files` in `package.json`).
- `examples/index.html` shows four grids (default, compact + striped, sticky header, dark panel); the pagination
  e2e is scoped to `#grid-default`.
- `setRows()` no longer re-renders when given the same array; `render()` still forces a re-render.
- `setRows()` after `destroy()` no longer renders into the container.
- `sortRows()` compares `Date` by `getTime()`, booleans as `false < true`, and sorts `NaN` last like `null`.
- Internal refactor: header and search input event handling moved to `src/render/headerEvents.js` and
  `src/render/searchEvents.js`; no behaviour change.
- `examples/index.html` now shows 25 rows with search, sorting and paging (`pageSize: 5`).
- The search box, table host and pager host are rendered once; `render()` now only re-renders the table
  and updates the pager's content when it changed.
- `destroy()` also cancels a pending search debounce and makes `render()`, `setSort()` and `on()` listeners inert.
