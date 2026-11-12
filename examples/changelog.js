// Turns CHANGELOG.md (Keep a Changelog format) into data and DOM for changelog.html.
// The text is only ever put in with textContent, so nothing in the file is parsed as HTML.

/**
 * @typedef {{ title: string, items: string[] }} ChangeSection
 * @typedef {{ version: string, date: string, sections: ChangeSection[] }} Release
 */

/**
 * Split the markdown into releases (`## [x.y.z] - date`), each with its sections (`### Added`) and
 * bullets. A bullet's wrapped lines are joined into one string; nested bullets become their own items.
 * @param {string} markdown
 * @returns {Release[]}
 */
export function parseChangelog(markdown) {
  /** @type {Release[]} */
  const releases = [];
  /** @type {Release | null} */
  let release = null;
  /** @type {ChangeSection | null} */
  let section = null;
  let open = false; // the last line was a bullet, so an indented line continues it
  for (const line of markdown.split(/\r?\n/)) {
    const head = /^## \[([^\]]+)\](?: - (\S+))?/.exec(line);
    if (head) {
      release = { version: head[1], date: head[2] ?? '', sections: [] };
      releases.push(release);
      section = null;
      open = false;
      continue;
    }
    if (!release) continue;
    const title = /^### (.+)/.exec(line);
    if (title) {
      section = { title: title[1].trim(), items: [] };
      release.sections.push(section);
      open = false;
      continue;
    }
    if (!section) continue;
    const bullet = /^\s*- (.*)/.exec(line);
    if (bullet) {
      section.items.push(bullet[1].trim());
      open = true;
    } else if (open && line.trim()) {
      section.items[section.items.length - 1] += ` ${line.trim()}`;
    } else {
      open = false;
    }
  }
  return releases;
}

const INLINE = /(`+)(.+?)\1|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*(.+?)\*\*/g;

/**
 * Inline markdown to DOM: `code`, **bold** and [text](http(s) url); everything else stays plain text.
 * @param {string} text
 * @returns {DocumentFragment}
 */
export function renderInline(text) {
  const fragment = document.createDocumentFragment();
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last) fragment.append(text.slice(last, match.index));
    const [, ticks, code, label, href, bold] = match;
    if (ticks) {
      const el = document.createElement('code');
      el.textContent = code.trim();
      fragment.append(el);
    } else if (href) {
      const a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      fragment.append(a);
    } else {
      const el = document.createElement('strong');
      el.textContent = bold;
      fragment.append(el);
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) fragment.append(text.slice(last));
  return fragment;
}

const SECTION_LABELS = {
  Added: 'เพิ่มใหม่',
  Changed: 'เปลี่ยนแปลง',
  Deprecated: 'เลิกใช้ในอนาคต',
  Removed: 'นำออก',
  Fixed: 'แก้ไข',
  Security: 'ความปลอดภัย',
};

/** "Changed (BREAKING)" -> "เปลี่ยนแปลง (BREAKING)"; an unknown title is kept as it is. @param {string} title */
export function sectionLabel(title) {
  const [word, ...rest] = title.split(' ');
  const label = SECTION_LABELS[/** @type {keyof typeof SECTION_LABELS} */ (word)];
  return label ? [label, ...rest].join(' ') : title;
}

/** @param {string} version `2.0.11` -> `v2-0-11` (an id for the release's anchor) */
export function releaseId(version) {
  return `v${version.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

/**
 * One release as an `<article>`; the newest ones start open, older ones collapsed.
 * @param {Release} release
 * @param {{ open: boolean, latest: boolean }} state
 */
export function renderRelease(release, { open, latest }) {
  const article = document.createElement('details');
  article.className = 'release';
  article.id = releaseId(release.version);
  article.open = open;

  const summary = document.createElement('summary');
  const name = document.createElement('span');
  name.className = 'release-version';
  name.textContent = /^\d/.test(release.version) ? `v${release.version}` : release.version;
  summary.append(name);
  if (release.date) {
    const date = document.createElement('time');
    date.textContent = release.date;
    date.dateTime = release.date;
    summary.append(date);
  }
  if (latest) {
    const badge = document.createElement('span');
    badge.className = 'release-badge';
    badge.textContent = 'ล่าสุด';
    summary.append(badge);
  }
  if (release.sections.some((s) => /BREAKING/i.test(s.title))) {
    const badge = document.createElement('span');
    badge.className = 'release-badge breaking';
    badge.textContent = 'BREAKING';
    summary.append(badge);
  }
  article.append(summary);

  for (const section of release.sections) {
    const h3 = document.createElement('h3');
    h3.textContent = sectionLabel(section.title);
    if (/BREAKING/i.test(section.title)) h3.className = 'breaking';
    const list = document.createElement('ul');
    for (const text of section.items) {
      const li = document.createElement('li');
      li.append(renderInline(text));
      list.append(li);
    }
    article.append(h3, list);
  }
  return article;
}
