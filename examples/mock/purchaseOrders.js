// Fictional procurement data for examples/index.html. Deterministic: same output every call.
// Shaped like real PO lists: newest first, business days only, mostly completed orders, a few repeat vendors.

const VENDORS = [
  'บริษัท พรีมาออฟฟิศ โซลูชั่นส์ จำกัด',
  'บริษัท เนกซ์เจน ไอทีเซ็นเตอร์ จำกัด (มหาชน)',
  'บริษัท ไพรม์เทค อินดัสเตรียล จำกัด',
  'บริษัท ซันไรส์ ลอจิสติกส์ เซอร์วิส จำกัด',
  'บริษัท เมทัลคราฟต์ ไทย จำกัด',
  'บริษัท กรีนลีฟ แพ็กเกจจิ้ง จำกัด',
  'บริษัท โอเรียนทัล เฟอร์นิเจอร์ แอนด์ ดีไซน์ จำกัด',
  'บริษัท บลูโอเชียน เทเลคอม จำกัด (มหาชน)',
  'บริษัท สมาร์ทไลน์ เอ็นจิเนียริ่ง จำกัด',
  'บริษัท ฟาสต์แทรค เอ็กซ์เพรส จำกัด',
  'ห้างหุ้นส่วนจำกัด วัฒนาการช่างและเครื่องมือ',
  'บริษัท ปทุมการพิมพ์ จำกัด',
];
const PEOPLE = [
  'Nattapong Srisuk',
  'Kanokwan Chaiyasit',
  'Piyawat Boonmee',
  'Supaporn Wongsawat',
  'Thanakrit Jaidee',
  'Ornicha Prasert',
];
const DAY_MS = 86_400_000;
// A fixed "today" (Tue 2026-10-27) keeps the dates, and so any test, stable.
const BASE_DATE = Date.UTC(2026, 9, 27, 12);
const HISTORY_DAYS = 120;

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

/** @param {Date} d @returns {boolean} */
const isWeekend = (d) => d.getUTCDay() === 0 || d.getUTCDay() === 6;

/**
 * @param {number} [count]
 * @returns {{ id: number, rfqNumber: string, poNumber: string, submittedDate: Date, purchasingType: string,
 *   status: string, vendor: string, creator: string, deliveryDate: Date, recipient: string, claimer: string,
 *   cancelBy: string, companyCode: string, deliveryComplete: boolean, creationType: string,
 *   canCancel: boolean }[]}
 */
export function createPurchaseOrders(count = 60) {
  const rand = mulberry32(20261027);
  const pick = (/** @type {string[]} */ list) => list[Math.floor(rand() * list.length)];
  // Squaring the draw favours the head of the list: a few vendors get most of the orders.
  const pickFrequent = (/** @type {string[]} */ list) =>
    list[Math.floor(rand() ** 2 * list.length)];
  const digits = (/** @type {number} */ n) => String(n).padStart(6, '0');
  /** @param {[string, number][]} weighted */
  const pickWeighted = (weighted) => {
    let r = rand() * weighted.reduce((sum, [, w]) => sum + w, 0);
    for (const [value, w] of weighted) if ((r -= w) < 0) return value;
    return weighted[0][0];
  };

  // Recent days are busier: the draw is squared, so most dates fall in the last weeks.
  const dates = Array.from({ length: count }, () => {
    let d = new Date(BASE_DATE - Math.floor(rand() ** 2 * HISTORY_DAYS) * DAY_MS);
    while (isWeekend(d)) d = new Date(d.getTime() - DAY_MS);
    return d;
  }).sort((a, b) => b.getTime() - a.getTime());

  let poSerial = 125423;
  let rfqSerial = 12349;
  return dates.map((submittedDate, i) => {
    // Numbers fall with the date, with the odd gap (documents that were never issued).
    poSerial -= i === 0 ? 0 : 1 + (rand() < 0.2 ? Math.floor(rand() * 4) : 0);
    const hasRfq = rand() >= 0.4;
    if (hasRfq) rfqSerial -= rand() < 0.5 ? 1 : 0;
    const status = pickWeighted([
      ['เสร็จสิ้น', 70],
      ['รออนุมัติ', 12],
      ['ไม่อนุมัติ', 8],
      ['ยกเลิก', 10],
    ]);
    const rfqNumber = hasRfq ? `100/RQ/C${digits(rfqSerial)}` : '';
    const deliveryDate = new Date(submittedDate.getTime() + (7 + Math.floor(rand() * 39)) * DAY_MS);
    const received = status === 'เสร็จสิ้น' && deliveryDate.getTime() <= BASE_DATE && rand() < 0.8;
    const creator = pickFrequent(PEOPLE);
    return {
      id: 158663 - i,
      rfqNumber,
      poNumber: `100/PO/C${digits(poSerial)}`,
      submittedDate,
      purchasingType: pickWeighted([
        ['Expense', 75],
        ['Asset', 25],
      ]),
      status,
      vendor: pickFrequent(VENDORS),
      creator,
      deliveryDate,
      recipient: received ? pick(PEOPLE) : '',
      claimer: status === 'เสร็จสิ้น' && rand() < 0.3 ? pick(PEOPLE) : '',
      cancelBy: status === 'ยกเลิก' ? pick(PEOPLE) : '',
      companyCode: '100',
      deliveryComplete: received,
      creationType: pickWeighted([
        ['จัดซื้อ', 85],
        ['อัตโนมัติ', 15],
      ]),
      canCancel: status === 'เสร็จสิ้น' && rfqNumber === '',
    };
  });
}
