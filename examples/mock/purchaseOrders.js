// Fictional procurement data for purchase-order.html. Deterministic: same output every call.
// Shaped like real PO lists: newest first, business days only, mostly completed orders, a few repeat vendors.

const VENDORS = [
  'บริษัท ลานนาเพรสเซ็นเตอร์ จำกัด',
  'บริษัท ดิจิตัลเวฟ ซิสเต็มส์ จำกัด (มหาชน)',
  'บริษัท คริสตัลคลีน เซอร์วิส จำกัด',
  'บริษัท เอเวอร์กรีน แลนด์สเคป จำกัด',
  'บริษัท ทองสุขการไฟฟ้า จำกัด',
  'บริษัท ไอซ์ฟรอสต์ คูลลิ่ง จำกัด',
  'บริษัท วินด์มิลล์ ซีเคียวริตี้ จำกัด',
  'บริษัท เมโทรไซน์ แอนด์ ดิสเพลย์ จำกัด',
  'บริษัท ซิลเวอร์เลน ทรานสปอร์ต จำกัด (มหาชน)',
  'บริษัท สายรุ้งยูนิฟอร์ม จำกัด',
  'ห้างหุ้นส่วนจำกัด ศรีนครวัสดุก่อสร้าง',
  'บริษัท ควอลิตี้ลิฟต์ เอ็นจิเนียริ่ง จำกัด',
];
// What each vendor plausibly sells, split by purchasing type, so a PO's description matches its vendor.
/** @type {Record<string, { Expense: string[], Asset: string[] }>} */
const CATALOG = {
  [VENDORS[0]]: {
    Expense: [
      'งานพิมพ์ป้ายโปรโมชันและโปสเตอร์ในศูนย์การค้า',
      'บัตรสะสมแต้มสมาชิก PVC',
      'ถุงกระดาษพิมพ์โลโก้',
    ],
    Asset: ['เครื่องพิมพ์ดิจิทัลขนาดใหญ่ Epson SureColor', 'เครื่องตัดกระดาษไฮดรอลิก'],
  },
  [VENDORS[1]]: {
    Expense: [
      'ค่าต่ออายุลิขสิทธิ์ Adobe Creative Cloud',
      'ค่าบริการคลาวด์โฮสติ้งรายปี',
      'แบตเตอรี่สำรองและสายชาร์จ',
    ],
    Asset: [
      'เครื่องคอมพิวเตอร์ตั้งโต๊ะ Lenovo ThinkCentre M90',
      'แท็บเล็ต iPad สำหรับพนักงานหน้าร้าน',
      'เครื่องสแกนบาร์โค้ดไร้สาย',
    ],
  },
  [VENDORS[2]]: {
    Expense: [
      'ค่าบริการทำความสะอาดพื้นที่ส่วนกลางรายเดือน',
      'น้ำยาล้างพื้นและน้ำยาฆ่าเชื้อ',
      'ค่ากำจัดแมลงและสัตว์พาหะ',
    ],
    Asset: ['เครื่องขัดพื้นแบบนั่งขับ', 'เครื่องดูดฝุ่นอุตสาหกรรม'],
  },
  [VENDORS[3]]: {
    Expense: [
      'ค่าดูแลสวนและตัดแต่งต้นไม้ประจำเดือน',
      'ปุ๋ยและดินปลูกสำหรับสวนหน้าอาคาร',
      'ไม้ดอกประดับตามเทศกาล',
    ],
    Asset: ['ระบบน้ำหยดอัตโนมัติสำหรับสวนดาดฟ้า'],
  },
  [VENDORS[4]]: {
    Expense: [
      'หลอดไฟ LED 18 วัตต์',
      'ค่าตรวจสอบตู้ไฟฟ้าและสายดินประจำปี',
      'เบรกเกอร์และอุปกรณ์ป้องกันไฟรั่ว',
    ],
    Asset: ['หม้อแปลงไฟฟ้า 500 kVA', 'ชุดตู้ควบคุมไฟฟ้า MDB'],
  },
  [VENDORS[5]]: {
    Expense: ['ค่าล้างและบำรุงรักษาเครื่องปรับอากาศ', 'น้ำยาแอร์ R32', 'ค่าซ่อมพัดลมคอยล์เย็น'],
    Asset: ['เครื่องทำน้ำเย็น Chiller 200 ตัน', 'เครื่องปรับอากาศแบบแยกส่วน 24,000 BTU'],
  },
  [VENDORS[6]]: {
    Expense: [
      'ค่าบริการรักษาความปลอดภัยรายเดือน',
      'ค่าซ่อมบำรุงกล้องวงจรปิด',
      'วิทยุสื่อสารและอุปกรณ์เสริม',
    ],
    Asset: ['ชุดกล้องวงจรปิด IP 32 ช่อง', 'เครื่องตรวจจับโลหะแบบประตู'],
  },
  [VENDORS[7]]: {
    Expense: [
      'งานติดตั้งและเปลี่ยนป้ายร้านค้า',
      'สติกเกอร์ตกแต่งกระจกตามเทศกาล',
      'ค่าซ่อมไฟป้ายโฆษณา',
    ],
    Asset: ['จอ LED โฆษณากลางห้าง 55 นิ้ว', 'ตู้ไฟป้ายอะคริลิกขนาดใหญ่'],
  },
  [VENDORS[8]]: {
    Expense: [
      'ค่าขนส่งสินค้าระหว่างสาขา รอบเดือน',
      'ค่าบริการรถห้องเย็น',
      'ค่าขนส่งเอกสารด่วนระหว่างสาขา',
    ],
    Asset: ['รถตู้ขนส่งสินค้าขนาดกลาง'],
  },
  [VENDORS[9]]: {
    Expense: [
      'ชุดยูนิฟอร์มพนักงานต้อนรับ',
      'ค่าตัดเย็บชุดพนักงานใหม่',
      'เสื้อกันฝนและรองเท้านิรภัย',
    ],
    Asset: ['เครื่องปักผ้าอุตสาหกรรม 6 หัว'],
  },
  [VENDORS[10]]: {
    Expense: [
      'ปูนซีเมนต์และทรายสำหรับงานซ่อมแซม',
      'สีทาอาคารและอุปกรณ์ทาสี',
      'กระเบื้องปูพื้นทดแทน',
    ],
    Asset: ['นั่งร้านเหล็กมาตรฐาน ชุดใหญ่', 'เครื่องผสมปูนแบบเคลื่อนที่'],
  },
  [VENDORS[11]]: {
    Expense: ['ค่าบำรุงรักษาลิฟต์ตามรอบ', 'ค่าตรวจสอบบันไดเลื่อนประจำปี', 'อะไหล่ประตูลิฟต์'],
    Asset: ['ลิฟต์โดยสาร 1,000 กก.', 'ลิฟต์ขนสินค้า 2,000 กก.'],
  },
};
const PEOPLE = [
  'วรเมธ อินทรวงศ์',
  'พิมพ์ลดา เกษมสันต์',
  'ชัยณรงค์ ทองคำ',
  'รัตนาวดี สุวรรณชาติ',
  'เจษฎา พงศ์พิพัฒน์',
  'นภัสสร มณีรัตน์',
];
const DAY_MS = 86_400_000;
// A fixed "today" (Wed 2026-11-04) keeps the dates, and so any test, stable.
const BASE_DATE = Date.UTC(2026, 10, 4, 12);
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
 * @returns {{ id: number, rfqNumber: string, poNumber: string, description: string, submittedDate: Date,
 *   purchasingType: string, status: string, vendor: string, creator: string, deliveryDate: Date, recipient: string, claimer: string,
 *   cancelBy: string, companyCode: string, deliveryComplete: boolean, creationType: string,
 *   canCancel: boolean }[]}
 */
