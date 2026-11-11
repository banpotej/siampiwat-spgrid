# สรุปการดำเนินการ: แยก search/filter ออกจาก SPGrid เป็น FilterControl

วันที่: 2026-11-10 | ประเภท: Refactor | commit: `5e314e1` (และ `d92d05c` sync roadmap + Phase 2)

## สิ่งที่ทำ

- ย้ายการจัดการ search และ filter จาก `src/SPGrid.js` ไป `src/render/filterControl.js` (SPGrid ลดลงประมาณ 33 บรรทัด)
- เพิ่ม `tests/unit/filterControl.test.js`
- `docs/ROADMAP.md`: sync กับ feature ที่ ship แล้ว และเพิ่ม Phase 2

## ข้อสังเกต

- ไม่เปลี่ยนพฤติกรรม; refactor นี้เป็นฐานให้ advanced filter ใช้ต่อ
