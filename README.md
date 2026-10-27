# DataGrid

Reusable vanilla JS DataGrid. Zero runtime dependencies, ES modules only.

## Install

```sh
npm install datagrid
```

## Usage

```js
import { DataGrid } from 'datagrid';
import 'datagrid/style.css';

const grid = new DataGrid(document.querySelector('#app'), {
  columns: [{ key: 'id', label: 'ID' }, { key: 'name' }],
  rows: [{ id: 1, name: 'Ada' }],
});

grid.setRows([{ id: 2, name: 'Grace' }]);
grid.destroy();
```

Cell values are HTML-escaped. See [docs/API.md](docs/API.md) for the full API.

## Commands

- `npm run dev` – dev server, example at `/examples/index.html`
- `npm run build` – library bundle and `.d.ts` into `dist/`
- `npm test` – unit tests
- `npm run test:e2e` – Playwright end-to-end tests
- `npm run check` – lint, typecheck, unit tests and build

## Icons and theming

Icons are inline SVGs from [Material Symbols](https://github.com/google/material-design-icons) (Apache-2.0),
bundled in the library: no icon font, no network requests. Override them with `options.icons`. The grid supports
dark mode (`prefers-color-scheme` or `data-theme="dark"`), `striped`, `density`, `stickyHeader` and CSS
variables (`--dg-*`); see [docs/API.md](docs/API.md#theming). Attribution is in [NOTICE](NOTICE).

See [docs/ROADMAP.md](docs/ROADMAP.md) for scope.
