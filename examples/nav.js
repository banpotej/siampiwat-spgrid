// Shared by every example page: the list of examples (one place to add a new one) and the top nav.
export const HOME = '/';

export const EXAMPLES = [
  {
    href: '/purchase-order.html',
    title: 'รายการใบสั่งซื้อ (Purchase Order)',
    nav: 'Purchase Order',
    description: 'ตารางเต็มรูปแบบ: เรียงลำดับ ค้นหา แบ่งหน้า จัดกลุ่ม และปุ่มดำเนินการต่อแถว',
  },
  {
    href: '/goods-receipt.html',
    title: 'รายการรับสินค้า (Goods Receipt)',
    nav: 'Goods Receipt',
    description: 'ตารางจากข้อมูล GoodsReceipt จริง: badge สถานะ ค่า NULL วันที่ และตัวเลข',
  },
];

/** @param {string} href @param {string} text @param {string} [className] */
function link(href, text, className) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text; // textContent: never parsed as HTML
  if (className) a.className = className;
  if (location.pathname === href) a.setAttribute('aria-current', 'page');
  return a;
}

/** Fill `<nav id="site-nav">` with the brand link and one link per example. */
export function renderNav() {
  const nav = document.getElementById('site-nav');
  if (!nav) return;
  nav.className = 'site-nav';
  nav.setAttribute('aria-label', 'เมนูตัวอย่าง');
  nav.replaceChildren(
    link(HOME, 'Siampiwat DataGrid', 'brand'),
    ...EXAMPLES.map((example) => link(example.href, example.nav)),
  );
}
