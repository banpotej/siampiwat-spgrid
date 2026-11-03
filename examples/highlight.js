// Tiny JS highlighter for the example page. Builds DOM nodes with textContent only (never innerHTML),
// one `.line` span per source line so CSS counters can number them.
const TOKEN =
  /(\/\/.*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|\b(import|from|export|const|let|var|function|return|if|else|new|async|await|true|false|null|undefined|of|in|typeof)\b|\b(\d[\d_.]*)\b|([A-Za-z_$][\w$]*)(?=\()/g;
const CLASSES = ['comment', 'string', 'keyword', 'number', 'call'];

/** @param {string} source @param {HTMLElement} target */
export function highlight(source, target) {
  const lines = [];
  let line = document.createElement('span');
  line.className = 'line';
  lines.push(line);

  const push = (text, cls) => {
    text.split('\n').forEach((part, i) => {
      if (i > 0) {
        line = document.createElement('span');
        line.className = 'line';
        lines.push(line);
        lines[lines.length - 2].append('\n');
      }
      if (!part) return;
      if (cls) {
        const span = document.createElement('span');
        span.className = `tok-${cls}`;
        span.textContent = part;
        line.append(span);
      } else {
        line.append(part);
      }
    });
  };

  let last = 0;
  for (const m of source.matchAll(TOKEN)) {
    push(source.slice(last, m.index));
    const group = m.slice(1).findIndex((g) => g !== undefined);
    push(m[0], CLASSES[group]);
    last = m.index + m[0].length;
  }
  push(source.slice(last));
  target.replaceChildren(...lines);
}
