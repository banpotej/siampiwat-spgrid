import { SPGrid, escapeHtml, thaiLabels } from '/src/index.js';

// A time today / yesterday, so the example reads "วันนี้ 17:40" / "เมื่อวาน 16:41" whenever it is opened.
const at = (daysAgo, hours, minutes) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const rows = [
  ['OS26-F00126-01', 'สมาร์ทโฟน', 'อิเล็กทรอนิกส์', 1, at(0, 17, 40)],
  ['OS26-F00126-02', 'ร่มพับ', 'ทั่วไป', 1, at(0, 17, 40)],
  ['OS26-F00126-03', 'นาฬิกา', 'มีค่า', 1, at(0, 17, 40)],
  ['OS26-F00125-01', 'กระเป๋าสตางค์หนังสีน้ำตาลเข้ม', 'มีค่า', 1, at(1, 16, 41)],
  ['OS26-F00125-02', 'iPhone สีดำ ใส่เคสใส', 'อิเล็กทรอนิกส์', 1, at(1, 16, 41)],
].map(([code, name, category, qty, receivedAt]) => ({
  code,
  name,
  category,
  qty,
  receivedAt,
  status: 'in',
}));

const clock = new Intl.DateTimeFormat('th-TH', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

// "วันนี้ 17:40" or "เมื่อวาน 16:41"; an older day shows its date.
const when = (date) => {
  const midnight = (d) => new Date(d).setHours(0, 0, 0, 0);
  const days = Math.round((midnight(new Date()) - midnight(date)) / 864e5);
  const day = { 0: 'วันนี้', 1: 'เมื่อวาน' }[days] ?? date.toLocaleDateString('th-TH');
  return `${day} ${clock.format(date)}`;
};

const columns = [
  {
    // One cell per row, built from the whole row. Every piece of data goes through escapeHtml.
    key: 'code',
    label: 'รายการ',
    render: (_code, row) =>
      `<div class="receipt">` +
      `<code class="receipt-code">${escapeHtml(row.code)}</code>` +
      `<strong class="receipt-name">${escapeHtml(row.name)}</strong>` +
      `<span class="receipt-meta">หมวด: ${escapeHtml(row.category)} · ${escapeHtml(row.qty)} ชิ้น</span>` +
      `<span class="receipt-time">${escapeHtml(when(row.receivedAt))}</span>` +
      `</div>`,
  },
  {
    key: 'status',
    label: 'สถานะ',
    type: 'badge',
    align: 'right',
    badges: { in: { tone: 'info', label: 'รับเข้า' } },
  },
];

const grid = new SPGrid(document.getElementById('grid'), {
  rowKey: 'code',
  rows,
  columns,
  title: 'รับเข้าล่าสุด (นับเป็นรายการ)',
  rowCount: true,
  showHeader: false,
  gridLines: 'horizontal',
  labels: thaiLabels,
});
window.addEventListener('pagehide', () => grid.destroy(), { once: true });
