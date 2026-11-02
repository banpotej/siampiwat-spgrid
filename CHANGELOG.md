# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Row activation: `onRowActivate` (and `on('rowActivate')`, payload `RowActivatePayload`: `{ row, rowKey, originalEvent }`) makes the rows
  activatable: a double-click on a row, or Enter while the row has focus. Each row then gets `tabindex="0"` and `.dg-activatable` (pointer
  cursor, `:focus-visible` ring). Buttons, links and form controls inside a row keep their own behaviour. Without the option rows are
  unchanged.
- Date search column: with `searchColumnSelect`, choosing a `type: 'date'` column as the search column swaps the text box for two date
  boxes (from / to, `.dg-search-range`) that filter at once on the calendar day (both ends inclusive, either optional). The search text
  is `FROM..TO` (`YYYY-MM-DD`), also accepted by `setFilter()`; matching cells are marked whole. New `labels.dateFrom` / `labels.dateTo`,
  `FilterState.range` (set by the grid, usable with `filterRows`).
- Enum search columns: `Column.options` (the values a column can take; a `badge` column's `badges` keys count too) and `labels.allValues`.
  With `searchColumnSelect`, choosing such a column as the search column swaps the text box for a select of its values
  (`.dg-search-value`); picking one filters at once on the whole cell value (case-insensitive, not a substring). Changing between an enum and
  a plain search column clears the search text. The matching cells are marked whole (`td.dg-match`) rather than their text (`mark.dg-mark`). New `FilterState.exact` (set by the grid, usable with `filterRows`).

### Changed

- Date search column: the from / to boxes are borderless, so the range reads as one input group with the select and buttons beside it (square frame of the same height, focus ring on the frame); the calendar buttons stay quiet until used. The enum value select is square and as tall as its neighbours, and the column select keeps the neutral grey tone when a column is chosen.
- **Breaking:** an action button with an `icon` is now icon-only (`dg-action-icononly`): `ActionDef.label` becomes its `aria-label` and
  tooltip (`title`, unless `ActionDef.title` is set) instead of visible text. New `ActionDef.showLabel: true` keeps the text beside the
  icon. Buttons without an `icon` are unchanged.
- **Breaking:** the "Reset view", "Striped rows" and "Wrap text" toolbar buttons are gone. They now live in the settings modal, which
  the toolbar's button (now a `settings` icon, labelled "Settings") opens: `stripedToggle` and `textWrapToggle` add a switch each under a
  "Display" heading (applied with Apply, remembered by `stripedStorageKey` / `textWrapStorageKey` as before), and `resetButton` adds a
  "Reset view" text button to the modal's footer (it closes the modal, asks first as before, then calls `resetView()`). The Settings
  button shows when any of `columnPicker`, `resetButton`, `stripedToggle` or `textWrapToggle` is on; the column list and sort selects
  need `columnPicker`. The `.dg-reset-view`, `.dg-stripe-toggle` and `.dg-wrap-toggle` buttons no longer exist (`.dg-settings-reset` and
  `input[data-flag]` replace them). Defaults of `labels.columns` and `labels.columnSettings` are now "Settings"; new `labels.columnsSection`
  and `labels.displaySection`. New `settings` icon; `view_column`, `stripes` and `wrap_text` are no longer used by the grid.
- The settings modal got a minimal look: plain checkbox list, quiet text buttons in the footer, only Apply filled.
- The `columnPicker` button now opens a modal ("Column settings") with a show/hide checkbox per data column instead of an inline
  panel of checkboxes. Apply commits, Cancel / Esc / backdrop discard. New `labels.columnSettings` and `labels.apply`
  (`thaiLabels` included). The `.dg-columns-panel` element is gone.

### Added

- The column settings modal (`columnPicker`) also sets the sort: a column select and a direction select for `sortable` columns, applied like
  `setSort()` (so `sortStorageKey` remembers it). New `labels.sortBy`, `labels.noSort`, `labels.sortDirection`, `labels.ascending`,
  `labels.descending` (`thaiLabels` included).
- `defaultSort` option (the sort at start, which `resetView()` returns to) and `sortStorageKey` option (the sort is saved in
  `localStorage` as `datagrid:sort:<name>` on every change and restored next time, ahead of `defaultSort`; clearing it is remembered too).
- `columnWidthStorageKey` option (with `resizableColumns`): the column widths are saved in `localStorage` (`datagrid:columnWidths:<name>`)
  when a resize ends and restored the next time the grid is created.
- `reorderableColumns`, `columnOrderStorageKey` and `onColumnOrderChange` options, `getColumnOrder()` / `setColumnOrder(keys)` and a
  `columnOrderChange` event: the user drags a header cell onto another (or presses Alt+Left / Alt+Right on a focused one) to reorder the
  columns, and the order is remembered in `localStorage` (`datagrid:columnOrder:<name>`). `resetView()` restores the original order. New
  pure `normalizeOrder()`, `restoreOrder()`, `moveKey()` and `orderColumns()` in `src/core/columnOrder.js`.
- `resizableColumns` option: drag the right edge of a header cell (or use the arrow keys on its handle) to resize a column. The first
  resize pins every column to a pixel width and fixes the table layout (`dg-fixed`). New `labels.resizeColumn` (function; `thaiLabels`
  included).
- `highlightSearch` option (default true): the search text is marked in the cells (`<mark class="dg-mark">`, only in the search
  column when one is chosen; colour `--dg-mark-bg`). New pure `matchRanges()` in `src/core/highlight.js`.
- `textWrap`, `textWrapToggle` and `textWrapStorageKey` options: cell text wraps by default; a "Wrap text" icon button in the
  input group lets the user turn wrapping off (`.dg-nowrap` on the root) or on, and the choice is remembered in `localStorage`
  (`datagrid:textWrap:<name>`) ahead of `textWrap`. New `wrap_text` icon and `labels.textWrap` (`thaiLabels` included).
- `stripedToggle` and `stripedStorageKey` options: an icon-only "Striped rows" button in the toolbar lets the user turn the zebra rows
  on or off, and the choice is remembered in `localStorage` (`datagrid:striped:<name>`) ahead of `striped`. New
  `stripes` icon and `labels.stripedRows` (`thaiLabels` included).
- `description` option: text under the grid name, in a strip below the toolbar that a chevron button next to the name hides or shows (`labels.toggleDescription`).
- `title` option: the name of the grid, shown at the start (left) edge of the toolbar (`<h2 class="dg-title">`).
- `filterSummary` option: a strip under the toolbar, shown while a filter is active, with the match count ("Found 12
  of 250") and a removable chip per active filter (the search text, with its column when limited to one, and each
  column filter). New `labels.filterSummary` and `labels.removeFilter` (functions; `thaiLabels` included).
- `resetButton` option and `grid.resetView()`: back to the starting view (no search, filter or sort; the initial
  `hiddenColumns` and `pageSize`; page 1). New `restart_alt` icon, `labels.resetView`. The button asks first (a styled built-in modal, `.dg-modal`, with `labels.confirmReset`, `labels.confirmOk` and `labels.cancel`;
  `confirmReset` takes your own dialog, sync or async, or `false` to skip); `resetView()` itself never asks.
- `refreshButton` option, `onRefresh` and `on('refresh')`: a Refresh button that only emits the event; the app reloads
  its data and calls `setRows()`. New `refresh` icon, `labels.refresh`.
- Toolbar buttons Refresh, Reset view and Columns share the new `.dg-tool-btn` class (`--dg-*` theming unchanged).
  `computeView()` (internal) also returns `total`, the rows left after filtering.

- `pageSizeStorageKey` option: remembers the rows per page in `localStorage` (`datagrid:pageSize:<name>`) and restores it
  next time, ahead of `pageSize`. Storage helpers moved to `src/utils/storage.js`.
- Column visibility: `columnPicker` option (a "Columns" button, the last part of the toolbar's input group, that opens a checklist of the data columns),
  `hiddenColumns` (initial), `columnStorageKey` (remember the choice in `localStorage` under `datagrid:columns:<name>`),
  `onColumnsChange` / `on('columnsChange')`, `getHiddenColumns()` and `setHiddenColumns(keys)`. At least one data column
  always stays visible and action columns always show; a hidden column is left out of the global search and
  of the search column select (hiding the column being searched puts the search back on every column), and
  `exportExcel()` exports the same rows the grid shows; sorting by it and exporting its values still work. New `view_column` icon, `labels.columns` (`thaiLabels` included).

- Column types: `Column.type` (`badge`, `date`, `boolean`, `number`) with `format` and `badges`; badges, calendar-icon
  dates, check/cross booleans and aligned numbers, blank values as a muted dash. New `calendar_today` icon, `yes` / `no`
  labels, `--dg-warning` / `--dg-info`. `renderTable()` (internal) now takes `labels` instead of the empty text.

- `exportButton` option: an "Export Excel" button in the toolbar (icon only; `labels.exportExcel` is its aria-label and tooltip).
- `grid.exportExcel({ filename, sheetName })`: downloads the searched, filtered and sorted rows (all pages) as a
  dependency-free `.xlsx` file; exports `ExportOptions` type.

### Changed

- A smaller toolbar (the grid header): inputs and buttons are `2.25em` high (was `2.75em`; new `--dg-control-height`), icons `1.2em`,
  less padding, and the grid name `1.05em`.
- The Columns button turns blue (`data-active`) while any column is hidden.
- The search column select takes the accent tint while a column is chosen (not "All columns"), like a pressed toggle button.
- The Search button, the Export Excel button and the current page of the pager are grey too (neutral tint instead of accent / green /
  accent fill); `--dg-pager-active-bg` / `--dg-pager-active-color` still override the current page.
- Action buttons are grey by default (the `--dg-action-tone` default is now `--dg-neutral`, was `--dg-accent`), so a row of
  them is one calm colour; `dg-action-danger` / `-success` and `--dg-action-tone` still pick a tone.
- Lines inside the table (between rows and, with `bordered`, between cells) are now dashed; the outer frame and the
  header rule stay solid. New `--dg-line-style` (default `dashed`; set `solid` for the previous look).

- Action buttons redesigned as soft pills: `--dg-action-radius` now defaults to `999px` and `--dg-action-padding` to
  `0.3em 0.95em`; semibold label, hover lifts the button with a tone-coloured glow, disabled buttons turn grey, and the
  icon sits tighter. Markup and API unchanged; set `--dg-action-radius: 6px` for the previous corners.

- Action button colours: tonal look (tinted background, tone-coloured border and text) in place of solid accent fills;
  tones via `dg-action-danger` / `dg-action-success` / `dg-action-neutral` classes or `--dg-action-tone`; new
  `--dg-danger`, `--dg-success`, `--dg-neutral`, `--dg-action-hover-bg`. **Breaking for pre-release users:** setting only
  `--dg-action-bg` no longer gives white text; also set `--dg-action-color`.
- Table polish: soft shadow on the table frame, a lighter 2px header rule, extra padding on the first and last
  cell of each row, and a bottom-only shadow under a sticky header.
- Action buttons restyled: larger padding (`--dg-action-padding` default `0.35em 1em`), `6px` radius, medium weight,
  subtle shadow, pressed state, tighter height in compact density, no motion under `prefers-reduced-motion`.

### Added

- Footer restyled: the pager is a soft segmented pill (borderless buttons on a tinted track, solid accent chip for the
  current page), the rows-per-page select matches the filter bar select (tinted, own chevron), airier spacing, tabular
  numbers, no motion under `prefers-reduced-motion`. `--dg-pager-border` and `--dg-pager-bg` now default to transparent.
- Filter bar sits at the end (right) edge of the grid; Search and Clear search buttons are icon-only.
- Filter bar redesigned: tinted column select with a custom chevron, taller parts, a placeholder in the search box (the
  `labels.search` text), the whole group glows while any part has focus, round clear button inside the box.
- Search toolbar is now one input group (`dg-input-group`): column select, search box, Search and Clear search buttons
  joined edge to edge; wraps into rows in grids narrower than 520px. The column select now comes first.
- `searchButton` option: a Search button that filters on click or Enter instead of while typing, plus a Clear search
  button, both icon-only (name and tooltip from `labels.searchButton` / `labels.clear`) (solid accent Search, neutral tonal Clear); `labels.searchButton`; CSS classes `dg-search-submit` and `dg-search-reset`.
- `bordered` option: borders between all cells (adds the `dg-bordered` class on the root).
- Action button icons: `ActionDef.icon` shows a built-in icon before the label; new built-in icons `visibility`, `edit`,
  `delete`, `cancel` and `check` (replaceable via `options.icons`); CSS class `dg-action-icon`.
- Search column select: `searchColumnSelect` option adds a select beside the search box that limits the search to one
  column; `getSearchColumn()` / `setSearchColumn()`; `labels.searchColumn` and `labels.allColumns`; `getFilter()` and
  `filterChange` carry `searchColumn` while a search is active; CSS class `dg-search-column`.
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
