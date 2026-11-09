import { SPGrid } from '/src/index.js';

const rows = [
  { id: 1, name: 'สมชาย ใจดี', department: 'บัญชี', position: 'หัวหน้าแผนก', active: 'ใช้งาน' },
  { id: 2, name: 'สมหญิง รักเรียน', department: 'บัญชี', position: 'นักบัญชี', active: 'ใช้งาน' },
  {
    id: 3,
    name: 'วิชัย มั่นคง',
    department: 'จัดซื้อ',
    position: 'เจ้าหน้าที่จัดซื้อ',
    active: 'ใช้งาน',
  },
  {
    id: 4,
    name: 'ปรีชา สุขสันต์',
    department: 'คลังสินค้า',
    position: 'พนักงานคลัง',
    active: 'ปิดใช้งาน',
  },
  {
    id: 5,
    name: 'นภา แสงทอง',
    department: 'ทรัพยากรบุคคล',
    position: 'เจ้าหน้าที่ HR',
    active: 'ใช้งาน',
  },
];

const columns = [
  { key: 'id', label: 'รหัส', sortable: true },
  { key: 'name', label: 'ชื่อ-นามสกุล', sortable: true },
  { key: 'department', label: 'แผนก', sortable: true },
  { key: 'position', label: 'ตำแหน่ง', sortable: true },
  {
    key: 'active',
    label: 'สถานะ',
    type: 'badge',
    badges: { ใช้งาน: { tone: 'success' }, ปิดใช้งาน: { tone: 'neutral' } },
  },
  {
    key: '_actions',
    label: 'การดำเนินการ',
    actions: [
      { name: 'edit', label: 'แก้ไข', className: 'spg-action-warning spg-action-solid' },
      { name: 'delete', label: 'ลบ', className: 'spg-action-danger spg-action-solid' },
    ],
  },
];

// The theme is a class on the element that holds the grid; nothing else in the options changes.
const grid = document.getElementById('grid');
grid.classList.add('spg-theme-lavender');

new SPGrid(grid, {
  rowKey: 'id',
  rows,
  columns,
  striped: true,
  gridLines: 'both',
  onAction: ({ action, row }) => {
    document.getElementById('log').textContent = `${action}: ${row.name}`;
  },
});
