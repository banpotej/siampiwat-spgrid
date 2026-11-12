import { SPGrid, escapeHtml, showDetails, thaiLabels } from '/src/index.js';

// "วันนี้ 11:47" / "เมื่อวาน 14:48" as a Date: the calendar view needs a real time (the list shows the text).
const timeOf = (text) => {
  const [day, clock] = text.split(' ');
  const [hours, minutes] = clock.split(':').map(Number);
  const date = new Date();
  date.setDate(date.getDate() - (day === 'วันนี้' ? 0 : 1));
  date.setHours(hours, minutes, 0, 0);
  return date;
};

// One row per item. The document an item belongs to (`doc`, with its floor, zone and receipt time) is a group level.
const item = (id, doc, floor, zone, received, n, category, place, asked, pieces) => ({
  id,
  doc,
  floor,
  zone,
  received,
  code: `${doc}-${n}`,
  category,
  qty: pieces.length,
  place,
  asked,
  askedAt: timeOf(asked),
  // An item has no end time: the calendar gives it an hour, enough for its code, time and category.
  askedEnd: new Date(timeOf(asked).getTime() + 60 * 60000),
  pieces,
  // The pieces as plain text, for search, filter and export.
  piecesText: pieces.map(([name, type]) => `${name} (${type})`).join(', '),
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

// Small icons (Material Symbols paths) for the place and the request time; constants, no user data.
const icon = (path) =>
  `<svg class="task-icon" viewBox="0 -960 960 960" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="${path}"/></svg>`;
const PIN = icon(
  'M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Z',
);
const CLOCK = icon(
  'm612-292 56-56-148-148v-184h-80v216l172 172ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Z',
);

const columns = [
  // The group column: its cells are the text of the document headers (a header shows the cell of its first row).
  // It is hidden, so it takes no column of its own.
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
      // data-cat picks the colour of the card (see worklist.css).
      `<div class="task" data-cat="${escapeHtml(row.category)}">` +
      `<div class="task-head"><code class="task-code">${escapeHtml(row.code)}</code>` +
      `<strong class="task-title" title="หมวด">${escapeHtml(row.category)}</strong>` +
      `<span class="task-qty">${escapeHtml(row.qty)} ชิ้น</span></div>` +
      `<ul class="task-pieces">${row.pieces
        .map(
          ([name, type]) =>
            `<li><span class="task-name">${escapeHtml(name)}</span> <span class="task-type">${escapeHtml(type)}</span></li>`,
        )
        .join('')}</ul>` +
      `<div class="task-meta">` +
      `<span class="task-place" title="สถานที่เก็บ">${PIN}${escapeHtml(row.place)}</span>` +
      `<span class="task-asked" title="วันที่ขอ">${CLOCK}${escapeHtml(row.asked)}</span>` +
      `</div>` +
      `</div>`,
  },
  // Data columns the list does not draw (hidden): the search, the filters, the export and the details sheet use them.
  { key: 'category', label: 'หมวด', sortable: true },
  { key: 'floor', label: 'ชั้น', type: 'number', sortable: true },
  { key: 'zone', label: 'โซน', sortable: true },
  { key: 'received', label: 'รับเมื่อ' },
  { key: 'qty', label: 'จำนวน (ชิ้น)', type: 'number', sortable: true },
  { key: 'place', label: 'สถานที่เก็บ', sortable: true },
  { key: 'asked', label: 'วันที่ขอ' },
  { key: 'piecesText', label: 'รายการชิ้น' },
];

const log = document.getElementById('log');

// The details sheet: double-click an item, or Enter on a focused one.
const details = {
  root: document.getElementById('grid'),
  labels: thaiLabels,
  locale: 'th-TH',
  title: (row) => row.code,
  wide: ['piecesText'],
  groups: [
    ['รายการ', ['category', 'qty', 'piecesText']],
    ['เอกสาร', ['doc', 'floor', 'zone', 'received']],
    ['การเก็บ', ['place', 'asked']],
  ],
};

const grid = new SPGrid(document.getElementById('grid'), {
  rowKey: 'id',
  rows,
  columns,
  // Newest document first: a group column the sort is on follows the sort's direction.
  defaultSort: { key: 'doc', direction: 'desc' },
  groupBy: ['doc'],
  hiddenColumns: [
    'doc',
    'category',
    'floor',
    'zone',
    'received',
    'qty',
    'place',
    'asked',
    'piecesText',
  ],
  gridLines: 'horizontal',
  title: 'Worklist — รออนุมัติ',
  searchable: true,
  searchColumnSelect: true,
  searchButton: true,
  searchDebounce: 50,
  exportButton: true,
  exportColumnSelect: true,
  advancedFilter: true,
  columnPicker: true,
  columnStorageKey: 'worklist',
  filterSummary: true,
  resetButton: true,
  refreshButton: true,
  groupToggleAllButton: true,
  onRefresh: () => grid.setRows([...rows]),
  sortStorageKey: 'worklist',
  groupByToggle: true,
  groupByStorageKey: 'worklist',
  // The toolbar button switches the list to a calendar of the same rows: an item is an event at its request time.
  // The search and the filters follow the switch; paging and the group headers show in the list only.
  calendar: {
    start: 'askedAt',
    end: 'askedEnd',
    title: 'code',
    subtitle: 'category',
    hours: [9, 17],
    views: ['day', 'workWeek', 'week', 'agenda'],
    view: 'day',
  },
  defaultView: 'grid',
  viewToggle: true,
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
    // The count of a document header: its items, right after the text.
    groupCount: (count) => `· ${count} รายการ`,
  },
  onRowActivate: ({ row }) => {
    log.textContent = `เปิดรายการ: ${row.code}`; // textContent: never parsed as HTML
    showDetails(row, columns, details);
  },
});
window.addEventListener('pagehide', () => grid.destroy(), { once: true });
