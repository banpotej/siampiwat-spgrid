import { SPGrid } from '/src/index.js';

const rows = [
  {
    id: 1,
    documentType: 'Purchase Order',
    fieldKey: 'po_number',
    attribute: 'Required',
    active: 'Yes',
  },
  {
    id: 2,
    documentType: 'Purchase Order',
    fieldKey: 'vendor_name',
    attribute: 'Required',
    active: 'Yes',
  },
  { id: 3, documentType: 'Invoice', fieldKey: 'invoice_date', attribute: 'Date', active: 'Yes' },
  { id: 4, documentType: 'Invoice', fieldKey: 'tax_id', attribute: 'Optional', active: 'No' },
  { id: 5, documentType: 'Receipt', fieldKey: 'total_amount', attribute: 'Number', active: 'Yes' },
];

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'documentType', label: 'Document Type', sortable: true },
  { key: 'fieldKey', label: 'Field Key', sortable: true },
  { key: 'attribute', label: 'Attribute', sortable: true },
  {
    key: 'active',
    label: 'Active',
    type: 'badge',
    badges: { Yes: { tone: 'success' }, No: { tone: 'neutral' } },
  },
  {
    key: '_actions',
    label: 'Action',
    actions: [
      { name: 'edit', label: 'Edit', className: 'spg-action-warning spg-action-solid' },
      { name: 'delete', label: 'Delete', className: 'spg-action-danger spg-action-solid' },
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
    document.getElementById('log').textContent = `${action}: ${row.fieldKey}`;
  },
});
