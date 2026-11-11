import { SPGrid, escapeHtml, thaiLabels } from '/src/index.js';

const rows = [
  {
    id: 1,
    code: 'OS26-F00122-03',
    title: 'ร่มพับ สีแดงเลือดหมู ด้ามดำ',
    place: 'ห้อง L&F',
    asked: 'วันนี้ 11:48',
  },
  {
    id: 2,
    code: 'OS26-F00122-02',
    title: 'กระเป๋าเป้สะพายหลัง สีกรมท่า',
    place: 'ห้อง L&F',
    asked: 'วันนี้ 11:48',
  },
  {
    id: 3,
    code: 'OS26-F00122-01',
    title: 'สมาร์ทโฟน สีดำ เคสใส',
    place: 'ห้อง L&F',
    asked: 'วันนี้ 11:47',
  },
  {
    id: 4,
    code: 'OS26-F00118-01',
    title: 'กระเป๋าสตางค์หนังสีน้ำตาล ใบยาว',
    place: 'ห้อง L&F',
    asked: 'เมื่อวาน 14:48',
  },
  {
    id: 5,
    code: 'OS26-F00117-01',
    title: 'สมาร์ทโฟน Samsung Galaxy S24 สีดำ',
    place: 'ห้อง L&F',
    asked: 'เมื่อวาน 14:43',
  },
  {
    id: 6,
    code: 'OS26-F00116-01',
    title: 'โน้ตบุ๊ก 14 นิ้ว สีเทา พร้อมที่ชาร์จ',
    place: 'ห้องเก็บของ L&F',
    asked: 'เมื่อวาน 14:35',
  },
  {
    id: 7,
    code: 'OS26-F00115-01',
    title: 'โทรศัพท์มือถือ สมาร์ทโฟน สีน้ำเงินเข้ม',
    place: 'ห้องเก็บของ L&F',
    asked: 'เมื่อวาน 14:22',
  },
].map((row) => ({ ...row, status: 'pending' }));

const columns = [
  // The group column: its cell is the text of the group header. It is hidden, so it takes no column of its own.
  { key: 'status', label: 'สถานะ', render: () => 'Worklist — รออนุมัติ' },
  {
    // One cell per row, three lines, built from the whole row. Every piece of data goes through escapeHtml.
    key: 'title',
    label: 'งาน',
    render: (_title, row) =>
      `<div class="task">` +
      `<code class="task-code">${escapeHtml(row.code)}</code>` +
      `<strong class="task-title">${escapeHtml(row.title)}</strong>` +
      `<span class="task-meta">สถานที่เก็บ: ${escapeHtml(row.place)}</span>` +
      `<span class="task-meta">วันที่ขอ ${escapeHtml(row.asked)}</span>` +
      `</div>`,
  },
];

new SPGrid(document.getElementById('grid'), {
  rowKey: 'id',
  rows,
  columns,
  groupBy: ['status'],
  hiddenColumns: ['status'],
  gridLines: 'horizontal',
  // The settings modal: the options below add its switches, the storage keys remember each choice.
  stripedToggle: true,
  stripedStorageKey: 'worklist',
  textWrapToggle: true,
  textWrapStorageKey: 'worklist',
  gridLinesToggle: true,
  gridLinesStorageKey: 'worklist',
  lineStyleToggle: true,
  lineStyleStorageKey: 'worklist',
  labels: { ...thaiLabels, groupCount: (count) => `${count} งาน` },
  onRowActivate: ({ row }) => {
    document.getElementById('log').textContent = `เปิดงาน: ${row.code}`;
  },
});
