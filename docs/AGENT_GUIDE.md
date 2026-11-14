# SPGrid – guide for AI coding agents

This file is for an agent that **uses** the `spgrid` package inside someone's app (it ships in the package:
`node_modules/@siampiwat/spgrid/docs/AGENT_GUIDE.md`). The full reference is `docs/API.md` (Thai); read it for any option not
listed here. If you are changing the library itself, read the repo's `AGENTS.md` instead.

## What it is

A vanilla JS data table: sorting, search, column filters, pagination, row grouping, column show/hide, resize,
reorder and freeze, row selection with an action bar, Excel export, a Settings modal, a row details modal and a calendar
mode. Zero dependencies, ES modules, plain JS with `.d.ts` types. It renders into one container element and needs the DOM
(browser only).

## Check the version first

This guide describes **2.1.0**. Read `node_modules/@siampiwat/spgrid/package.json` (`version`) before using an option: an older
install does not have it, and an unknown option is silently ignored (or throws). If a feature below is missing, ask for the
upgrade (`npm install @siampiwat/spgrid@latest`, or the `.tgz` the team gave you) instead of building it yourself.

| Feature                                                                                                | Since |
| ------------------------------------------------------------------------------------------------------ | ----- |
| `selectable`, `selectionActions`, `getSelectedRows`, `exportExcel({ selectedOnly })`, row keyboard nav | 2.1.0 |
| `buttonLabels`, `clearFiltersButton`, `advancedFilterStorageKey`                                       | 2.1.0 |
| `calendar.allDay` / `color` / `colors`, `getCalendarView` / `setCalendarView`, `calendarChange`        | 2.1.0 |
| action tone class `spg-action-primary`                                                                 | 2.1.0 |

## Install and import

```sh
npm install @siampiwat/spgrid          # or: npm install ./siampiwat-spgrid-<version>.tgz  (see README.md)
```

```js
import { SPGrid, showDetails, thaiLabels, escapeHtml } from '@siampiwat/spgrid'; // the stylesheet comes with it
```

- `@siampiwat/spgrid/style.css` is the stylesheet alone, `@siampiwat/spgrid/plain` the JS alone (only if you load the CSS yourself).
- No bundler: load `dist/spgrid.js` and `dist/spgrid.css` by URL (`<link>` + `<script type="module">`).
- Do not import it on the server. In Next.js / React create the grid in `useEffect` of a **client component**.

## Minimal grid

```js
const grid = new SPGrid(document.querySelector('#app'), {
  rowKey: 'id',
  columns: [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status', type: 'badge', badges: { open: { tone: 'success' } } },
  ],
  rows, // plain objects
  searchable: true,
  pageSize: 10,
});
// later
grid.setRows(newRows); // replaces the data; keeps sort / filter / page
grid.destroy(); // always, when the element goes away (React unmount, route change)
```

React / Next.js:

```jsx
'use client';
import { useEffect, useRef } from 'react';
import { SPGrid } from '@siampiwat/spgrid';

export function Grid({ columns, rows }) {
  const el = useRef(null);
  const grid = useRef(null);
  useEffect(() => {
    grid.current = new SPGrid(el.current, { columns, rows, searchable: true });
    return () => grid.current.destroy();
  }, []); // create once ...
  useEffect(() => grid.current?.setRows(rows), [rows]); // ... then only push new data
  return <div ref={el} />;
}
```

## Columns

`{ key, label?, sortable?, align?, width?, type?, format?, render?, options?, badges?, actions?, ariaLabel? }`

| Want                    | Use                                                                                                       |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| status pill             | `type: 'badge'`, `badges: { value: { tone: 'success'\|'danger'\|'warning'\|'info'\|'neutral', label? } }` |
| date / number / boolean | `type: 'date'` (Date, ISO string, timestamp), `'number'` (+ `format`), `'boolean'`                        |
| buttons per row         | `actions: [{ name: 'view', label: 'View', icon: 'visibility' }]` (`key` is just an id)                    |
| custom cell HTML        | `render: (value, row) => '…'` – **not escaped**, wrap user data in `escapeHtml()`                         |
| header on two lines     | `label: 'ไทย\nEnglish'`                                                                                   |

Keep raw values in `rows` (Date objects, booleans, numbers). The column `type` formats them; sorting, search and
export use the raw value.

## Reacting to the user

```js
new SPGrid(el, {
  rowKey: 'id',
  columns, rows,
  onAction: ({ action, row }) => { … },          // action button clicked
  onRowActivate: ({ row }) => showDetails(row, columns, { root: el }), // double-click / Enter on a row
});
grid.on('sortChange', ({ key, direction }) => {}); // also filterChange, pageChange, columnsChange, columnOrderChange, groupByChange, refresh; returns unsubscribe
```

