import { SPGrid, escapeHtml, thaiLabels } from '/src/index.js';

// One row per status: its label, the count and the colour of its bar.
const rows = [
  ['รับเข้า', 17, '#4a3d8f'],
  ['รับเข้า (Relife)', 0, '#4a3d8f'],
  ['เก็บเข้า Storage', 13, '#9a8150'],
  ['เบิกออกจาก Storage', 16, '#c4964d'],
  ['อนุมัติเบิก', 0, '#c4964d'],
  ['ส่งคืนเจ้าของ', 2, '#a93226'],
  ['ทำลาย', 1, '#835a28'],
  ['กำจัด (เน่าเสีย)', 0, '#835a28'],
  ['บริจาค', 1, '#4a3d8f'],
  ['ส่งหน่วยงานภายนอก', 1, '#6a5cb0'],
].map(([label, count, color]) => ({ label, count, color }));

const max = Math.max(...rows.map((row) => row.count), 1);

const columns = [
  { key: 'label', label: 'สถานะ', width: '12em' },
  {
    // The bar: a track with a fill whose width is the count's share of the largest count. The width is a
    // number we compute and the colour is escaped, so no data reaches the markup unescaped.
    key: 'bar',
    label: 'แถบ',
    render: (_bar, row) =>
      `<div class="bar-track"><div class="bar-fill" style="--w:${(row.count / max) * 100}%;--c:${escapeHtml(row.color)}"></div></div>`,
  },
  { key: 'count', label: 'รายการ', type: 'number', align: 'right', width: '4em' },
];

const grid = new SPGrid(document.getElementById('grid'), {
  rows,
  columns,
  title: 'สรุป 2 ปี แยกตามสถานะ',
  description: 'นับเป็นรายการ — แยกตามสถานะปัจจุบัน (ย้อนหลัง 2 ปี)',
  showHeader: false,
  gridLines: 'none',
  labels: thaiLabels,
});
window.addEventListener('pagehide', () => grid.destroy(), { once: true });
