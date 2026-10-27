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