`row` is the original object, not a copy. `refreshButton: true` only emits `refresh`: reload your data and call
`setRows()` yourself.

## Options by job

- **Toolbar:** `title`, `description`, `searchable`, `searchColumnSelect`, `searchButton`, `exportButton`, `exportColumnSelect` (pick the fields to export),
  `refreshButton`, `advancedFilter` (multi-condition filter modal), `filterSummary`, `columnPicker` (opens Settings), `resetButton`.
  For a business UI add `buttonLabels: true` with `labels: thaiLabels`, so every toolbar button shows its Thai name, not only a tooltip
  (the toolbar wraps into a search row and a tools row), and `clearFiltersButton` (one button that clears the search and every filter).
- **Selecting rows:** `selectable: true | 'single'` adds a checkbox column (header box = the page; Space on a focused row; arrow keys move
  between rows). Read it with `getSelectedRows()` / `onSelectionChange`; `exportExcel({ selectedOnly: true })` exports just those.
  `selectionActions: [{ name, label, confirm?, primary? }]` + `onSelectionAction({ action, rows })` adds a bar over the table
  ("N selected", the action buttons, Clear selection); `confirm: true` asks first (use it for approve / reject / delete).
  Use `rowKey` so the selection survives `setRows()`. Put a "view details" button in a card with `data-cell-action="view"` and handle
  it in `onAction`; the checkbox only selects.
- **Calendar:** `calendar: { start, end, title, subtitle, allDay: 'field', color: 'field', colors: { value: '#hex' } }` shows the rows as events
  (`viewToggle` switches table / calendar); an `allDay` row goes in the "all day" row; `getCalendarView()` / `setCalendarView({ view, date })`
  and `on('calendarChange')` follow the view and the dates.
- **Paging / sort:** `pageSize`, `pageSizeOptions`, `defaultSort: { key, direction }`, `groupBy: ['col']`.
- **Look:** `striped`, `density: 'compact'`, `gridLines`, `lineStyle`, `textWrap`, `stickyHeader`, `maxHeight`,
  `freezeColumns: n`, `icons`, `labels`.
- **User settings in the Settings modal:** `stripedToggle`, `textWrapToggle`, `gridLinesToggle`, `lineStyleToggle`,
  `groupByToggle`, `freezeColumnsToggle` (each adds its control and turns the Settings button on).
- **Columns the user can change:** `resizableColumns`, `reorderableColumns`, `hiddenColumns`.
- **Remember choices in `localStorage`:** `<thing>StorageKey` – `sortStorageKey`, `pageSizeStorageKey`,
  `columnStorageKey`, `columnWidthStorageKey`, `columnOrderStorageKey`, `groupByStorageKey`, `advancedFilterStorageKey`, `stripedStorageKey`,
  `textWrapStorageKey`, `gridLinesStorageKey`, `lineStyleStorageKey`, `freezeColumnsStorageKey`. Give **each grid
  its own name**; without a key nothing is saved.
- **Thai UI:** `labels: thaiLabels`; any single text can be overridden: `labels: { ...thaiLabels, search: 'หา' }`.

Methods: `setRows`, `getSort/setSort`, `getFilter/setFilter`, `getAdvancedFilter/setAdvancedFilter`, `getPage/setPage`, `getPageSize/setPageSize`,
`getHiddenColumns/setHiddenColumns`, `getColumnOrder/setColumnOrder`, `getGroupBy/setGroupBy`, `setSearchColumn`,
`getSelectedRows/setSelectedRows`, `getCalendarView/setCalendarView`, `exportExcel`, `resetView`, `render`, `destroy`.

## Rules that avoid bugs

1. **Escape user data** in every `render` function and anywhere you build HTML. Plain cells, `title`, `labels`, action
   labels and `showDetails` are escaped for you; `render()` and `icons` are not.
2. **One grid, one container, one `destroy()`.** Creating a second grid on the same element without destroying the
   first duplicates listeners.
3. **Give a `rowKey`** when rows have an id: `data-row-id`, `onAction.rowKey` and stable behaviour depend on it.
4. **Unknown keys throw.** `groupBy`, `setSort`, `setFilter` (unknown column keys) and `gridLines`/`lineStyle`/`freezeColumns`
   (bad values) throw `RangeError`/`TypeError`; do not wrap them in `try` to hide a typo.
5. **Sideways scrolling is yours.** `.spg-table-wrap` clips by default. For wide tables or `freezeColumns` set
   `maxHeight` or give `.spg-table-wrap { overflow-x: auto }`.
6. **Style with tokens, not by editing the CSS.** Set `--spg-*` variables on the container or a parent (see
   "Theming" in `docs/API.md`); dark mode follows `prefers-color-scheme` or `data-theme="dark"`.
