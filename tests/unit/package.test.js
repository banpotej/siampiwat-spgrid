import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as api from '../../src/index.js';

const read = (/** @type {string} */ path) => readFileSync(path, 'utf8');
const pkg = JSON.parse(read('package.json'));

describe('package contents', () => {
  it('ships the docs for people and for AI agents', () => {
    expect(pkg.files).toEqual(
      expect.arrayContaining(['dist', 'docs/API.md', 'docs/AGENT_GUIDE.md']),
    );
    expect(pkg.exports['./agent-guide']).toBe('./docs/AGENT_GUIDE.md');
  });

  it('has a release script that makes the .tgz and the .zip as separate files', () => {
    expect(pkg.scripts['pack:release']).toContain('pack.ps1');
    const script = read('pack.ps1');
    expect(script).toContain('siampiwat-datagrid-$version.tgz');
    expect(script).toContain('siampiwat-datagrid-$version.zip');
    expect(read('.gitignore')).toContain('release/');
  });
});

describe('the agent guide', () => {
  const guide = read('docs/AGENT_GUIDE.md');

  it('names every public export', () => {
    for (const name of Object.keys(api)) expect(guide, name).toContain(name);
  });

  it('names the options and methods an agent is told to use', () => {
    for (const word of [
      'rowKey',
      'setRows',
      'destroy',
      'freezeColumns',
      'onRowActivate',
      'StorageKey',
    ]) {
      expect(guide, word).toContain(word);
    }
  });

  it('is linked from the README', () => {
    expect(read('README.md')).toContain('docs/AGENT_GUIDE.md');
  });
});
