# สรุปการดำเนินการ: เลือกฟิลด์/แถวตอน Export Excel และ preview 10 แถวแรก (v2.0.6)

วันที่: 2026-11-10 | ประเภท: Implement feature | commit: `f855e17`, `6c36e62`

## สิ่งที่ทำ

- `exportExcel({ columns, search })`: `columns` เลือก key ของคอลัมน์ข้อมูล (ค่าเริ่มต้นทั้งหมด คงลำดับตาม grid; `RangeError` ถ้าว่างหรือไม่ใช่คอลัมน์ข้อมูล), `search` กรองแถวเฉพาะการ export นั้น ไม่เปลี่ยนสถานะ grid
- option ใหม่ `exportColumnSelect`: ปุ่ม Export เปิด modal มี checkbox ต่อคอลัมน์ (Select all / Clear all, ปุ่ม Export ปิดเมื่อไม่เลือกเลย), ช่อง search เริ่มจากคำค้นของ grid, แสดงจำนวนแถว
- `6c36e62`: modal แสดง preview 10 แถวแรกตามที่ไฟล์จะมี (เฉพาะฟิลด์ที่ติ๊ก, ค่าดิบ, escape แล้ว) อัปเดตตอนพิมพ์/ติ๊ก
- label ใหม่: `exportFields`, `exportSearch`, `exportRowCount`, `exportPreviewMore`, `exportPreviewEmpty`
- ไฟล์หลัก: `src/render/exportDialog.js` (ใหม่), `exportExcel.js`, `gridControls.js`, `src/styles/columns.css`, `modal.css`
- เพิ่ม `deploy-site.ps1` (`npm run deploy:site`) deploy `release/spgrid-site.zip` ขึ้น Cloudflare ด้วย `wrangler` ผ่าน `npx` (ไม่เพิ่ม dependency; `-Pack`, `-DryRun`)
- ทดสอบ: `tests/unit/SPGrid.export-columns.test.js`; Purchase Order example เปิด `exportColumnSelect`
- อัปเดต `docs/API.md`, `CHANGELOG.md`, `docs/AGENT_GUIDE.md`

## ข้อสังเกต

- Off by default grid เดิมไม่เปลี่ยน
- สรุปจาก git history ไม่ได้รัน check ซ้ำ
