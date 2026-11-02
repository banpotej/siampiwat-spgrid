# สรุปการดำเนินการ: Sort UI, Events และงานค้างจาก Phase 1 Task 2

วันที่: 2026-10-27

## ภาพรวม

งานนี้คือ Phase 1 Task 3 — เชื่อม state และ sort เข้ากับ `DataGrid` (UI + events) แบ่งเป็น 2 ส่วน
ยังไม่ได้ commit/push (รอผู้ใช้สั่ง)

| ส่วน                              | ประเภท                     |
| --------------------------------- | -------------------------- |
| Step 0. งานค้าง (leftovers)       | Fixed issue / Housekeeping |
| Steps 1-3. Sort UI + events + API | Implement feature          |

ผลการตรวจสอบ: `npm run check` ผ่าน (lint, typecheck, unit test 64 รายการ, build) และ
`npm run test:e2e` ผ่าน 3 รายการ

## Step 0: งานค้าง

- `package.json`: เพิ่มสคริปต์ `"test:watch": "vitest"`
- `docs/ROADMAP.md`: เปลี่ยน Phase 1 เป็น checklist (sort core `[x]`, sort UI `[x]`, ส่วนที่เหลือ `[ ]`)
- `src/core/sort.js` (แก้ไขพฤติกรรมการเปรียบเทียบ):
  - `Date` เทียบด้วย `getTime()`
  - boolean เรียง `false` < `true`
  - `NaN` (รวมถึง `Date` ที่ไม่ถูกต้อง) ถือเหมือน `null` คืออยู่ท้ายสุดทั้ง asc และ desc
  - เพิ่ม test ใน `tests/unit/sort.test.js`

## Steps 1-3: Sort UI และ Events

### ไฟล์ที่เพิ่ม/แก้ไข

| ไฟล์                                      | การเปลี่ยนแปลง                                                                                                                   |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `src/types.js`                            | เพิ่ม `Column.sortable`, `DataGridOptions.locale`, `DataGridOptions.onSortChange`                                                |
| `src/render/table.js` (ใหม่)              | สร้าง markup ของตาราง (escape ทุกค่า) แยกออกจาก `DataGrid.js`                                                                    |
| `src/DataGrid.js`                         | state เก็บ `{ columns, rows, sort }`, คำนวณแถวที่แสดงด้วย `sortRows()`, listener แบบ delegated, `getSort()`, `setSort()`, `on()` |
| `src/datagrid.css`                        | ตัวบ่งชี้การเรียงด้วย `::after` + ตัวแปร `--dg-*` (ไม่ใช้ icon library)                                                          |
| `examples/index.html`                     | ตั้งทุกคอลัมน์เป็น `sortable: true`                                                                                              |
| `docs/API.md`, `CHANGELOG.md`             | อัปเดตตามการเปลี่ยนแปลง public API                                                                                               |
| `tests/unit/DataGrid.sort.test.js` (ใหม่) | unit test ของ sort UI และ events                                                                                                 |
| `tests/e2e/sort.spec.js` (ใหม่)           | e2e: คลิกหัวคอลัมน์ 3 ครั้งแล้วตรวจลำดับแถว และทดสอบ Enter                                                                       |

### พฤติกรรมที่ได้

- คลิกหัวคอลัมน์ที่ `sortable` เพื่อวน asc → desc → ไม่เรียง; เรียงได้ครั้งละหนึ่งคอลัมน์
- กด Enter / Space เมื่อโฟกัสที่หัวคอลัมน์ก็เรียงได้ (Space ไม่ทำให้หน้า scroll)
- คอลัมน์ที่ไม่ `sortable` จะไม่ตอบสนองต่อการคลิก
- `<th>` ที่เรียงได้มี `tabindex="0"`; คอลัมน์ที่ใช้เรียงอยู่มี `aria-sort="ascending|descending"`
  คอลัมน์อื่นไม่มี attribute นี้
- ใช้ listener คู่เดียว (click + keydown) บน `<thead>` ไม่มี listener รายเซลล์
- API ใหม่: `getSort()`, `setSort(sortState | null)`, `on('sortChange', fn)` (คืนฟังก์ชัน unsubscribe),
  option `onSortChange` และ `locale`
- `destroy()` ถอด listener และล้าง container; หลังจากนั้น `setRows()`, `setSort()`, `render()` และการคลิกไม่ทำอะไร
- ลำดับเดิมของ `rows` ที่ส่งเข้ามาไม่ถูกแก้ไข

### การตัดสินใจที่เกินจากที่ระบุในงาน

1. **ผูก listener ใหม่ทุกครั้งที่ render**: ตารางถูกสร้างใหม่ทุกครั้ง (มี test เดิมบังคับให้ `render()`
   สร้าง table ใหม่) จึงผูก listener คู่เดียวกับ `<thead>` ใหม่ และถอดออกใน `destroy()`
2. **คืน focus หลังเรียงด้วยคีย์บอร์ด**: ถ้าไม่ทำ focus จะหายทุกครั้งที่ re-render
3. **`sortChange` ยิงเมื่อการเรียงเปลี่ยนจริง** รวมถึงจาก `setSort()` แต่ไม่ยิงถ้าค่าเท่าเดิม
   (หากต้องการให้ยิงเฉพาะการคลิก ให้แจ้งเพื่อปรับ)
4. **`setSort` ตรวจสอบค่า**: `key` ที่ไม่ใช่คอลัมน์ → `RangeError`, `direction` ผิด → `TypeError`
   ส่วนคอลัมน์ที่ไม่ `sortable` ยังตั้งค่าผ่านโค้ดได้
5. **แยกไฟล์ test**: `DataGrid.test.js` เกิน 300 บรรทัด (302) จึงย้าย test ส่วน sorting ไปไว้ที่
   `DataGrid.sort.test.js` (ต่างจากที่งานระบุให้เขียนใน `DataGrid.test.js`)
6. **e2e ใช้คอลัมน์ Role** เพราะลำดับของ `<b>Eve</b>` ในคอลัมน์ Name ขึ้นกับข้อมูล locale

### ข้อควรทราบ

- Prettier เคยจัดรูปแบบไฟล์เอกสารเก่า `docs/20261026_1732_...md` โดยไม่ตั้งใจ — ได้ revert กลับแล้ว
- ไฟล์ที่ยาวที่สุดหลังแก้: `DataGrid.sort.test.js` 195 บรรทัด, `DataGrid.js` 152 บรรทัด (ต่ำกว่า 300)
- ไม่มี dependency ใหม่ และไม่ได้ทำ filtering, pagination, multi-column sort (นอกขอบเขต)
