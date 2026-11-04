import { describe, expect, it } from 'vitest';
import { createGoodsReceipts } from '../../examples/mock/goodsReceipts.js';
import { createPurchaseOrders } from '../../examples/mock/purchaseOrders.js';

describe('createPurchaseOrders', () => {
  it('is deterministic', () => {
    expect(createPurchaseOrders()).toEqual(createPurchaseOrders());
  });

  it('honors count (default 60)', () => {
    expect(createPurchaseOrders()).toHaveLength(60);
    expect(createPurchaseOrders(7)).toHaveLength(7);
    expect(createPurchaseOrders(0)).toEqual([]);
  });

  it('has unique, well-formed PO numbers', () => {
    const pos = createPurchaseOrders().map((r) => r.poNumber);
    expect(new Set(pos).size).toBe(pos.length);
    for (const po of pos) expect(po).toMatch(/^100\/PO\/C\d{6}$/);
  });

  it('allows cancel only for completed rows without an RFQ', () => {
    const rows = createPurchaseOrders();
    for (const r of rows) {
      expect(r.canCancel).toBe(r.status === 'เสร็จสิ้น' && r.rfqNumber === '');
    }
    expect(rows.some((r) => r.canCancel)).toBe(true);
    expect(rows.some((r) => r.rfqNumber === '')).toBe(true);
  });

  it('uses valid Date objects, delivering after submission', () => {
    for (const r of createPurchaseOrders()) {
      for (const d of [r.submittedDate, r.deliveryDate]) {
        expect(d).toBeInstanceOf(Date);
        expect(Number.isNaN(d.getTime())).toBe(false);
      }
      expect(r.deliveryDate.getTime()).toBeGreaterThan(r.submittedDate.getTime());
    }
  });

  it('lists newest first, on business days, with PO numbers falling with the date', () => {
    const rows = createPurchaseOrders();
    rows.forEach((r, i) => {
      expect([0, 6]).not.toContain(r.submittedDate.getUTCDay());
      if (i === 0) return;
      expect(r.submittedDate.getTime()).toBeLessThanOrEqual(rows[i - 1].submittedDate.getTime());
      expect(r.poNumber < rows[i - 1].poNumber).toBe(true);
    });
  });

  it('only has a recipient once the delivery is complete', () => {
    for (const r of createPurchaseOrders()) {
      expect(r.recipient !== '').toBe(r.deliveryComplete);
      if (r.deliveryComplete) expect(r.status).toBe('เสร็จสิ้น');
    }
  });

  it('fills cancelBy only for cancelled rows and covers every status', () => {
    const rows = createPurchaseOrders();
    for (const r of rows) expect(r.cancelBy !== '').toBe(r.status === 'ยกเลิก');
    expect(new Set(rows.map((r) => r.status)).size).toBe(4);
  });

  it('describes every order, with assets and expenses worded differently', () => {
    const rows = createPurchaseOrders();
    for (const r of rows) expect(r.description.length).toBeGreaterThan(5);
    expect(new Set(rows.map((r) => r.description)).size).toBeGreaterThan(10);
  });

  it('shows people and vendors whole, in Thai', () => {
    const rows = createPurchaseOrders();
    for (const r of rows) {
      for (const name of [r.creator, r.recipient, r.claimer, r.cancelBy]) {
        if (name) expect(name).toMatch(/^[฀-๿]+( [฀-๿]+)+$/);
      }
      expect(r.vendor).not.toContain('*');
      expect(r.vendor).toMatch(/[฀-๿]/);
    }
    expect(new Set(rows.map((r) => r.vendor)).size).toBeGreaterThan(5);
  });
});

describe('createGoodsReceipts', () => {
  it('shows document numbers whole, leaving NULL as null', () => {
    const rows = createGoodsReceipts();
    for (const r of rows) {
      if (r.grNumber) expect(r.grNumber).toMatch(/^\d{3}\/GR\/C\d{6}$/);
      if (r.materialDoc) expect(r.materialDoc).toMatch(/^\d{10}$/);
    }
    expect(rows.some((r) => r.grNumber === null)).toBe(true);
    expect(rows.some((r) => r.materialDoc === null)).toBe(true);
  });
});
