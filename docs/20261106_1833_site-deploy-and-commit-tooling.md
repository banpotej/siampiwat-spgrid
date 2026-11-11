# สรุปการดำเนินการ: tooling สำหรับ deploy เว็บตัวอย่างและสร้าง commit message (v2.0.2 - 2.0.3)

วันที่: 2026-11-06 | ประเภท: Chore / Tooling | commit: `350788b`, `7aca9f9`, `faf36f5` (และ 2.0.2, 2.0.3)

ไม่มีการแก้ `src/` ในชุดงานนี้

## สิ่งที่ทำ

- ยกเลิก CI deploy (`.github/workflows/deploy.yml`) เปลี่ยนเป็นอัปโหลดไฟล์ static เอง: `pack-site.ps1` สร้าง `release/spgrid-site.zip` (`npm run pack:site`)
- `pack-site.ps1`: zip ใช้ path แบบ `/` (forward slash) และ `vite.site.config.js` ไม่รวม `dist/types` เข้า bundle ของเว็บ
- `gcm.ps1`: เปลี่ยนเป็นให้ Claude สร้าง commit message และเพิ่ม `gcm.cmd` เป็น wrapper
- 2.0.2: Cloudflare config build เว็บด้วย `npm run build:site`; แก้ `release.ps1` เรื่อง argument splatting และการเช็ก `npm whoami` บน Windows PowerShell
- 2.0.3: เอา custom-domain route ออกจาก `wrangler.jsonc` (หา zone ไม่เจอ) แล้วเปิด `workers.dev` แทน

## ข้อสังเกต

- ทั้งหมดเป็น tooling ไม่กระทบ public API
- เอกสารนี้สรุปจาก git history และ CHANGELOG ไม่ได้รัน `npm run check` ซ้ำ
