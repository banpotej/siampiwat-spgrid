# สรุปการดำเนินการ: Lavender theme (v2.0.4)

วันที่: 2026-11-09 | ประเภท: Implement feature | commit: `3f87bc5`, `609ccf0`

## สิ่งที่ทำ

- `src/styles/themeLavender.css`: theme แบบ opt-in ใช้ class `spg-theme-lavender` หรือ `data-spg-theme="lavender"` บน `.spg-root` หรือ ancestor; กำหนดเฉพาะตัวแปร public `--spg-*` และมีชุด dark ทั้งแบบ `prefers-color-scheme` และ `[data-theme="dark"]`
- ตัวแปรใหม่ `--spg-header-bg-image` (ภายใน `--spgi-header-bg-image`, ค่าเริ่มต้น `none`) ใส่ gradient/รูปที่ `th`; `background-color` และ sticky header ไม่เปลี่ยน
- class ใหม่ `.spg-action-warning` และ `.spg-action-solid` (specificity เป็นศูนย์เหมือน action class อื่น)
- หน้าตัวอย่าง `theme-lavender.html` + `examples/theme-lavender.js`; commit ถัดมาปรับข้อมูลตัวอย่างเป็นพนักงานภาษาไทยและแก้ test ตาม
- ทดสอบ: `tests/unit/theme-lavender.test.js`, `tests/e2e/theme-lavender.spec.js`
- อัปเดต `docs/API.md`, `CHANGELOG.md`, `vite.site.config.js`, `examples/nav.js`

## ข้อสังเกต

- grid ที่ไม่ใช้ theme นี้หน้าตาเหมือนเดิม
- สรุปจาก git history ไม่ได้รัน check ซ้ำ
