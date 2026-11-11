# สรุปการดำเนินการ: core สำหรับ filter หลายเงื่อนไข (conditions)

วันที่: 2026-11-10 | ประเภท: Implement feature (pure core) | commit: `649e5e7` (release 2.0.8/2.0.9 ตามมา)

## สิ่งที่ทำ

- `src/core/conditions.js` (pure, ไม่แตะ DOM): `filterByConditions(rows, tree, columns)`, `normalizeConditions`, `operatorsFor`, ภายหลังเพิ่ม `removeConditionPart`
- tree เป็น condition `{ key, op, value }` หรือ group `{ logic: 'and' | 'or', conditions }` ซ้อนได้
- operator ตามชนิดคอลัมน์: text, number, date, enum (`in`/`notIn`), boolean, และ `isEmpty`/`isNotEmpty` ทุกชนิด; ค่าว่างไม่กรองอะไร
- type ใน `src/types.js` (ภายหลังแยกเป็น `src/conditionTypes.js`)
- ทดสอบ: `tests/unit/conditions.test.js` (283 บรรทัด); อัปเดต `docs/ROADMAP.md`, `CHANGELOG.md`

## ข้อสังเกต

- ชั้นนี้ยังไม่มี UI; UI อยู่ในเอกสาร `20261110_1712_advanced-filter-ui.md`
