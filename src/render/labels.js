// @ts-check

/** @typedef {import('../types.js').Labels} Labels */

/** @type {Required<Labels>} */
const DEFAULT_LABELS = {
  search: 'Search',
  empty: 'No data',
  pagination: 'Pagination',
  prev: 'Previous',
  next: 'Next',
  first: 'First page',
  last: 'Last page',
  clear: 'Clear search',
  searchButton: 'Search',
  searchColumn: 'Search in',
  allColumns: 'All columns',
  allValues: 'All',
  dateFrom: 'From',
  dateTo: 'To',
  exportExcel: 'Export Excel',
  columns: 'Settings',
  columnSettings: 'Settings',
  columnsSection: 'Columns',
  selectAll: 'Select all',
  clearAll: 'Clear all',
  sortSection: 'Sorting',
  displaySection: 'Display',
  groupSection: 'Grouping',
  groupBy: 'Group by',
  thenBy: 'Then by',
  noGrouping: 'No grouping',
  apply: 'Apply',
  sortBy: 'Sort by',
  noSort: 'No sorting',
  sortDirection: 'Direction',
  ascending: 'Ascending',
  descending: 'Descending',
  refresh: 'Refresh',
  resetView: 'Reset view',
  confirmReset:
    'Reset the view? Search, sorting, hidden columns and rows per page go back to their defaults.',
  toggleDescription: 'Show or hide description',
  stripedRows: 'Striped rows',
  textWrap: 'Wrap text',
  close: 'Close',
  gridLines: 'Grid lines',
  gridLinesDefault: 'Default',
  gridLinesHorizontal: 'Horizontal',
  gridLinesVertical: 'Vertical',
  gridLinesBoth: 'Both',
  gridLinesNone: 'None',
  lineStyle: 'Line style',
  lineStyleDefault: 'Default',
  lineStyleSolid: 'Solid',
  lineStyleDashed: 'Dashed',
  lineStyleDotted: 'Dotted',
  resizeColumn: (name) => `Resize ${name}`,
  confirmOk: 'Reset',
  cancel: 'Cancel',
  removeFilter: (text) => `Remove filter ${text}`,
  filterSummary: (shown, total) => `Found ${shown} of ${total}`,
  yes: 'Yes',
  no: 'No',
  pageSize: 'Rows per page',
  summary: (from, to, total) =>
    total === 0 ? 'Showing 0 of 0' : `Showing ${from}–${to} of ${total}`,
};

/**
 * Thai UI texts; pass as `labels` (e.g. `{ labels: thaiLabels }`).
 *
 * @type {Required<Labels>}
 */
export const thaiLabels = {
  search: 'ค้นหา',
  empty: 'ไม่พบข้อมูล',
  pagination: 'การแบ่งหน้า',
  prev: 'ก่อนหน้า',
  next: 'ถัดไป',
  first: 'หน้าแรก',
  last: 'หน้าสุดท้าย',
  clear: 'ล้างการค้นหา',
  searchButton: 'ค้นหา',
  searchColumn: 'ค้นหาใน',
  allColumns: 'ทุกคอลัมน์',
  allValues: 'ทั้งหมด',
  dateFrom: 'ตั้งแต่',
  dateTo: 'ถึง',
  exportExcel: 'ส่งออก Excel',
  columns: 'ตั้งค่า',
  columnSettings: 'ตั้งค่า',
  columnsSection: 'คอลัมน์',
  selectAll: 'เลือกทั้งหมด',
  clearAll: 'ล้างทั้งหมด',
  sortSection: 'การเรียง',
  displaySection: 'การแสดงผล',
  groupSection: 'การจัดกลุ่ม',
  groupBy: 'จัดกลุ่มตาม',
  thenBy: 'แล้วจัดกลุ่มตาม',
  noGrouping: 'ไม่จัดกลุ่ม',
  apply: 'ตกลง',
  sortBy: 'เรียงตาม',
  noSort: 'ไม่เรียง',
  sortDirection: 'ทิศทาง',
  ascending: 'น้อยไปมาก',
  descending: 'มากไปน้อย',
  refresh: 'โหลดข้อมูลใหม่',
  resetView: 'รีเซ็ตมุมมอง',
  confirmReset:
    'รีเซ็ตมุมมอง? การค้นหา การเรียง คอลัมน์ที่ซ่อน และจำนวนแถวต่อหน้าจะกลับเป็นค่าเริ่มต้น',
  toggleDescription: 'แสดงหรือซ่อนคำอธิบาย',
  stripedRows: 'แถวสลับสี',
  textWrap: 'ตัดข้อความขึ้นบรรทัดใหม่',
  close: 'ปิด',
  gridLines: 'เส้นตาราง',
  gridLinesDefault: 'ค่าเริ่มต้น',
  gridLinesHorizontal: 'แนวนอน',
  gridLinesVertical: 'แนวตั้ง',
  gridLinesBoth: 'ทั้งสองแนว',
  gridLinesNone: 'ไม่แสดง',
  lineStyle: 'ประเภทเส้นตาราง',
  lineStyleDefault: 'ค่าเริ่มต้น',
  lineStyleSolid: 'เส้นทึบ',
  lineStyleDashed: 'เส้นประ',
  lineStyleDotted: 'เส้นจุด',
  resizeColumn: (name) => `ปรับความกว้าง ${name}`,
  confirmOk: 'รีเซ็ต',
  cancel: 'ยกเลิก',
  removeFilter: (text) => `ลบตัวกรอง ${text}`,
  filterSummary: (shown, total) => `พบ ${shown} จาก ${total} รายการ`,
  yes: 'ใช่',
  no: 'ไม่ใช่',
  pageSize: 'จำนวนแถวต่อหน้า',
  summary: (from, to, total) =>
    total === 0 ? 'แสดง 0 จาก 0 รายการ' : `แสดง ${from}–${to} จาก ${total} รายการ`,
};

/**
 * Defaults overlaid with the user's labels; `undefined` values keep the default.
 *
 * @param {Labels} [labels]
 * @returns {Required<Labels>}
 */
export function resolveLabels(labels) {
  const given = Object.entries(labels ?? {}).filter(([, value]) => value !== undefined);
  return { ...DEFAULT_LABELS, ...Object.fromEntries(given) };
}
