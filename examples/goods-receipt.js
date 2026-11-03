import { DataGrid, thaiLabels } from '/src/index.js';
import { createGoodsReceipts } from '/examples/mock/goodsReceipts.js';
import { showDetails } from '/examples/dialogs.js';

// Dates stay Date objects (or null for drafts): the column types format them.
const rows = createGoodsReceipts();

const columns = [
  {
    key: '_actions',
    ariaLabel: 'การดำเนินการ',
    actions: [{ name: 'view', label: 'View', icon: 'visibility' }],
  },
  { key: 'grNumber', label: 'เลขที่ GR', sortable: true },
  { key: 'materialDoc', label: 'Material Doc', sortable: true },
  {
    key: 'status',
    label: 'สถานะ',
    type: 'badge',
    badges: {
      ร่าง: { tone: 'neutral' },
      'รออนุมัติ GR': { tone: 'warning' },
      กำลังประมวลผล: { tone: 'info' },
      เสร็จสิ้น: { tone: 'success', icon: 'check' },
      ยกเลิก: { tone: 'neutral', icon: 'cancel' },
      'ยกเลิก GR': { tone: 'neutral', icon: 'cancel' },
    },
    sortable: true,
  },
  {
    key: 'documentStatus',
    label: 'Document Status',
    type: 'badge',
    badges: {
      Draft: { tone: 'neutral' },
      'In Progress': { tone: 'warning' },
      Processing: { tone: 'info' },
      Complete: { tone: 'success' },
      Cancel: { tone: 'danger' },
    },
    sortable: true,
  },
  { key: 'orderNum', label: 'Order Num', type: 'number', sortable: true },
  { key: 'submittedDate', label: 'วันที่ส่งเอกสาร', type: 'date', sortable: true },
  { key: 'endDate', label: 'วันที่สิ้นสุด', type: 'date', sortable: true },
];

// The details sheet: a draft has no GR number yet, so its title falls back to the table id.
const details = {
  title: (row) => row.grNumber ?? `#${row.id}`,
  groups: [
    ['เอกสาร', ['materialDoc', 'orderNum', 'documentStatus']],
    ['กำหนดการ', ['submittedDate', 'endDate']],
  ],
};

const grid = new DataGrid(document.getElementById('grid'), {
  rowKey: 'id',
  title: 'รายการรับสินค้า (Goods Receipt)',
  columns,
  rows,
  // Double-click a row, or Enter on a focused row, shows its details (the same as its eye button).
  onRowActivate: ({ row }) => showDetails(row, columns, details),
  onAction: ({ row }) => showDetails(row, columns, details),
  searchable: true,
  searchColumnSelect: true,
  exportButton: true,
  columnPicker: true,
  columnStorageKey: 'goods-receipts',
  filterSummary: true,
  resetButton: true,
  pageSize: 10,
  pageSizeOptions: [5, 10, 20, 50],
  pageSizeStorageKey: 'goods-receipts',
  sortStorageKey: 'goods-receipts',
  striped: true,
  gridLines: 'both',
  density: 'compact',
  labels: thaiLabels,
});
window.addEventListener('pagehide', () => grid.destroy(), { once: true });
