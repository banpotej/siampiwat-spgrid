import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SPGrid } from '../../src/index.js';

// docs/AGENT_GUIDE.md is what other coding agents read to use the library. It must not name an option, event or method that
// does not exist: this reads the names it backticks and checks them against the typedefs and the class.
const guide = readFileSync('docs/AGENT_GUIDE.md', 'utf8');
const sources = [
  'src/types.js',
  ...readdirSync('src')
    .filter((f) => /Types\.js$/.test(f))
    .map((f) => `src/${f}`),
];
const typedefs = [...new Set(sources)].map((file) => readFileSync(file, 'utf8')).join('\n');

/** Names of the `@property`s in the typedefs. The type may hold braces and run over several lines, so it is skipped by matching them. */
/** @param {string} text @returns {Set<string>} */
function propertyNames(text) {
  const flat = text.replace(/\n\s*\*\s?/g, '\n');
  const names = new Set();
  for (const at of flat.matchAll(/@property /g)) {
    let i = at.index + at[0].length;
    if (flat[i] === '{') {
      for (let depth = 0; i < flat.length; i++) {
        if (flat[i] === '{') depth++;
        if (flat[i] === '}' && --depth === 0) break;
      }
      i++;
    }
    const name = /^\s*\[?([A-Za-z_]\w*)/.exec(flat.slice(i));
    if (name) names.add(name[1]);
  }
  return names;
}

/** Event names: the keys of the `GridEvents` typedef. */
/** @param {string} text @returns {Set<string>} */
function eventNames(text) {
  const start = text.indexOf('@typedef {{ sortChange');
  const block = text.slice(start, text.indexOf('}} GridEvents', start));
  return new Set([...block.matchAll(/\b([a-z][A-Za-z]+):/g)].map((m) => m[1]));
}

const known = new Set([
  ...propertyNames(typedefs),
  ...eventNames(typedefs),
  ...Object.getOwnPropertyNames(SPGrid.prototype),
  // words the guide writes in backticks that are values or other exports, not options
  ...[
    'true',
    'false',
    'single',
    'multiple',
    'asc',
    'desc',
    'compact',
    'thaiLabels',
    'showDetails',
    'escapeHtml',
    'localStorage',
  ],
  ...['onAction', 'onRowActivate', 'onSelectionAction', 'onSelectionChange'],
  // placeholders (`allDay: 'field'`, `groupBy: ['col']`, `<thing>StorageKey`) and the key of a plain object (`{ key, direction }`)
  ...['field', 'direction', 'col', 'thing'],
]);

/** The backticked camelCase words of a part of the guide (`a.b` counts as `b`, `a/b` as both). */
/** @param {string} text @returns {Set<string>} */
function words(text) {
  const out = new Set();
  for (const [, code] of text.matchAll(/`([^`\n]+)`/g)) {
    for (const part of code.split(/[\s/,|:{}()[\]=<>'"]+/)) {
      const word = part.split('.').pop() ?? '';
      if (/^[a-z][a-zA-Z]{2,}$/.test(word)) out.add(word);
    }
  }
  return out;
}

/** @param {string} from @param {string} [to] */
const section = (from, to) => {
  const start = guide.indexOf(from);
  expect(start, `"${from}" is missing from the guide`).toBeGreaterThan(-1);
  return guide.slice(start, to ? guide.indexOf(to, start) : undefined);
};

describe('docs/AGENT_GUIDE.md', () => {
  it('lists only methods that SPGrid has', () => {
    const text = section('Methods:', '## Rules');
    const names = [...text.matchAll(/`([A-Za-z/]+)`/g)]
      .flatMap((m) => m[1].split('/'))
      .filter((n) => /^[a-z]/.test(n));
    const bare = new Set(names.map((n) => n.replace(/^(get|set)(?=[A-Z])/, '')));
    const missing = names.filter(
      (n) =>
        !(n in SPGrid.prototype) &&
        ![...Object.getOwnPropertyNames(SPGrid.prototype)].some(
          (m) => m.endsWith(n[0].toUpperCase() + n.slice(1)) || m === n,
        ),
    );
    expect(bare.size).toBeGreaterThan(10);
    expect(missing).toEqual([]);
  });

  it('names only options, events and values that exist (Options by job)', () => {
    const unknown = [...words(section('## Options by job', 'Methods:'))].filter(
      (w) => !known.has(w),
    );
    expect(unknown).toEqual([]);
  });

  it('names only options that exist in the recipes and the examples of the guide', () => {
    const text =
      section('## Minimal grid', '## Options by job') +
      section('## Recipes', '## Row details modal');
    const code = [...text.matchAll(/^\s+([a-z][A-Za-z]+):/gm)].map((m) => m[1]);
    const unknown = [...new Set(code)].filter(
      (w) =>
        !known.has(w) &&
        !['id', 'name', 'status', 'poNumber', 'rows', 'label', 'title'].includes(w),
    );
    expect(unknown).toEqual([]);
  });

  it('says which version it describes and keeps the feature table', () => {
    expect(guide).toMatch(/This guide describes \*\*\d+\.\d+\.\d+\*\*/);
    expect(guide).toContain('## Check the version first');
  });

  it('no longer says row selection is unsupported', () => {
    expect(guide).not.toMatch(/row selection[^.\n]*not supported/i);
  });
});
