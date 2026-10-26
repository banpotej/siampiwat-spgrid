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

See [docs/ROADMAP.md](docs/ROADMAP.md) for scope.
