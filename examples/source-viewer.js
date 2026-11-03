// "Source code" section of the example page: shows the exact file that builds the grid above.
// Vite's ?raw import keeps the displayed code in sync with what actually runs; the section's
// data-src names the file (relative to /examples/).
import { highlight } from '/examples/highlight.js';

const sources = import.meta.glob('/examples/*.js', { query: '?raw', import: 'default' });

const root = document.getElementById('source');
const code = root.querySelector('code');
const copy = root.querySelector('button');
const name = root.dataset.src;

root.querySelector('.file').textContent = `examples/${name}`;
const source = String(await sources[`/examples/${name}`]());

highlight(source, code); // builds text nodes only: the source is shown, never parsed as HTML

copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(source);
    copy.textContent = 'คัดลอกแล้ว';
  } catch {
    copy.textContent = 'คัดลอกไม่สำเร็จ';
  }
  setTimeout(() => (copy.textContent = 'คัดลอก'), 1500);
});
