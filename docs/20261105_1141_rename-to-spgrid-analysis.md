# สรุปการดำเนินการ: เลือกชื่อใหม่และวิเคราะห์ผลกระทบการ rename เป็น SPGrid

วันที่: 2026-11-05 | ประเภท: วิเคราะห์/วางแผน (ไม่มีการแก้โค้ด) | commit: ไม่มีการเปลี่ยนแปลง

ผลตรวจ: ไม่ได้รัน `npm run check` เพราะยังไม่มีการแก้ไฟล์ใดๆ ใน repo (นอกจากไฟล์สรุปนี้)

## การตีความคำขอ

ผู้ใช้ถามหาชื่อใหม่ที่จำง่ายแทน "Siam Piwat DataGrid" แล้วเลือก `SPGrid` จากนั้นถามว่าต้องแก้ตรงไหนบ้าง
งานรอบนี้จึงเป็นการสำรวจผลกระทบเท่านั้น ยังไม่ได้ลงมือ rename

## สิ่งที่ทำ

- เสนอชื่อ `PiwatGrid` (แนะนำ), `SPGrid`, `SiamGrid`, `Piwat DataGrid` พร้อมข้อดีข้อเสีย ผู้ใช้เลือก `SPGrid`
- สำรวจการใช้ชื่อเดิมใน repo: 154 ไฟล์ ประมาณ 1,800 จุด (ไม่นับ `node_modules`, `dist`, `package-lock.json`)
- ตัวแปรชื่อที่พบ: `DataGrid` 131, `datagrid` 113, `siampiwat-datagrid-` 14, `DataGridOptions` 15
- CSS prefix: `.dg-` 621, `dg-` 180, `--dg-` 94

## ขอบเขตที่ต้องแก้ถ้า rename

1. **Public API (breaking)**: `name` ใน `package.json` (`@siampiwat/datagrid`), class `DataGrid` / `DataGridOptions`,
   ไฟล์ `src/DataGrid.js`, ชื่อไฟล์ใน `dist/` และ `exports`/`main`/`module`/`types` (ตั้งใน `vite.config.js` และ `package.json`)
2. **CSS prefix**: `dg-` และ `--dg-` ใน `src/styles/*.css`, `src/render/*.js`, `examples/`, tests
3. **Tests/ตัวอย่าง/สคริปต์**: `tests/unit/DataGrid.*.test.js` (ประมาณ 40 ไฟล์), `tests/e2e/*` และ fixtures, `tests/unit/package.test.js`,
   หน้า HTML ตัวอย่าง, `vite.site.config.js`, `eslint.config.js`, `pack.ps1`, `release.ps1`, `backup.ps1`, `nextjs-datagrid-test/`
4. **เอกสาร**: `docs/API.md`, `CHANGELOG.md` (ต้องลงเป็น breaking change), `README.md`, `docs/AGENT_GUIDE.md`, `AGENTS.md`, `NOTICE`
   ส่วน `docs/2026*.md` เป็นบันทึกประวัติ ไม่แนะนำให้แก้

## ข้อสังเกต / สิ่งที่ยังต้องตัดสินใจ

- ยังไม่ได้ตรวจ key ของ localStorage (sort, column, page size store) ว่าใช้ชื่อเดิมเป็น prefix หรือไม่ ถ้าเปลี่ยนค่าที่ผู้ใช้เคยบันทึกจะหาย
- ต้องเลือก: เปลี่ยน CSS prefix เป็น `spg-` หรือคงเดิม, ขึ้น version เป็น `2.0.0` หรือไม่, จะ rename repo บน GitHub (`banpotej/siampiwat-datagrid`) หรือไม่
- ถ้า publish บน npm แล้ว ควร `npm deprecate @siampiwat/datagrid` ชี้ไปชื่อใหม่
- `SPGrid` ย่อแล้วอ่านไม่ออกว่าคืออะไร และยังไม่ได้เช็คว่าชื่อ `@siampiwat/spgrid` ว่างบน npm (`npm view @siampiwat/spgrid`)
- แผนลงมือที่เสนอ: `git mv` ไฟล์ → แทนที่ class/type → แทนที่ CSS prefix (regex มี word boundary) → แก้ build config และ `package.json`
  → แก้เอกสารและ CHANGELOG → `npm run check` โดยแยก commit ทีละขั้น
