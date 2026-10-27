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
  Not wired into `DataGrid` yet.

### Changed

- `setRows()` no longer re-renders when given the same array; `render()` still forces a re-render.
- `setRows()` after `destroy()` no longer renders into the container.
- `sortRows()` compares `Date` by `getTime()`, booleans as `false < true`, and sorts `NaN` last like `null`.
- Internal refactor: header and search input event handling moved to `src/render/headerEvents.js` and
  `src/render/searchEvents.js`; no behaviour change.
- The search box and table host are rendered once; `render()` now only re-renders the table.
- `destroy()` also cancels a pending search debounce and makes `render()`, `setSort()` and `on()` listeners inert.
