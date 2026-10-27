import { describe, expect, it } from 'vitest';
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

  it('uses valid Date objects', () => {
    for (const r of createPurchaseOrders()) {
      expect(r.submittedDate).toBeInstanceOf(Date);
      expect(Number.isNaN(r.submittedDate.getTime())).toBe(false);
    }
  });
});
