# สรุปการดำเนินการ: rename DataGrid เป็น SPGrid (v2.0.0)

วันที่: 2026-11-05 | ประเภท: Implement (breaking change) | commit: ยังไม่ได้ commit

ผลตรวจ: `npm run check` ผ่านทั้งชุด (lint, typecheck, 602 unit test, build, e2e 66 รายการ)
e2e รอบแรกมี 3 รายการล้ม (`actions` 2, `dist-import` 1) รันซ้ำแล้วผ่าน น่าจะเป็นจังหวะ vite dev server ที่เปิดค้างอยู่ ไม่ได้หาสาเหตุลึกกว่านั้น
CI บน GitHub ยังไม่ได้ตรวจ

## สิ่งที่ทำ

- `git mv`: `src/DataGrid.js` -> `src/SPGrid.js`, `src/datagrid.css` -> `src/spgrid.css`, `tests/unit/DataGrid.*.test.js` -> `SPGrid.*`
- แทนที่ชื่อด้วย perl ทั่วทุกไฟล์ที่ track (ยกเว้น `docs/2026*.md`, `CHANGELOG.md` เดิม, `package-lock.json`, `nextjs-datagrid-test/`):
  `@siampiwat/datagrid` -> `@siampiwat/spgrid`, `DataGrid`/`DataGridOptions` -> `SPGrid`/`SPGridOptions`, `datagrid` -> `spgrid`,
  `dg-` -> `spg-` (รวม `--dg-`), `dgi-` -> `spgi-` (`--dgi-*` เป็น token ภายในที่ไม่ได้ถูกพูดถึงมาก่อน)
- localStorage key `datagrid:*` -> `spgrid:*` (11 prefix ใน `src/render/*`)
- build: `dist/spgrid.*` ผ่าน `vite.config.js` และ `exports` ใน `package.json`; ไฟล์ release เป็น `siampiwat-spgrid-<version>.tgz/.zip`
- version `1.0.9` -> `2.0.0` ใน `package.json`, `package-lock.json`, `README.md`, `index.html`
- `CHANGELOG.md` เพิ่ม `[2.0.0]` แบบ BREAKING พร้อมวิธี migrate; `docs/API.md` ถูกแทนที่ชื่อแล้ว
- รัน `prettier --write` เพราะชื่อที่ยาวขึ้น (`spg-`) ทำให้บางบรรทัดต้องห่อใหม่ (แตะเพิ่มประมาณ 5 ไฟล์)

## ข้อสังเกต

- ไม่ได้แก้ URL ของ GitHub repo (`banpotej/siampiwat-datagrid`) เพราะยังไม่ได้ rename repo; ลิงก์ดาวน์โหลดใน `README.md`/`index.html`
  จะชี้ไฟล์ `siampiwat-spgrid-2.0.0.tgz` ใน release ของ repo เดิม ซึ่งยังไม่มีจนกว่าจะรัน `release.ps1`
- ค่าที่ผู้ใช้เคยบันทึกใน localStorage (`datagrid:*`) จะไม่ถูกอ่านและไม่ migrate ให้ (ลงใน CHANGELOG แล้ว)
- `nextjs-datagrid-test/` ไม่ได้ depend บน package นี้จึงไม่ได้แก้ (ชื่อโฟลเดอร์ยังเป็นชื่อเดิม)
- `docs/2026*.md` และ entry เก่าใน CHANGELOG ยังใช้ชื่อเดิม เพราะเป็นบันทึกประวัติ
- ยังไม่ได้ทำ: `npm deprecate @siampiwat/datagrid`, rename repo บน GitHub, publish จริง
- ยังไม่ได้เปิดดูหน้าตัวอย่างด้วยตาหลังเปลี่ยน prefix CSS; ตรวจด้วย e2e เท่านั้น
