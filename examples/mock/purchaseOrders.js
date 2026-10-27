// Fictional procurement data for examples/procurement.html. Deterministic: same output every call.

const VENDORS = [
  'บริษัท ตัวอย่างเทรดดิ้ง จำกัด',
  'บริษัท ทดสอบซัพพลาย จำกัด (มหาชน)',
  'บริษัท สมมติอุตสาหกรรมและการค้าระหว่างประเทศ จำกัด',
  'ห้างหุ้นส่วนจำกัด ตัวอย่างภัณฑ์',
  'บริษัท เดโมโลจิสติกส์ แอนด์ เซอร์วิส จำกัด',
  'บริษัท จำลองเทคโนโลยีสารสนเทศ จำกัด',
  'บริษัท นามสมมติวัสดุก่อสร้าง จำกัด (มหาชน)',
  'บริษัท ทดลองออฟฟิศซัพพลาย จำกัด',
  'บริษัท ตัวอย่างวิศวกรรมและบริการ จำกัด',
  'บริษัท สาธิตเอ็นเตอร์ไพรส์ จำกัด',
  'บริษัท แบบฝึกหัดโฮลดิ้ง จำกัด (มหาชน)',
  'บริษัท ศูนย์ทดสอบการจัดจำหน่ายและขนส่ง จำกัด',
];
const CREATORS = ['demo01', 'demo02', 'demo03', 'sample07', 'sample12', 'test099'];
const TYPES = ['Expense', 'Asset'];
const STATUSES = ['เสร็จสิ้น', 'ไม่อนุมัติ', 'รออนุมัติ'];
const DAY_MS = 86_400_000;
// A fixed "today" keeps the dates (and so any test) stable.
const BASE_DATE = Date.UTC(2026, 9, 27, 12);

/** @param {number} seed */
function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * @param {number} [count]
 * @returns {{ id: number, rfqNumber: string, poNumber: string, submittedDate: Date, purchasingType: string,
 *   status: string, vendor: string, creator: string, canCancel: boolean }[]}
 */
export function createPurchaseOrders(count = 60) {
  const rand = mulberry32(20261027);
  const pick = (/** @type {string[]} */ list) => list[Math.floor(rand() * list.length)];
  const digits = (/** @type {number} */ n) => String(n).padStart(6, '0');

  return Array.from({ length: count }, (_, i) => {
    const rfqNumber = rand() < 0.4 ? '' : `100/RQ/C${digits(12000 + Math.floor(rand() * 9000))}`;
    const status = pick(STATUSES);
    return {
      id: i + 1,
      rfqNumber,
      poNumber: `100/PO/C${digits(125423 - i)}`,
      submittedDate: new Date(BASE_DATE - Math.floor(rand() * 60) * DAY_MS),
      purchasingType: pick(TYPES),
      status,
      vendor: pick(VENDORS),
      creator: pick(CREATORS),
      canCancel: status === 'เสร็จสิ้น' && rfqNumber === '',
    };
  });
}
