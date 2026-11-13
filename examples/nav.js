// Shared by every example page: the list of examples (one place to add a new one) and the top nav.
// A menu entry is the title of its page (the example titles are the page headings without "ตัวอย่าง:").
export const HOME = '/';
export const QUICK_START = '/quick-start.html';
export const FOR_AGENTS = '/for-agents.html';
export const UPGRADE = '/upgrade.html';
export const CHANGELOG = '/changelog.html';

export const EXAMPLES = [
  {
    href: '/purchase-order.html',
    title: 'รายการใบสั่งซื้อ (Purchase Order)',
    description:
      'ตารางเต็มรูปแบบ: ค้นหา ตัวกรองขั้นสูง เรียงลำดับ จัดกลุ่ม แบ่งหน้า ส่งออก Excel และปุ่มดำเนินการต่อแถว',
  },
  {
    href: '/theme-default.html',
    title: 'ธีมสีเริ่มต้น (Default)',
    description:
      'สีเริ่มต้นของ SPGrid โดยไม่ใส่ class ธีม: หัวตารางสีเทาเรียบ ขอบมน 8px แถวสลับสี เส้นขอบครบทุกเซลล์ และปุ่ม action สีทึบ',
  },
  {
    href: '/theme-gold.html',
    title: 'ธีมสีทอง (Siam Piwat Solid Gold)',
    description:
      'ธีมสีทองประจำแบรนด์ #a28448: หัวตารางไล่เฉดทอง แถวสลับโทนครีม ข้อความบนพื้นทองเป็นสีเข้ม และมีชุดสีโหมดมืด',
  },
  {
    href: '/theme-purple.html',
    title: 'ธีมสีม่วง (Siam Piwat Purple)',
    description:
      'ธีมสีม่วงประจำแบรนด์ #3a2d4b: หัวตารางไล่เฉดม่วงอ่อน แถวสลับโทนม่วงนวล ข้อความบนพื้นม่วงเป็นสีขาว และมีชุดสีโหมดมืด',
  },
  {
    href: '/worklist.html',
    title: 'รายการงาน (Worklist)',
    description:
      'แสดงข้อมูลเป็นรายการ: คอลัมน์เดียวหลายบรรทัดด้วย render หัวกลุ่มพร้อมจำนวน "n งาน" และซ่อนหัวตาราง',
  },
  {
    href: '/recent-receipts.html',
    title: 'รับเข้าล่าสุด (Recent receipts)',
    description:
      'การ์ดรายการสั้น ๆ: ชื่อการ์ดกับจำนวนรายการ (rowCount) ไม่มีหัวตาราง (showHeader: false) เซลล์หลายบรรทัดด้วย render และ badge ชิดขวา',
  },
  {
    href: '/status-summary.html',
    title: 'สรุปตามสถานะ (Status summary)',
    description:
      'การ์ดสรุปเป็นแถบบาร์: ชื่อสถานะ แถบความยาวตามจำนวนที่สร้างด้วย render และตัวเลขชิดขวา ไม่มีหัวตารางและเส้นคั่น',
  },
  {
    href: '/view-settings.html',
    title: 'ตั้งค่าหน้าตาจากโค้ด',
    description:
      'สั่งค่าใน modal ตั้งค่าจากโค้ด: getViewSettings / setViewSettings ชุดค่าสำเร็จรูป การจัดกลุ่ม และการจำค่าด้วย StorageKey',
  },
  {
    href: '/calendar.html',
    title: 'ปฏิทิน (Calendar)',
    description:
      'แสดงแถวเป็นนัดหมายตามเวลา: มุมมองกำหนดการ / วัน / สัปดาห์ทำงาน / สัปดาห์ นัดที่ซ้อนกันแบ่งคอลัมน์ ค้นหาได้ และคลิกนัดเพื่อเปิดรายละเอียด',
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
  list.append(...EXAMPLES.map((example) => link(example.href, example.title)));
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
    link(QUICK_START, 'Quick Start (Next.js)'),
    link(FOR_AGENTS, 'สำหรับ Claude Code'),
    link(UPGRADE, 'คู่มืออัปเดตเวอร์ชัน'),
    link(CHANGELOG, 'ประวัติการเปลี่ยนแปลง'),
    examplesMenu(),
  );
}
