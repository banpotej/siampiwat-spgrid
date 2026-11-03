# DataGrid

Reusable vanilla JS DataGrid. Zero runtime dependencies, ES modules only.

## Install

Requirements: Node.js 22 or newer and a bundler that handles ES modules (Vite, webpack, ...).

```sh
npm install @siampiwat/datagrid
```

The package is not published to a registry yet. Until it is, install it from a URL or a file:

```sh
# the .tgz attached to the GitHub Release (a private repo needs a token) - made by `npm run pack:release`
npm install https://github.com/banpotej/siampiwat-datagrid/releases/download/v1.0.1/siampiwat-datagrid-1.0.1.tgz

# a git URL: npm runs the `prepare` script, so the package builds itself on install (git required)
npm install github:banpotej/siampiwat-datagrid
npm install github:banpotej/siampiwat-datagrid#main   # a branch or tag

# a local tarball
npm install                # in this repo
npm run build
npm pack                   # creates siampiwat-datagrid-1.0.1.tgz
npm install ../siampiwat-datagrid/siampiwat-datagrid-1.0.1.tgz   # in your project
```

`import { DataGrid } from '@siampiwat/datagrid'` brings the stylesheet in too (through your bundler); `@siampiwat/datagrid/style.css` is still exported, and
`@siampiwat/datagrid/plain` is the JS alone. The grid touches the DOM, so create it in the browser
only: in React or Next.js do it in `useEffect` of a client component and call `grid.destroy()` on unmount.

### Release files (.tgz and .zip)

`npm run pack:release` (PowerShell; runs `npm run check` first, or call `.\pack.ps1 -SkipCheck`) writes three files to `release\`:

- `siampiwat-datagrid-<version>.tgz` – the npm package: `npm install .\release\siampiwat-datagrid-<version>.tgz`
- `siampiwat-datagrid-<version>.zip` – the same package unzipped, for people without npm: use `dist\datagrid.js` and `dist\datagrid.css`
- `SHA256SUMS.txt` – checksums of both

### For AI coding agents

[docs/AGENT_GUIDE.md](docs/AGENT_GUIDE.md) tells an agent how to use the package correctly (setup, React / Next.js, columns, options,
escaping rules, mistakes to avoid). It ships in the package: `node_modules/@siampiwat/datagrid/docs/AGENT_GUIDE.md`, or `@siampiwat/datagrid/agent-guide`.
Point your agent at it from `AGENTS.md` / `CLAUDE.md`.

### From a URL in the browser (no npm)

`dist/datagrid.js` is a self-contained ES module (no imports, no dependencies), so a page can load it from any URL.
Once the package is on npm, jsDelivr and unpkg serve it (pin the version, not `@latest`); or host `dist/datagrid.js` and
`dist/datagrid.css` yourself on any static host:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@siampiwat/datagrid@1.0.1/dist/datagrid.css" />
<div id="app"></div>
<script type="module">
  import { DataGrid } from 'https://cdn.jsdelivr.net/npm/@siampiwat/datagrid@1.0.1/dist/datagrid.js';

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
import { DataGrid } from '@siampiwat/datagrid'; // the stylesheet comes with it

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
