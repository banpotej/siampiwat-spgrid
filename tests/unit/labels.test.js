import { describe, expect, it } from 'vitest';
import { DataGrid, thaiLabels } from '../../src/index.js';

/** @param {import('../../src/types.js').Labels} labels */
const make = (labels) => {
  const el = document.createElement('div');
  const rows = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
  new DataGrid(el, { columns: [{ key: 'id' }], rows, searchable: true, pageSize: 10, labels });
  return el;
};

describe('thaiLabels', () => {
  it('defines every label', () => {
    expect(Object.values(thaiLabels).every((v) => v !== undefined)).toBe(true);
    expect(thaiLabels.summary(1, 10, 25)).toBe('แสดง 1–10 จาก 25 รายการ');
    expect(thaiLabels.summary(0, 0, 0)).toBe('แสดง 0 จาก 0 รายการ');
  });

  it('renders Thai texts in the search box and pager', () => {
    const el = make(thaiLabels);
    expect(el.querySelector('input')?.getAttribute('aria-label')).toBe('ค้นหา');
    expect(el.querySelector('nav')?.getAttribute('aria-label')).toBe('การแบ่งหน้า');
    expect(el.querySelector('[data-action="next"]')?.getAttribute('aria-label')).toBe('ถัดไป');
    expect(el.querySelector('.dg-summary')?.textContent).toBe('แสดง 1–10 จาก 25 รายการ');
  });
});
