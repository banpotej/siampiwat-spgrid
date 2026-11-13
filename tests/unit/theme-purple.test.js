import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (/** @type {string} */ path) => readFileSync(path, 'utf8');
const purple = read('src/styles/themePurple.css');

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

describe('themePurple.css', () => {
  const light = rule(purple, ":is(.spg-theme-purple, [data-spg-theme='purple']) {");
  const dark = rule(purple, "[data-theme='dark'] :is(");

  it('uses the brand purple #3a2d4b as the accent, with white text on it', () => {
    expect(light['--spg-accent']).toBe('#3a2d4b');
    expect(light['--spg-focus-color']).toBe('#3a2d4b');
    expect(light['--spg-accent-contrast']).toBe('#ffffff');
  });

  it('only sets public --spg-* variables, never the internal --spgi-* ones', () => {
    expect(purple).not.toMatch(/--spgi-[\w-]+\s*:/);
  });

  it('scopes every rule under the theme class or attribute', () => {
    const selectors = [...purple.matchAll(/^([^\s@/*}][^{]*)\{/gm)].map((m) => m[1]);
    expect(selectors.length).toBeGreaterThan(0);
    for (const selector of selectors) expect(selector).toMatch(/spg-theme-purple/);
  });

  it('has a dark set under prefers-color-scheme and [data-theme="dark"], and they agree', () => {
    const media = purple.slice(purple.indexOf('@media (prefers-color-scheme: dark)'));
    expect(media).toContain("[data-theme='light']");
    expect(rule(media, ':not([data-theme=')).toEqual(dark);
  });

  it('meets WCAG AA on the themed surfaces', () => {
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
      ['light text on accent', light['--spg-accent-contrast'], light['--spg-accent'], 4.5],
      ['light focus ring', light['--spg-focus-color'], '#ffffff', 3],
      ['light input border', light['--spg-input-border'], '#ffffff', 1.5],
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
      ['dark text on accent', dark['--spg-accent-contrast'], dark['--spg-accent'], 4.5],
      ['dark focus ring', dark['--spg-focus-color'], dark['--spg-bg'], 3],
      ['dark input border', dark['--spg-input-border'], dark['--spg-bg'], 3],
    ];
    for (const [name, fg, bg, min] of pairs) {
      expect(fg, name).toMatch(/^#[0-9a-f]{6}$/i);
      expect(bg, name).toMatch(/^#[0-9a-f]{6}$/i);
      expect(contrast(fg, bg), name).toBeGreaterThanOrEqual(min);
    }
  });

  it('is imported by spgrid.css', () => {
    expect(read('src/spgrid.css')).toContain("@import './styles/themePurple.css';");
  });
});
