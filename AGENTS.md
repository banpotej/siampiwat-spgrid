# AGENTS.md

Reusable vanilla JS DataGrid. Vite library mode, Vitest (jsdom), Playwright, ESLint, Prettier.
Plain JS with JSDoc types; every file under `src/` starts with `// @ts-check`.

## Commands

- `npm run dev` – dev server, example at `/examples/index.html`
- `npm run build` – library bundle + `.d.ts` into `dist/`
- `npm test` – unit tests; `npm run test:e2e` – Playwright
- `npm run check` – lint + typecheck + unit tests + build (must pass before finishing)

## Conventions

- Zero runtime dependencies. ES modules only.
- Escape all user data with `escapeHtml` before putting it in `innerHTML`.
- Public API is exported from `src/index.js` and documented in `docs/API.md`.
- Shared types live in `src/types.js`.
- Scope is tracked in `docs/ROADMAP.md`; don't build features from later phases.
