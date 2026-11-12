// "Prompt สำหรับ Claude Code" section of an example page: shows the prompt named by the section's data-prompt,
// with a copy button. The text goes in through textContent, never innerHTML.
import { PROMPTS } from '/examples/prompts.js';

const root = document.getElementById('prompt');
const prompt = PROMPTS[root.dataset.prompt] ?? '';
const copy = root.querySelector('button');

root.querySelector('code').textContent = prompt;

copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(prompt);
    copy.textContent = 'คัดลอกแล้ว';
  } catch {
    copy.textContent = 'คัดลอกไม่สำเร็จ';
  }
  setTimeout(() => (copy.textContent = 'คัดลอก'), 1500);
});
