# SPGrid – guide for AI coding agents

This file is for an agent that **uses** the `spgrid` package inside someone's app (it ships in the package:
`node_modules/@siampiwat/spgrid/docs/AGENT_GUIDE.md`). The full reference is `docs/API.md` (Thai); read it for any option not
listed here. If you are changing the library itself, read the repo's `AGENTS.md` instead.

## What it is

A vanilla JS data table: sorting, search, column filters, pagination, row grouping, column show/hide, resize,
reorder and freeze, Excel export, a Settings modal and a row details modal. Zero dependencies, ES modules, plain JS
with `.d.ts` types. It renders into one container element and needs the DOM (browser only).

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
  `refreshButton`, `filterSummary`, `columnPicker` (opens Settings), `resetButton`.
- **Paging / sort:** `pageSize`, `pageSizeOptions`, `defaultSort: { key, direction }`, `groupBy: ['col']`.
- **Look:** `striped`, `density: 'compact'`, `gridLines`, `lineStyle`, `textWrap`, `stickyHeader`, `maxHeight`,
  `freezeColumns: n`, `icons`, `labels`.
- **User settings in the Settings modal:** `stripedToggle`, `textWrapToggle`, `gridLinesToggle`, `lineStyleToggle`,
  `groupByToggle`, `freezeColumnsToggle` (each adds its control and turns the Settings button on).
- **Columns the user can change:** `resizableColumns`, `reorderableColumns`, `hiddenColumns`.
- **Remember choices in `localStorage`:** `<thing>StorageKey` – `sortStorageKey`, `pageSizeStorageKey`,
  `columnStorageKey`, `columnWidthStorageKey`, `columnOrderStorageKey`, `groupByStorageKey`, `stripedStorageKey`,
  `textWrapStorageKey`, `gridLinesStorageKey`, `lineStyleStorageKey`, `freezeColumnsStorageKey`. Give **each grid
  its own name**; without a key nothing is saved.
- **Thai UI:** `labels: thaiLabels`; any single text can be overridden: `labels: { ...thaiLabels, search: 'หา' }`.

Methods: `setRows`, `getSort/setSort`, `getFilter/setFilter`, `getPage/setPage`, `getPageSize/setPageSize`,
`getHiddenColumns/setHiddenColumns`, `getColumnOrder/setColumnOrder`, `getGroupBy/setGroupBy`, `setSearchColumn`,
`exportExcel`, `resetView`, `render`, `destroy`.

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
7. **Do not build features the grid has.** Search, paging, grouping, export, column picker and details are options.
   Server-side paging / virtual scrolling / row selection are **not** supported (rows are all in memory).

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
- Types: JS files may add `// @ts-check`; `import('@siampiwat/spgrid').Column` and friends are exported typedefs.