export function createPurchaseOrders(count = 60) {
  const rand = mulberry32(20261104);
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

  let poSerial = 318706;
  let rfqSerial = 27418;
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
    const rfqNumber = hasRfq ? `700/RQ/C${digits(rfqSerial)}` : '';
    const deliveryDate = new Date(submittedDate.getTime() + (7 + Math.floor(rand() * 39)) * DAY_MS);
    const received = status === 'เสร็จสิ้น' && deliveryDate.getTime() <= BASE_DATE && rand() < 0.8;
    const creator = pickFrequent(PEOPLE);
    const purchasingType = pickWeighted([
      ['Expense', 75],
      ['Asset', 25],
    ]);
    const vendor = pickFrequent(VENDORS);
    const items = CATALOG[vendor][/** @type {'Expense' | 'Asset'} */ (purchasingType)];
    return {
      id: 204815 - i,
      rfqNumber: rfqNumber,
      poNumber: `PO26-${digits(poSerial)}`,
      submittedDate,
      description: pick(items),
      purchasingType,
      status,
      vendor: vendor,
      creator: creator,
      deliveryDate,
      recipient: received ? pick(PEOPLE) : '',
      claimer: status === 'เสร็จสิ้น' && rand() < 0.3 ? pick(PEOPLE) : '',
      cancelBy: status === 'ยกเลิก' ? pick(PEOPLE) : '',
      companyCode: '700',
      deliveryComplete: received,
      creationType: pickWeighted([
        ['จัดซื้อ', 85],
        ['อัตโนมัติ', 15],
      ]),
      canCancel: status === 'เสร็จสิ้น' && rfqNumber === '',
    };
  });
}
