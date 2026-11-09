import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SPGrid } from '../../src/index.js';

const read = (/** @type {string} */ path) => readFileSync(path, 'utf8');
const tokens = read('src/styles/tokens.css');
const table = read('src/styles/table.css');
const actions = read('src/styles/actions.css');
const lavender = read('src/styles/themeLavender.css');

/** The --custom declarations of the first rule that follows `selector`, as { '--name': 'value' }. */
const rule = (/** @type {string} */ css, /** @type {string} */ selector) => {
  const start = css.indexOf(selector);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  return Object.fromEntries(
    [...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]),
  );
};

/** @param {string} hex */
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** @param {string} a @param {string} b */
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
/** Last colour stop of `linear-gradient(a, b)`: the bottom of the header, where the text sits. */
const gradientEnd = (/** @type {string} */ value) => /,\s*(#[0-9a-f]{6})\)/i.exec(value)?.[1] ?? '';

describe('--spg-header-bg-image', () => {
  it('is a public + internal token that defaults to none', () => {
    expect(tokens).toContain('--spgi-header-bg-image: var(--spg-header-bg-image, none)');
  });

  it('is applied as background-image on th, next to the unchanged background colour', () => {
    expect(table).toMatch(
      /\.spg-table th \{[^}]*background-color: color-mix\(in srgb, var\(--spgi-header-bg\) 45%, var\(--spgi-bg\)\);\s*background-image: var\(--spgi-header-bg-image\);/s,
    );
  });

  it('leaves the sticky header rule alone', () => {
    expect(table).toMatch(/\.spg-sticky \.spg-table th \{\s*position: sticky;\s*top: 0;/);
  });
});

describe('action classes', () => {
  it('has a zero-specificity warning tone and a solid modifier', () => {
    expect(actions).toMatch(
      /:where\(\.spg-action-warning\) \{\s*--spgi-action-tone: var\(--spgi-warning\);/,
    );
    expect(actions).toMatch(
      /:where\(\.spg-action-solid\) \{[^}]*var\(--spg-action-bg, var\(--spgi-action-tone\)\)/s,
    );
    expect(actions).toContain(':where(.spg-action-solid):hover:not([disabled])');
  });

  it('declares the modifier after the base hover/active rules it overrides', () => {
    expect(actions.indexOf(':where(.spg-action-solid) {')).toBeGreaterThan(
      actions.indexOf(':where(.spg-action):active:not([disabled])'),
    );
  });
});

describe('themeLavender.css', () => {
  const light = rule(lavender, ":is(.spg-theme-lavender, [data-spg-theme='lavender']) {");
  const dark = rule(lavender, "[data-theme='dark'] :is(");

  it('sets the requested light colours', () => {
    expect(light).toMatchObject({
      '--spg-border-color': '#d9d2ee',
      '--spg-input-border': '#c9bfe6',
      '--spg-header-color': '#374151',
      '--spg-stripe-bg': '#f6f3fc',
      '--spg-row-hover-bg': '#efeafa',
      '--spg-sort-hover-bg': '#ebe5f8',
      '--spg-accent': '#7c5cbf',
      '--spg-focus-color': '#7c5cbf',
      '--spg-radius': '4px',
      '--spg-header-bg-image': 'linear-gradient(#fff, #ece7f7)',
    });
  });

  it('only sets public --spg-* variables, never the internal --spgi-* ones', () => {
    expect(lavender).not.toMatch(/--spgi-[\w-]+\s*:/);
  });

  it('scopes every rule under the theme class or attribute', () => {
    const selectors = [...lavender.matchAll(/^([^\s@/*}][^{]*)\{/gm)].map((m) => m[1]);
    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) expect(selector).toMatch(/spg-theme-lavender/);
  });

  it('has a dark set under prefers-color-scheme and [data-theme="dark"], and they agree', () => {
    const media = lavender.slice(lavender.indexOf('@media (prefers-color-scheme: dark)'));
    expect(media).toContain("[data-theme='light']");
    expect(rule(media, ':not([data-theme=')).toEqual(dark);
    expect(Object.keys(dark)).toEqual(
      expect.arrayContaining(Object.keys(light).filter((k) => k !== '--spg-radius')),
    );
  });

  it('meets WCAG AA in light and dark on the themed surfaces', () => {
    /** @type {[string, string, string, number][]} [name, foreground, background, minimum ratio] */
    const pairs = [
      [
        'light header text',
        light['--spg-header-color'],
        gradientEnd(light['--spg-header-bg-image']),
        4.5,
      ],
      ['light muted on stripe', '#4b5563', light['--spg-stripe-bg'], 4.5],
      ['light muted on hover', '#4b5563', light['--spg-row-hover-bg'], 4.5],
      ['light white on accent', '#ffffff', light['--spg-accent'], 4.5],
      ['light white on warning', '#ffffff', light['--spg-warning'], 4.5],
      [
        'dark header text',
        dark['--spg-header-color'],
        gradientEnd(dark['--spg-header-bg-image']),
        4.5,
      ],
      ['dark text on stripe', '#e5e7eb', dark['--spg-stripe-bg'], 4.5],
      ['dark text on hover', '#e5e7eb', dark['--spg-row-hover-bg'], 4.5],
      ['dark muted on hover', '#9ca3af', dark['--spg-row-hover-bg'], 4.5],
      ['dark muted on sort hover', '#9ca3af', dark['--spg-sort-hover-bg'], 4.5],
      ['dark muted on header', '#9ca3af', gradientEnd(dark['--spg-header-bg-image']), 4.5],
      ['dark accent on page', dark['--spg-accent'], dark['--spg-bg'], 4.5],
      ['dark on-accent text', '#0b1220', dark['--spg-accent'], 4.5],
      ['dark focus ring', dark['--spg-focus-color'], dark['--spg-bg'], 3],
      ['dark input border', dark['--spg-input-border'], dark['--spg-bg'], 3],
      ['dark solid warning label', '#0b1220', dark['--spg-warning'], 4.5],
    ];
    for (const [name, fg, bg, min] of pairs) {
      expect(fg, name).toMatch(/^#[0-9a-f]{6}$/i);
      expect(bg, name).toMatch(/^#[0-9a-f]{6}$/i);
      expect(contrast(fg, bg), name).toBeGreaterThanOrEqual(min);
    }
  });
});

describe('wiring', () => {
  it('is imported by spgrid.css after the actions', () => {
    const entry = read('src/spgrid.css');
    expect(entry).toContain("@import './styles/themeLavender.css';");
    expect(entry.indexOf('themeLavender')).toBeGreaterThan(entry.indexOf('actions.css'));
  });

  it('is opt-in: a grid never adds the theme itself', () => {
    const el = document.createElement('div');
    document.body.append(el);
    new SPGrid(el, { columns: [{ key: 'a', label: 'A' }], rows: [{ a: 1 }] });
    expect(el.innerHTML).not.toMatch(/lavender/);
    expect(el.querySelector('[data-spg-theme]')).toBeNull();
  });
});
