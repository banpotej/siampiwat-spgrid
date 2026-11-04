import { describe, expect, it } from 'vitest';
import { maskNumber, maskPerson, maskVendor } from '../../examples/mock/mask.js';
import { createGoodsReceipts } from '../../examples/mock/goodsReceipts.js';
import { createPurchaseOrders } from '../../examples/mock/purchaseOrders.js';

describe('mask helpers', () => {
  it('keeps the first letter of each word of a person', () => {
    expect(maskPerson('Nattapong Srisuk')).toBe('N**** S****');
    expect(maskPerson('')).toBe('');
  });

  it('keeps the legal form and two letters of a vendor', () => {
    expect(maskVendor('บริษัท พรีมาออฟฟิศ โซลูชั่นส์ จำกัด')).toBe('บริษัท พรี**** จำกัด');
    expect(maskVendor('บริษัท เนกซ์เจน ไอทีเซ็นเตอร์ จำกัด (มหาชน)')).toBe(
      'บริษัท เน**** จำกัด (มหาชน)',
    );
    expect(maskVendor('ห้างหุ้นส่วนจำกัด วัฒนาการช่างและเครื่องมือ')).toBe(
      'ห้างหุ้นส่วนจำกัด วัฒ****',
    );
  });

  it('keeps the last 4 digits of a document number', () => {
    expect(maskNumber('100/PO/C125423')).toBe('100/PO/C**5423');
    expect(maskNumber('5000000362')).toBe('******0362');
    expect(maskNumber('1234')).toBe('1234');
    expect(maskNumber(null)).toBeNull();
    expect(maskNumber('')).toBe('');
  });
});

describe('masked example data', () => {
  it('never shows a whole name, vendor or document number in the purchase orders', () => {
    for (const r of createPurchaseOrders()) {
      for (const name of [r.creator, r.recipient, r.claimer, r.cancelBy]) {
        if (name) expect(name).toMatch(/^(\S\*{4})( \S\*{4})*$/);
      }
      expect(r.vendor).toContain('****');
      expect(r.poNumber).toContain('**');
      if (r.rfqNumber) expect(r.rfqNumber).toContain('**');
    }
  });

  it('keeps vendors distinguishable', () => {
    const rows = createPurchaseOrders();
    const masked = new Set(rows.map((r) => r.vendor));
    expect(masked.size).toBeGreaterThan(5);
  });

  it('masks the GR number and the material document, leaving null as null', () => {
    const rows = createGoodsReceipts();
    for (const r of rows) {
      if (r.grNumber) expect(r.grNumber).toMatch(/^\d{3}\/GR\/C\*{2}\d{4}$/);
      if (r.materialDoc) expect(r.materialDoc).toMatch(/^\*{6}\d{4}$/);
    }
    expect(rows.some((r) => r.grNumber === null)).toBe(true);
    expect(rows.some((r) => r.materialDoc === null)).toBe(true);
  });
});
