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

### Changed

- `setRows()` no longer re-renders when given the same array; `render()` still forces a re-render.
- `setRows()` after `destroy()` no longer renders into the container.
- `sortRows()` compares `Date` by `getTime()`, booleans as `false < true`, and sorts `NaN` last like `null`.
- `destroy()` also makes `render()`, `setSort()` and `on()` listeners inert.
