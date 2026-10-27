# สรุปการดำเนินการ: Filter UI / ช่องค้นหา (Phase 1 Task 5)

วันที่: 2026-10-27 | ประเภท: Implement feature | commit: `73f1727`

## สิ่งที่ทำ

- เพิ่มตัวเลือก `searchable`, `searchDebounce` (ค่าเริ่มต้น 200 ms), `labels`, `onFilterChange`
- เพิ่มเมธอด `getFilter()`, `setFilter()` และเหตุการณ์ `on('filterChange', fn)` (ยิงครั้งเดียวต่อการเปลี่ยน ไม่ยิงถ้าค่าเท่าเดิม)
- ช่องค้นหา `<input type="search">` อยู่ใน toolbar ที่ render ครั้งเดียว ไม่ถูก render ใหม่ จึงไม่เสีย focus/caret ระหว่างพิมพ์
- ลำดับ: กรอง แล้วจึงเรียง
- ผลลัพธ์ว่างแสดงแถวเดียว "No data" (colspan = จำนวนคอลัมน์) และประกาศผ่าน live region (`role="status"`)
- `destroy()` ถอด listener และยกเลิก debounce ที่ค้างอยู่
- `src/render/searchEvents.js` จัดการ input แบบ debounce
- test: unit (`DataGrid.filter.test.js`) และ e2e (`filter.spec.js`)
- อัปเดต `docs/API.md`, `CHANGELOG.md`, CSS variables ใหม่ (`--dg-toolbar-gap` ฯลฯ)
