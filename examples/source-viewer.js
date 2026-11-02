// "Source code" section of the example page: shows the exact file that builds the grid above.
// Vite's ?raw import keeps the displayed code in sync with what actually runs.
import source from '/examples/po-list.js?raw';

const root = document.getElementById('source');
const code = root.querySelector('code');
const copy = root.querySelector('button');

code.textContent = source; // textContent: the source is shown, never parsed as HTML

copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(source);
    copy.textContent = 'คัดลอกแล้ว';
  } catch {
    copy.textContent = 'คัดลอกไม่สำเร็จ';
  }
  setTimeout(() => (copy.textContent = 'คัดลอก'), 1500);
});
