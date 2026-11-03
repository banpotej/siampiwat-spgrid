# DataGrid

Reusable vanilla JS DataGrid. Zero runtime dependencies, ES modules only.

## Install

Requirements: Node.js 22 or newer and a bundler that handles ES modules (Vite, webpack, ...).

```sh
npm install datagrid
```

The package is not published to a registry yet. Until it is, install it from a URL or a file:

```sh
# a .tgz hosted anywhere (GitHub Releases, S3, ...) - made by `npm run build && npm pack`
npm install https://your-host/datagrid-0.0.0.tgz

# a git URL: npm runs the `prepare` script, so the package builds itself on install (git required)
npm install github:banpotej/datagrid
npm install github:banpotej/datagrid#main   # a branch or tag

# a local tarball
npm install                # in this repo
npm run build
npm pack                   # creates datagrid-0.0.0.tgz
npm install ../datagrid/datagrid-0.0.0.tgz   # in your project
```

Import the stylesheet once (`import 'datagrid/style.css'`). The grid touches the DOM, so create it in the browser
only: in React or Next.js do it in `useEffect` of a client component and call `grid.destroy()` on unmount.

### From a URL in the browser (no npm)

`dist/datagrid.js` is a self-contained ES module (no imports, no dependencies), so a page can load it from any URL.
Host `dist/datagrid.js` and `dist/datagrid.css` on a static host or CDN (jsDelivr and unpkg serve npm packages
once this one is published, e.g. `https://cdn.jsdelivr.net/npm/datagrid@0.0.0/dist/datagrid.js`):

```html
<link rel="stylesheet" href="https://your-host/datagrid.css" />
<div id="app"></div>
<script type="module">
  import { DataGrid } from 'https://your-host/datagrid.js';

  new DataGrid(document.getElementById('app'), {
    rowKey: 'id',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
    ],
    rows: [{ id: 1, name: 'Ada' }],
  });
</script>
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

Cell values are HTML-escaped unless a column sets `render` (then you escape). Columns can also be action columns
(`actions`) with an `action` event. See [docs/API.md](docs/API.md) for the full API.

## Commands

- `npm run dev` – dev server, example at `/`
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
