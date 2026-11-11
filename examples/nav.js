// Shared by every example page: the list of examples (one place to add a new one) and the top nav.
export const HOME = '/';
export const QUICK_START = '/quick-start.html';
export const FOR_AGENTS = '/for-agents.html';

export const EXAMPLES = [
  {
    href: '/purchase-order.html',
    title: 'รายการใบสั่งซื้อ (Purchase Order)',
    nav: 'ใบสั่งซื้อ',
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
  {
    href: '/view-settings.html',
    title: 'ตั้งค่าหน้าตาจากโค้ด',
    nav: 'ตั้งค่าจากโค้ด',
    description:
      'สั่งค่าใน modal ตั้งค่าจากโค้ด: getViewSettings / setViewSettings ชุดค่าสำเร็จรูป การจัดกลุ่ม และการจำค่าด้วย StorageKey',
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

/** The "ตัวอย่าง" dropdown: one `<details>` listing every example, so the top bar stays short as examples are added. */
function examplesMenu() {
  const menu = document.createElement('details');
  menu.className = 'nav-menu';
  const summary = document.createElement('summary');
  summary.textContent = 'ตัวอย่าง';
  const list = document.createElement('div');
  list.className = 'nav-menu-list';
  list.append(...EXAMPLES.map((example) => link(example.href, example.nav)));
  if (list.querySelector('[aria-current]')) summary.setAttribute('aria-current', 'page');
  menu.append(summary, list);
  // Close on Escape (focus goes back to the button) and on a click anywhere else.
  menu.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !menu.open) return;
    menu.open = false;
    summary.focus();
  });
  document.addEventListener('click', (event) => {
    if (!menu.contains(/** @type {Node} */ (event.target))) menu.open = false;
  });
  return menu;
}

/** Fill `<nav id="site-nav">` with the brand link, the guides and the examples menu. */
export function renderNav() {
  const nav = document.getElementById('site-nav');
  if (!nav) return;
  nav.className = 'site-nav';
  nav.setAttribute('aria-label', 'เมนูตัวอย่าง');
  nav.replaceChildren(
    link(HOME, 'SPGrid', 'brand'),
    link(QUICK_START, 'Quick Start'),
    link(FOR_AGENTS, 'สำหรับ Claude Code'),
    examplesMenu(),
  );
}
