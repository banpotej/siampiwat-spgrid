import { SPGrid, escapeHtml, thaiLabels } from '/src/index.js';

// One row per item. The document an item belongs to (`doc`, with its floor, zone and receipt time) is a group level.
const item = (id, doc, floor, zone, received, n, category, place, asked, pieces) => ({
  id,
  status: 'pending',
  doc,
  floor,
  zone,
  received,
  code: `${doc}-${n}`,
  category,
  qty: pieces.length,
  place,
  asked,
  pieces,
});

const rows = [
  item(
    1,
    'OS26-F00122',
    1,
    'A',
    'วันนี้ 11:45',
    '01',
    'อิเล็กทรอนิกส์',
    'ห้อง L&F',
    'วันนี้ 11:47',
    [['สมาร์ทโฟน สีดำ เคสใส', 'โทรศัพท์มือถือ']],
  ),
  item(2, 'OS26-F00122', 1, 'A', 'วันนี้ 11:45', '02', 'ทั่วไป', 'ห้อง L&F', 'วันนี้ 11:48', [
    ['กระเป๋าเป้สะพายหลัง สีกรมท่า', 'กระเป๋า'],
  ]),
  item(3, 'OS26-F00122', 1, 'A', 'วันนี้ 11:45', '03', 'ทั่วไป', 'ห้อง L&F', 'วันนี้ 11:48', [
    ['ร่มพับ สีแดงเลือดหมู ด้ามดำ', 'ร่ม'],
  ]),
  item(4, 'OS26-F00118', 1, 'A', 'เมื่อวาน 14:47', '01', 'มีค่า', 'ห้อง L&F', 'เมื่อวาน 14:48', [
    ['กระเป๋าสตางค์หนังสีน้ำตาล ใบยาว', 'กระเป๋าสตางค์ (มีเงินสด)'],
  ]),
  item(
    5,
    'OS26-F00117',
    2,
    'B',
    'เมื่อวาน 14:42',
    '01',
    'อิเล็กทรอนิกส์',
    'ห้อง L&F',
    'เมื่อวาน 14:43',
    [['สมาร์ทโฟน Samsung Galaxy S24 สีดำ', 'โทรศัพท์มือถือ']],
  ),
  item(
    6,
    'OS26-F00116',
    3,
    'C',
    'เมื่อวาน 14:34',
    '01',
    'อิเล็กทรอนิกส์',
    'ห้องเก็บของ L&F',
    'เมื่อวาน 14:35',
    [['โน้ตบุ๊ก 14 นิ้ว สีเทา พร้อมที่ชาร์จ', 'โน้ตบุ๊ก']],
  ),
];

const distinct = (list, key) => new Set(list.map((row) => row[key])).size;

const columns = [
  // The group columns: their cells are the text of the group headers (a header shows the cell of its first row).
  // Both are hidden, so they take no column of their own.
  { key: 'status', label: 'สถานะ', render: () => 'Worklist — รออนุมัติ (เอกสาร › รายการ › ชิ้น)' },
  {
    key: 'doc',
    label: 'เอกสาร',
    render: (doc, row) =>
      `<span class="doc-code">${escapeHtml(doc)}</span>` +
      `<span class="doc-meta">ชั้น ${escapeHtml(row.floor)} โซน ${escapeHtml(row.zone)} · รับเมื่อ ${escapeHtml(row.received)}</span>`,
  },
  {
    // One cell per row, built from the whole row. Every piece of data goes through escapeHtml.
    key: 'code',
    label: 'รายการ',
    render: (_code, row) =>
      `<div class="task">` +
      `<div class="task-head"><code class="task-code">${escapeHtml(row.code)}</code>` +
      `<strong class="task-title">หมวด: ${escapeHtml(row.category)}</strong>` +
      `<span class="task-qty">${escapeHtml(row.qty)} ชิ้น</span></div>` +
      `<span class="task-meta">สถานที่เก็บ: ${escapeHtml(row.place)} · วันที่ขอ ${escapeHtml(row.asked)}</span>` +
      `<ul class="task-pieces">${row.pieces
        .map(
          ([name, type]) =>
            `<li>${escapeHtml(name)} <span class="task-type">(${escapeHtml(type)})</span></li>`,
        )
        .join('')}</ul>` +
      `</div>`,
  },
];

new SPGrid(document.getElementById('grid'), {
  rowKey: 'id',
  rows,
  columns,
  // Newest document first: a group column the sort is on follows the sort's direction.
  defaultSort: { key: 'doc', direction: 'desc' },
  groupBy: ['status', 'doc'],
  hiddenColumns: ['status', 'doc'],
  gridLines: 'horizontal',
  searchable: true,
  filterSummary: true,
  pageSize: 5,
  pageSizeOptions: [5, 10, 20],
  pageSizeStorageKey: 'worklist',
  // The settings modal: the options below add its switches, the storage keys remember each choice.
  stripedToggle: true,
  stripedStorageKey: 'worklist',
  textWrapToggle: true,
  textWrapStorageKey: 'worklist',
  gridLinesToggle: true,
  gridLinesStorageKey: 'worklist',
  lineStyleToggle: true,
  lineStyleStorageKey: 'worklist',
  labels: {
    ...thaiLabels,
    // The count is worded per level: documents and items for the outer band, items for a document.
    groupCount: (count, { level, rows }) =>
      level === 0 ? `${distinct(rows, 'doc')} เอกสาร · ${count} รายการ` : `· ${count} รายการ`,
  },
  onRowActivate: ({ row }) => {
    document.getElementById('log').textContent = `เปิดรายการ: ${row.code}`;
  },
});
