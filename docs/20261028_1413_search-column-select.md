# สรุปการดำเนินการ: เลือก column ที่จะค้นหาได้ (Search column select)

วันที่: 2026-10-28 | ประเภท: Implement feature | commit: ยังไม่ได้ commit

ผลตรวจ: `npm run check` ผ่าน (269 unit test, 18 ไฟล์) และ e2e ผ่าน 22 รายการ
CI บน GitHub ยังไม่ได้ตรวจ

## สิ่งที่ทำ

- ตัวเลือกใหม่ `searchColumnSelect` (ใช้คู่กับ `searchable`, ค่าเริ่มต้นปิด): เพิ่ม `<select class="dg-search-column">` ข้างช่องค้นหา
  ตัวเลือกแรกคือ "All columns" ตามด้วยคอลัมน์ข้อมูลทุกคอลัมน์ (ไม่รวมคอลัมน์ action) ใช้ `label` ของหัวตาราง
  หัวหลายบรรทัดแสดงเป็นบรรทัดเดียวคั่นด้วย `/`
- เลือกแล้วกรองใหม่ทันทีด้วยข้อความที่พิมพ์ไว้ และกลับหน้า 1 ค่าที่เลือกคงอยู่แม้ล้างข้อความค้นหา
- เมธอดใหม่ `getSearchColumn()` / `setSearchColumn(key | null)` (key ที่ไม่ใช่คอลัมน์ข้อมูลโยน `RangeError`) ใช้ผ่าน API ได้แม้ไม่มี select
- `getFilter()` และ event `filterChange` มี `searchColumn` เมื่อมีข้อความค้นหาและเลือกคอลัมน์ไว้
  เปลี่ยนคอลัมน์ขณะมีข้อความค้นหายิง `filterChange` หนึ่งครั้ง ถ้ายังไม่มีข้อความค้นหาไม่ยิง
- labels ใหม่ `searchColumn` ("Search in" / "ค้นหาใน") และ `allColumns` ("All columns" / "ทุกคอลัมน์")
- core: `computeView` รับ `searchColumn` แล้วจำกัด `columns` ของ `filterRows` เหลือคอลัมน์เดียว (ยัง pure, ไม่แตะ DOM)
- ไฟล์ที่แก้: `DataGrid.js`, `core/view.js`, `render/toolbar.js`, `render/searchEvents.js`, `render/controls.js`,
  `render/labels.js`, `styles/toolbar.css`, `types.js`
- เปิดใช้ใน `examples/basic.html` และ `examples/index.html`
- อัปเดต `docs/API.md` (ส่วน Search column, options, labels, methods) และ `CHANGELOG.md`
- test ใหม่ `tests/unit/DataGrid.search-column.test.js` (14 test) และ e2e 1 รายการใน `tests/e2e/filter.spec.js`

## ข้อตัดสินใจ

- เป็น option แบบ opt-in เพื่อไม่ให้หน้าตา/การใช้งานเดิมของคนที่ใช้ `searchable` เปลี่ยนไป
- เลือกได้ทีละ 1 คอลัมน์ (หรือทุกคอลัมน์) ยังไม่รองรับเลือกหลายคอลัมน์
- เก็บ `searchColumn` เป็น state แยกจาก `filter` เพราะต้องจำค่าที่เลือกไว้แม้ยังไม่มีข้อความค้นหา
  (ถ้ารวมกับ `filter` ค่าจะหายตอน normalize เมื่อข้อความว่าง)
- `searchColumn` ไม่ถูกส่งรับใน `setFilter()` ต้องใช้ `setSearchColumn()` แยก
- ไม่ได้ติ๊กรายการใหม่ใน `docs/ROADMAP.md` เพราะไม่มีหัวข้อที่ตรงกัน (ใกล้เคียงกับ "filter UI" ที่เสร็จแล้ว)

## ข้อสังเกต

- test เดิมใน `tests/unit/DataGrid.filter.test.js` ตรวจรายการ listener ที่ถูกถอดตอน `destroy` ต้องเพิ่ม `'change'`
- e2e ครั้งแรกล้มเพราะข้อมูลทดสอบที่ผมเขียนผิด แก้ที่ test ไม่ใช่ implementation
- `src/DataGrid.js` เหลือ 289 บรรทัด ใกล้เพดาน 300 บรรทัด ฟีเจอร์ถัดไปที่แตะไฟล์นี้ควรแยกส่วนออกก่อน
- ยังไม่ได้ดูหน้าตาของ select ด้วยตาในเบราว์เซอร์ (มีแค่ screenshot e2e ที่เก็บไว้ใน `test-results/visual/` ซึ่งไม่ได้ตั้ง assertion)
