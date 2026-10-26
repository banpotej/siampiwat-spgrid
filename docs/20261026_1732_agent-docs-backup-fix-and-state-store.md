# สรุปการดำเนินการ: Agent docs, แก้ backup.ps1 และเพิ่ม State Store

วันที่: 2026-10-26

## ภาพรวม

งานแบ่งเป็น 2 ส่วน และแยกเป็น 2 commit

| ส่วน | Commit | ประเภท |
| --- | --- | --- |
| A. Housekeeping | `ea7009c` `chore: agent docs and backup fix` | Fixed issue + เอกสาร |
| B. Phase 1 Task 1 | `1ba255e` `feat(core): add state store` | Implement feature |

## ส่วน A: Housekeeping

### เอกสารที่เพิ่ม/แก้

- `CLAUDE.md` (ใหม่): มีเฉพาะ `@AGENTS.md`
- `AGENTS.md` (แก้): เพิ่มหัวข้อ Rules
  - ห้ามเพิ่ม dependency ใหม่โดยไม่ถามก่อน
  - หนึ่ง task ต่อหนึ่ง feature
  - ทุกการเปลี่ยนแปลงต้องมี test
  - ไฟล์ต้องยาวไม่เกิน 300 บรรทัด
  - `src/core/*` ต้องเป็น pure (ห้ามเข้าถึง DOM)
  - ถ้า public API เปลี่ยน ต้องอัปเดต `docs/API.md` และ `CHANGELOG.md`
- `README.md` (ใหม่): วิธีติดตั้ง ตัวอย่างการใช้งาน และคำสั่งต่าง ๆ
- `CHANGELOG.md` (ใหม่): รูปแบบ Keep a Changelog มีส่วน Unreleased
- `docs/API.md`: ตรวจแล้วตรงกับโค้ดอยู่แล้ว (`rows`, `setRows`, `key`, `label`) จึงไม่ได้แก้

### Fixed issue: `backup.ps1`

- **สาเหตุ:** การกรองโฟลเดอร์ที่ไม่ต้องการใช้ `$rel -like "$_\*"` ซึ่งตรงเฉพาะระดับบนสุดของโปรเจกต์ ทำให้ `node_modules`, `dist` ที่อยู่ลึกลงไป (เช่น `examples/dist`) ถูกใส่ใน zip
- **วิธีแก้:** แยก path ของโฟลเดอร์เป็น segment แล้วตรวจว่ามี segment ใดอยู่ในรายการยกเว้นหรือไม่ ครอบคลุม `node_modules`, `dist`, `playwright-report`, `test-results` ทุกระดับความลึก
- ค่าเริ่มต้น `$Source = $PSScriptRoot` มีอยู่แล้ว จึงไม่ต้องแก้
- **การทดสอบ:** สร้างโฟลเดอร์ชั่วคราวที่มี `a/node_modules/x/` และ `examples/dist/` แล้วรัน ผลลัพธ์ใน zip มีเฉพาะ `root.txt`, `a/ok.js`, `keep/k.js`

## ส่วน B: State Store (Phase 1 Task 1)

### ไฟล์

- `tests/unit/state.test.js` (ใหม่): 14 test เขียนก่อนและรันให้ fail ก่อนเขียนโค้ด (TDD)
- `src/core/state.js` (ใหม่): ฟังก์ชัน `createState(initial)` คืนค่า `{ get, set, subscribe }`

### พฤติกรรม

- `get()` คืน snapshot ปัจจุบัน
- `set(partial)` รวมค่าแบบ shallow merge และเทียบค่าด้วย `Object.is`
  - ถ้ามีค่าเปลี่ยน จะแจ้ง subscriber **หนึ่งครั้ง** ด้วย `(state, prev)`
  - ถ้าไม่มีอะไรเปลี่ยน จะไม่แจ้ง และคง snapshot เดิม
- `subscribe(fn)` คืนฟังก์ชัน unsubscribe (เรียกซ้ำได้ ไม่เกิดปัญหา)
- แจ้ง subscriber จากสำเนาของรายการ ดังนั้นการ unsubscribe ระหว่างแจ้งจะไม่ทำให้ตัวอื่นถูกข้าม
- Snapshot ถูกแทนที่ใหม่เสมอ ไม่แก้ object เดิม
- ไม่มีการเข้าถึง DOM ตามกฎของ `src/core/*`

### สิ่งที่ตั้งใจไม่ทำ

- ยังไม่เชื่อมเข้ากับ `DataGrid.js`
- ไม่ export จาก `src/index.js` จึงไม่ถือเป็น public API และไม่ได้อัปเดต `CHANGELOG.md` / `docs/API.md`
- ไม่แตะ sorting, filtering, pagination และการ render

## ผลการตรวจสอบ

- `npm run check` (lint + typecheck + unit test + build): ผ่าน (3 ไฟล์ test, 20 test)
- `npm run test:e2e`: ผ่าน (1 test)
- CI บน GitHub Actions: สำเร็จ แต่ใช้เวลานานผิดปกติ (ประมาณ 10 นาที แทนที่จะไม่ถึง 1 นาที) ติดอยู่ที่ขั้นตอน `playwright install --with-deps chromium`

## ขั้นตอนถัดไปที่แนะนำ

1. เชื่อม state store เข้ากับ `DataGrid.js` โดยไม่เปลี่ยนพฤติกรรม
2. Sorting: `sortRows` แบบ pure ใน `src/core/` แล้วทำ UI ที่ header พร้อม `aria-sort`
3. Filtering: `filterRows` แล้วทำ UI
4. Pagination: `paginate` แล้วทำ controls
