import { SPGrid, showDetails, thaiLabels } from '/src/index.js';
import { createPurchaseOrders } from '/examples/mock/purchaseOrders.js';
import { confirmCancel } from '/examples/dialogs.js';

// Dates stay Date objects and deliveryComplete stays a boolean: the column types format them.
const rows = createPurchaseOrders().map((po) => ({
  ...po,
  rfqNumber: po.rfqNumber || null,
  recipient: po.recipient || null,
  claimer: po.claimer || null,
  cancelBy: po.cancelBy || null,
}));

const columns = [
  {
    key: '_actions',
    ariaLabel: 'การดำเนินการ',
    actions: [
      { name: 'view', label: 'View', icon: 'visibility' },
      {
        name: 'cancel',
        label: 'Cancel',
        icon: 'cancel',
        visible: (r) => r.canCancel,
      },
    ],
  },
  { key: 'rfqNumber', label: 'เลขที่เอกสารขอเสนอราคา', sortable: true },
  { key: 'poNumber', label: 'เลขที่ใบสั่งซื้อ', sortable: true },
  { key: 'description', label: 'รายละเอียด', sortable: true },
  {
    key: 'submittedDate',
    label: 'วันที่จัดส่งเอกสาร',
    type: 'date',
    sortable: true,
  },
  {
    key: 'purchasingType',
    label: 'ประเภทจัดซื้อ',
    type: 'badge',
    badges: { Expense: { tone: 'info' }, Asset: { tone: 'warning' } },
    sortable: true,
  },
  {
    key: 'status',
    label: 'สถานะ',
    type: 'badge',
    badges: {
      เสร็จสิ้น: { tone: 'success', icon: 'check' },
      รออนุมัติ: { tone: 'warning' },
      ไม่อนุมัติ: { tone: 'danger' },
      ยกเลิก: { tone: 'neutral', icon: 'cancel' },
    },
    sortable: true,
  },
  { key: 'vendor', label: 'ชื่อผู้ค้า', sortable: true },
  { key: 'creator', label: 'ผู้สร้างเอกสาร', sortable: true },
  {
    key: 'deliveryDate',
    label: 'วันที่กำหนดส่งสินค้า',
    type: 'date',
    sortable: true,
  },
  { key: 'recipient', label: 'ผู้ตรวจรับ', sortable: true },
  { key: 'claimer', label: 'ผู้เคลมเอกสาร', sortable: true },
  { key: 'cancelBy', label: 'ผู้ยกเลิกเอกสาร', sortable: true },
  { key: 'companyCode', label: 'รหัสบริษัท', sortable: true },
  {
    key: 'deliveryComplete',
    label: 'ตรวจรับเสร็จสิ้น',
    type: 'boolean',
  },
  { key: 'creationType', label: 'การสร้างเอกสาร', sortable: true },
];

const log = document.getElementById('log');

// The details sheet (showDetails is part of the library): the title and the sections of the columns it lists.
const details = {
  root: document.getElementById('grid'),
  labels: thaiLabels,
  locale: 'th-TH',
  title: (row) => row.poNumber,
  wide: ['description'],
  groups: [
    ['เอกสาร', ['rfqNumber', 'description', 'purchasingType', 'creationType', 'companyCode']],
    ['กำหนดการ', ['submittedDate', 'deliveryDate', 'deliveryComplete']],
    ['ผู้เกี่ยวข้อง', ['vendor', 'creator', 'recipient', 'claimer', 'cancelBy']],
  ],
};

const grid = new SPGrid(document.getElementById('grid'), {
  rowKey: 'id',
  // Double-click a row, or Enter on a focused row, shows its details (the same as its eye button).
  onRowActivate: ({ row }) => showDetails(row, columns, details),
  title: 'รายการใบสั่งซื้อ',
  onAction: async ({ action, row }) => {
    if (action === 'view') return showDetails(row, columns, details);
    if (!(await confirmCancel(row))) return;
    log.textContent = `${action} ${row.poNumber}`; // textContent: never parsed as HTML
  },
  columns,
  rows,
  searchable: true,
  exportButton: true,
  exportColumnSelect: true,
  columnPicker: true,
  filterSummary: true,
  resetButton: true,
  refreshButton: true,
  onRefresh: () => grid.setRows([...rows]),
  columnStorageKey: 'purchase-orders',
  searchColumnSelect: true,
  searchButton: true,
  searchDebounce: 50,
  pageSize: 10,
  pageSizeStorageKey: 'purchase-orders',
  defaultSort: { key: 'submittedDate', direction: 'desc' },
  sortStorageKey: 'purchase-orders',
  pageSizeOptions: [5, 10, 15, 20, 25, 30],
  striped: true,
  resizableColumns: true,
  columnWidthStorageKey: 'purchase-orders',
  reorderableColumns: true,
  columnOrderStorageKey: 'purchase-orders',
  stripedToggle: true,
  stripedStorageKey: 'purchase-orders',
  textWrapToggle: true,
  textWrapStorageKey: 'purchase-orders',
  gridLines: 'both',
  gridLinesToggle: true,
  gridLinesStorageKey: 'purchase-orders',
  groupByToggle: true,
  groupByStorageKey: 'purchase-orders',
  lineStyleToggle: true,
  lineStyleStorageKey: 'purchase-orders',
  freezeColumnsToggle: true,
  freezeColumnsStorageKey: 'purchase-orders',
  density: 'compact',
  labels: thaiLabels,
});
window.addEventListener('pagehide', () => grid.destroy(), { once: true });
