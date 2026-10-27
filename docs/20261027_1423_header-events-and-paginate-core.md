# สรุปการดำเนินการ: Refactor header events และ Paginate core (Phase 1 Task 6)

วันที่: 2026-10-27

## Part A: Refactor (commit `8f5bb56`) — ประเภท: Refactor

- ย้ายการจัดการ event ของหัวตาราง (click/keydown บน `<thead>`) ไป `src/render/headerEvents.js`
- ไม่เปลี่ยนพฤติกรรม; test เดิมยังผ่านทั้งหมด

## Part B: Paginate core (commit `1690c99`) — ประเภท: Implement feature

- เพิ่ม `src/core/paginate.js` (pure):
  - `paginate(rows, {page, pageSize})` — หน้าเริ่มที่ 1, clamp ให้อยู่ในช่วง, รายการว่างยังมี 1 หน้า
  - `getPageWindow(current, totalPages, width)` — ปุ่มเลขหน้าพร้อมตัวคั่น `…`
- เพิ่ม typedef `PageState`, `PageResult`
- test อยู่ใน `tests/unit/paginate.test.js`
- ยังไม่ต่อเข้ากับ `DataGrid` (ทำใน Task 7)
