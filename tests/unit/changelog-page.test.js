import { describe, expect, it } from 'vitest';
import {
  parseChangelog,
  releaseId,
  renderInline,
  renderRelease,
  sectionLabel,
} from '../../examples/changelog.js';

const MD = `# Changelog

Intro text.

## [Unreleased]

## [2.0.1] - 2026-11-05

### Added

- First item with \`code\` and **bold**.
  It wraps onto a second line.
- Second item
  - nested item

### Changed (BREAKING)

- Renamed the thing.

## [1.0.0] - 2026-01-01

### Fixed

- Old fix.
`;

describe('parseChangelog', () => {
  const releases = parseChangelog(MD);

  it('reads each release with its version and date', () => {
    expect(releases.map((r) => [r.version, r.date])).toEqual([
      ['Unreleased', ''],
      ['2.0.1', '2026-11-05'],
      ['1.0.0', '2026-01-01'],
    ]);
  });

  it('reads the sections and joins a wrapped bullet into one item', () => {
    const [added, breaking] = releases[1].sections;
    expect(added.title).toBe('Added');
    expect(added.items).toEqual([
      'First item with `code` and **bold**. It wraps onto a second line.',
      'Second item',
      'nested item',
    ]);
    expect(breaking.title).toBe('Changed (BREAKING)');
    expect(releases[0].sections).toEqual([]);
  });

  it('ignores text before the first release', () => {
    expect(parseChangelog('# Title\n\n- stray\n')).toEqual([]);
  });
});

describe('renderInline', () => {
  it('renders code, bold and http links, and leaves other text alone', () => {
    const box = document.createElement('div');
    box.append(renderInline('a `x < y` b **c** [d](https://example.com/p) e'));
    expect(box.innerHTML).toBe(
      'a <code>x &lt; y</code> b <strong>c</strong> <a href="https://example.com/p">d</a> e',
    );
  });

  it('handles double backticks around code that contains a backtick', () => {
    const box = document.createElement('div');
    box.append(renderInline('use `` n => `${n}` `` here'));
    expect(box.querySelector('code')?.textContent).toBe('n => `${n}`');
  });

  it('never parses HTML or a javascript: link', () => {
    const box = document.createElement('div');
    box.append(renderInline('<img src=x onerror=alert(1)> [bad](javascript:alert(1))'));
    expect(box.querySelector('img')).toBeNull();
    expect(box.querySelector('a')).toBeNull();
    expect(box.textContent).toContain('<img src=x onerror=alert(1)>');
  });
});

describe('release rendering', () => {
  it('labels sections in Thai and keeps unknown titles', () => {
    expect(sectionLabel('Added')).toBe('เพิ่มใหม่');
    expect(sectionLabel('Changed (BREAKING)')).toBe('เปลี่ยนแปลง (BREAKING)');
    expect(sectionLabel('Notes')).toBe('Notes');
  });

  it('makes an anchor id from the version', () => {
    expect(releaseId('2.0.11')).toBe('v2-0-11');
  });

  it('marks the latest release and a breaking section', () => {
    const [, release] = parseChangelog(MD);
    const el = renderRelease(release, { open: true, latest: true });
    expect(el.id).toBe('v2-0-1');
    expect(el.open).toBe(true);
    expect(el.querySelector('summary')?.textContent).toContain('v2.0.1');
    expect(el.querySelector('summary')?.textContent).toContain('ล่าสุด');
    expect(el.querySelector('.release-badge.breaking')).not.toBeNull();
    expect(el.querySelectorAll('li')).toHaveLength(4);
  });
});