7. **Do not build features the grid has.** Search, paging, grouping, export, column picker, row selection and details are
   options. Server-side paging and virtual scrolling are **not** supported (rows are all in memory).
8. **`selectable` adds a checkbox cell in front of every row.** Never find a column by its position (`td:nth-child(n)`,
   `cells[i]`): use `th[data-key]`, the row's own data (`getSelectedRows()`, `onAction`) or `data-row-id`. The checkbox cell
   is not a column: `onAction` / `cellClick` still report the right `key`.
9. **`selectionActions` needs `selectable`** (it throws otherwise), and a unique `name` per action. Put anything that changes
   data behind `confirm: true`. The action reports `rows`, not a count: act on those rows, not on what you remember.
10. **Keep `rowKey` when you use `selectable`**: after `setRows()` the selection is kept for rows that are still there, matched by
    `rowKey` (without one, by object identity: new objects are new rows).
11. **Rows with `onRowActivate` / `selectable` are one Tab stop** (arrow keys move between them). Do not add your own
    `tabindex` or key handlers to the row; a control inside a row (button, link) keeps its own Tab stop.
12. **`buttonLabels` and Thai UI go together**: `labels: thaiLabels`. A label you override in `labels` is also the visible button text.

## Recipes

A business list page (toolbar with Thai button names, selection with actions, row buttons):

```js
const grid = new SPGrid(el, {
  rowKey: 'id',
  columns: [
    {
      key: '_actions',
      label: 'การดำเนินการ',
      actions: [
        {
          name: 'view',
          label: 'ดู',
          title: 'ดูรายละเอียด',
          icon: 'visibility',
          showLabel: true,
          className: 'spg-action-primary',
        },
        {
          name: 'cancel',
          label: 'ยกเลิก',
          icon: 'cancel',
          showLabel: true,
          className: 'spg-action-danger',
          visible: (r) => r.canCancel,
        },
      ],
    },
    { key: 'poNumber', label: 'เลขที่', sortable: true },
    {
      key: 'status',
      label: 'สถานะ',
      type: 'badge',
      badges: { done: { tone: 'success', label: 'เสร็จสิ้น' } },
    },
  ],
  rows,
  labels: thaiLabels,
  searchable: true,
  searchColumnSelect: true,
  searchButton: true,
  buttonLabels: true,
  clearFiltersButton: true,
  advancedFilter: true,
  refreshButton: true,
  exportButton: true,
  columnPicker: true,
  selectable: true,
  selectionActions: [
    { name: 'approve', label: 'อนุมัติ', confirm: true, primary: true },
    { name: 'return', label: 'ส่งกลับ' },
  ],
  onSelectionAction: ({ action, rows }) =>
    doIt(
      action,
      rows.map((r) => r.id),
    ),
  onAction: ({ action, row }) => {
    if (action === 'view') showDetails(row, columns, { root: el, labels: thaiLabels });
  },
  pageSize: 10,
  advancedFilterStorageKey: 'po-list',
  sortStorageKey: 'po-list',
  pageSizeStorageKey: 'po-list',
});
```

Cards instead of cells (a worklist): one column whose `render` builds the card, `showHeader: false`, `groupBy`, and a button inside
the card that opens the details (the checkbox only selects):

```js
{ key: 'code', label: 'รายการ', render: (_v, row) =>
    `<div class="task"><strong>${escapeHtml(row.title)}</strong>` +
    `<button type="button" data-cell-action="view">ดูรายละเอียด</button></div>` }
```

Calendar of the same rows (an all-day event, colour by status): see "Options by job" and `/calendar.html`.

## Row details modal

```js
onRowActivate: ({ row }) =>
  showDetails(row, columns, {
    root: el, // the grid's container, so the modal gets its theme
    title: (r) => r.poNumber,
    groups: [['Document', ['poNumber', 'description']], ['Dates', ['submittedDate']]],
    wide: ['description'],
    labels: thaiLabels,
    locale: 'th-TH',
  }),
```

It returns a function that closes the modal.

## Before you hand the work back

- The grid renders (`new SPGrid` threw no error) and `container.querySelector('table')` has your rows.
- The browser console is clean; a `RangeError` names the bad option.
- `destroy()` is called on teardown and `setRows()` is used for new data (no second `new SPGrid`).
- Every `render` function escapes what it interpolates.
- If you used `selectable`: tick two rows and confirm `getSelectedRows()` returns them; no test or code looks a cell up by position.
- If you used `selectionActions` with `confirm`: the action does not run when the question is cancelled.
- Types: JS files may add `// @ts-check`; `import('@siampiwat/spgrid').Column` and friends are exported typedefs.
