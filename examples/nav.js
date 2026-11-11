// Shared by every example page: the list of examples (one place to add a new one) and the top nav.
export const HOME = '/';
export const QUICK_START = '/quick-start.html';
export const FOR_AGENTS = '/for-agents.html';

export const EXAMPLES = [
  {
    href: '/purchase-order.html',
    title: 'รายการใบสั่งซื้อ (Purchase Order)',
    nav: 'ตัวอย่าง',
    description:
      'ตารางเต็มรูปแบบ: ค้นหา ตัวกรองขั้นสูง เรียงลำดับ จัดกลุ่ม แบ่งหน้า ส่งออก Excel และปุ่มดำเนินการต่อแถว',
  },
  {
    href: '/theme-lavender.html',
    title: 'ธีมลาเวนเดอร์',
    nav: 'ธีมลาเวนเดอร์',
    description: 'ธีมสีม่วงอ่อน: หัวตารางไล่เฉด แถวสลับสี เส้นขอบครบทุกเซลล์ และปุ่ม action สีทึบ',
  },
  {
    href: '/worklist.html',
    title: 'รายการงาน (Worklist)',
    nav: 'รายการงาน',
    description:
      'แสดงข้อมูลเป็นรายการ: คอลัมน์เดียวหลายบรรทัดด้วย render หัวกลุ่มพร้อมจำนวน "n งาน" และซ่อนหัวตาราง',
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
    link(HOME, 'SPGrid', 'brand'),
    link(QUICK_START, 'Quick Start'),
    link(FOR_AGENTS, 'สำหรับ Claude Code'),
    ...EXAMPLES.map((example) => link(example.href, example.nav)),
  );
}
