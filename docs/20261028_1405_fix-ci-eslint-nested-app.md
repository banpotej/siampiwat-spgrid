# สรุปการดำเนินการ: แก้ CI ล้มเหลวจาก ESLint (nextjs-datagrid-test)

วันที่: 2026-10-28 | ประเภท: Fix bug / Fix issue | commit: ยังไม่ได้ commit

ผลตรวจ: `npm run check` ผ่าน (255 unit test, 17 ไฟล์) และ e2e ผ่าน 21 รายการ
จำลองสภาพ CI โดยย้าย `nextjs-datagrid-test/node_modules` ออกชั่วคราวแล้วรัน `npm run check` ผ่านทั้งหมด
CI บน GitHub ยังไม่ได้ตรวจหลัง push

## อาการ

- GitHub Actions workflow `CI / check` ล้มทุกครั้งบน `main` (อย่างน้อย 3 run ล่าสุด เช่น run `40635868135`)
- ล้มที่ขั้น lint ภายใน ~1 วินาที: `ERR_MODULE_NOT_FOUND: Cannot find package 'eslint-config-next' imported from nextjs-datagrid-test/eslint.config.mjs`

## สาเหตุ

- `npm run lint` คือ `eslint .` จาก root จึงเข้าไป lint โฟลเดอร์ `nextjs-datagrid-test/` ที่ถูก commit ไว้ด้วย
- แอป Next.js นั้นมี `eslint.config.mjs` ของตัวเองที่ import `eslint-config-next`
- แพ็กเกจดังกล่าวมีเฉพาะใน `nextjs-datagrid-test/node_modules` บนเครื่อง local ส่วน CI รัน `npm ci` ที่ root เท่านั้น จึงหาไม่เจอ
- บนเครื่อง local ผ่านเพราะมี `node_modules` ของแอปนั้นอยู่

## สิ่งที่ทำ

- เพิ่ม `nextjs-datagrid-test/` ในรายการ `ignores` ของ `eslint.config.js`
- ตรวจแล้วว่า `tsconfig.json` (include `src`, `tests`, `*.config.js`), `tsconfig.build.json` และ vitest (`tests/unit/**`) ไม่ได้รวมโฟลเดอร์นี้ จึงไม่ต้องแก้เพิ่ม
- ไม่มีการเปลี่ยน public API จึงไม่ต้องอัปเดต `docs/API.md` / `CHANGELOG.md`

## ข้อสังเกต

- การแก้นี้เป็นการแก้ config ไม่มี test ใหม่ เพราะไม่มีโค้ดใน `src/` เปลี่ยน การยืนยันใช้การรัน `npm run check` โดยไม่มี `node_modules` ของแอปนั้น
- ก่อนแก้ ตอนรัน lint บนเครื่องมีคำเตือน `Pages directory cannot be found` จาก plugin ของ Next ยังไม่ได้ตรวจว่าหายไปหลังแก้หรือไม่
- ไฟล์ที่แก้: `eslint.config.js`
