import { SPGrid, showDetails, thaiLabels } from '/src/index.js';

// Lost & found: each document received at the counter (`รับเข้า`) is an event at its receipt time. Items are kept 30
// days, so each day also gets one `ย้าย Stock` event for the documents whose 30 days end that day.
const DOCS = [
  [
    'OS26-F00125',
    'ชั้น 1 โซน A',
    '2026-11-11T15:10',
    'รับเข้า',
    [
      'กระเป๋าสตางค์หนังสีน้ำตาลเข้ม (กระเป๋าสตางค์ มีเงินสด)',
      'iPhone สีดำ ใส่เคสใส (โทรศัพท์มือถือ)',
      'ร่มพับสีน้ำเงินกรมท่า (ร่ม)',
    ],
  ],
  [
    'OS26-F00124',
    'ชั้น 1 โซน A',
    '2026-11-11T14:20',
    'รับเข้า',
    ['สมาร์ทโฟน สีดำ เคสใส (โทรศัพท์มือถือ)'],
  ],
  [
    'OS26-F00123',
    'ชั้น 2 โซน B',
    '2026-11-11T13:05',
    'รับเข้า',
    [
      'กระเป๋าสตางค์หนังสีน้ำตาล ทรงสั้น (กระเป๋าสตางค์ มีเงินสด)',
      'แจ็คเก็ตกันหนาว สีกรมท่า ไซส์ L (เสื้อผ้า)',
      'สมาร์ทวอทช์ สายสีดำ หน้าปัดกลม (นาฬิกา)',
    ],
  ],
  [
    'OS26-F00122',
    'ชั้น 1 โซน A',
    '2026-11-11T11:45',
    'เบิกออกจาก Storage',
    [
      'สมาร์ทโฟน สีดำ เคสใส (โทรศัพท์มือถือ)',
      'กระเป๋าเป้สะพายหลัง สีกรมท่า (กระเป๋า)',
      'ร่มพับ สีแดงเลือดหมู ด้ามดำ (ร่ม)',
    ],
  ],
  [
    'OS26-F00121',
    'ชั้น 2 โซน B',
    '2026-11-11T10:30',
    'รับเข้า',
    ['กระเป๋าสตางค์หนังสีน้ำตาลเข้ม ใบยาว (กระเป๋าสตางค์ มีเงินสด)'],
  ],
  [
    'OS26-F00120',
    'ชั้น 2 โซน B',
    '2026-11-10T16:40',
    'รับเข้า',
    ['กระเป๋าสตางค์หนังสีน้ำตาล ยี่ห้อ Coach ใบสั้น (กระเป๋าสตางค์ มีเงินสด)'],
  ],
  [
    'OS26-F00118',
    'ชั้น 1 โซน A',
    '2026-11-10T14:47',
    'รับเข้า',
    ['กระเป๋าสตางค์หนังสีน้ำตาล ใบยาว (กระเป๋าสตางค์ มีเงินสด)'],
  ],
  [
    'OS26-F00117',
    'ชั้น 2 โซน B',
    '2026-11-10T14:42',
    'รับเข้า',
    ['สมาร์ทโฟน Samsung Galaxy S24 สีดำ (โทรศัพท์มือถือ)'],
  ],
];

const minutes = (date, n) => new Date(date.getTime() + n * 60000);

const received = DOCS.map(([code, place, at, status, items], i) => {
  const start = new Date(at);
  return {
    id: i + 1,
    kind: 'รับเข้า',
    title: `${code} · ${items.length} รายการ`,
    place: `${place} · ห้อง L&F`,
    status,
    code,
    start,
    end: minutes(start, 30),
    itemsText: items.join(', '),
  };
});

// Documents whose 30 days end on the same day share one `ย้าย Stock` event at 09:00.
const dueDays = new Map();
for (const doc of received) {
  const due = new Date(doc.start);
  due.setDate(due.getDate() + 30);
  due.setHours(9, 0, 0, 0);
  const key = due.getTime();
  dueDays.set(key, [...(dueDays.get(key) ?? []), doc]);
}
const moves = [...dueDays].map(([time, docs], i) => ({
  id: received.length + i + 1,
  kind: 'ย้าย Stock',
  title: `ย้าย Stock · ${docs.length} เอกสาร`,
  place: 'ครบกำหนด 30 วัน',
  status: 'รอย้าย',
  code: docs.map((d) => d.code).join(', '),
  start: new Date(time),
  end: minutes(new Date(time), 30),
  itemsText: docs.map((d) => d.itemsText).join(', '),
}));

const columns = [
  { key: 'code', label: 'รหัส' },
  { key: 'kind', label: 'ประเภท' },
  { key: 'place', label: 'สถานที่' },
  { key: 'status', label: 'สถานะ' },
  {
    key: 'start',
    label: 'เวลา',
    type: 'date',
    format: { dateStyle: 'medium', timeStyle: 'short' },
  },
  { key: 'itemsText', label: 'รายการของ' },
];
const log = document.getElementById('log');
const container = document.getElementById('grid');

const grid = new SPGrid(container, {
  rowKey: 'id',
  columns,
  rows: [...received, ...moves],
  locale: 'th',
  labels: thaiLabels,
  searchable: true,
  searchColumnSelect: true,
  filterSummary: true,
  // The whole calendar: which row fields hold the times, and what to show on an event. It opens on the week of the
  // data (a fixed date); leave `date` out to open on today.
  calendar: {
    start: 'start',
    end: 'end',
    title: 'title',
    subtitle: 'place',
    date: '2026-11-11',
    hours: [9, 17],
  },
  // A click on an event (or Enter on it) reports its row.
  onRowActivate: ({ row }) => {
    log.textContent = `เปิดนัดหมาย: ${row.title}`; // textContent: never parsed as HTML
    showDetails(row, columns, {
      root: container,
      title: (r) => r.title,
      labels: thaiLabels,
      locale: 'th',
      wide: ['itemsText'],
    });
  },
});
window.addEventListener('pagehide', () => grid.destroy(), { once: true });
