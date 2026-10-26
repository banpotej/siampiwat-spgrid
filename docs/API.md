# API

## `new DataGrid(container, options)`

- `container: HTMLElement` – mount point.
- `options.columns: { key: string, label?: string }[]`
- `options.rows?: Record<string, unknown>[]`

Cell values are HTML-escaped.

### Methods

- `setRows(rows)` – replace data and re-render.
- `render()` – re-render.
- `destroy()` – clear the container.

## `escapeHtml(value)`

Escapes `& < > " '`; `null`/`undefined` become `''`.

Import styles with `import 'datagrid/style.css'`.
