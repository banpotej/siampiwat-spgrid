// Adds a copy button to each code block under `root`. It copies the block's text, so the live
// npm version spans are included as shown.
export function addCopyButtons(root = document) {
  for (const pre of root.querySelectorAll('pre')) {
    const wrap = document.createElement('div');
    wrap.className = 'code-block';
    pre.replaceWith(wrap);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    button.textContent = 'คัดลอก';
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(pre.textContent ?? '');
        button.textContent = 'คัดลอกแล้ว';
      } catch {
        button.textContent = 'คัดลอกไม่สำเร็จ';
      }
      setTimeout(() => (button.textContent = 'คัดลอก'), 1500);
    });
    wrap.append(pre, button);
  }
}
