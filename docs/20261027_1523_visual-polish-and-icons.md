# สรุปการดำเนินการ: Visual polish และไอคอน Material Symbols (Phase 1 Task 8)

วันที่: 2026-10-27 | ประเภท: Implement feature

ผลตรวจ: `npm run check` ผ่าน (225 unit test, 14 ไฟล์) และ e2e ผ่าน 16 รายการ
ยังไม่ได้ push จึงยืนยัน CI ไม่ได้

## 1. ไอคอน

- เพิ่ม `src/render/icons.js`: inline SVG 10 ตัว (`arrow_upward`, `arrow_downward`, `unfold_more`,
  `chevron_left`, `chevron_right`, `first_page`, `last_page`, `search`, `close`, `inbox`)
- path data ดึงจาก repo `google/material-design-icons` ผ่าน `gh api` (`curl` ล้มเพราะ Windows ตรวจ
  certificate revocation ไม่ได้ และไม่ได้ปิดการตรวจ TLS) แล้วเทียบกับไฟล์ที่ดึงมา ตรงกันทั้ง 10 ตัว
- เพิ่ม `NOTICE` (Apache-2.0), หัวข้อใน README และ `"NOTICE"` ใน `files` ของ `package.json`
- แทน glyph `::after` เดิมด้วย SVG: asc/desc/unfold_more (hint จางและแสดงเมื่อ hover/focus), `aria-sort` ยังเป็นแหล่งความจริง
- `options.icons` แทนไอคอนได้ (SVG ที่ผู้เรียกไว้ใจ) และ export type `IconName`

## 2. ฟีเจอร์ UI

- pager: ปุ่ม First/Prev/Next/Last เป็นไอคอน ชื่อมาจาก `aria-label` (`labels.first`, `labels.last`)
- ช่องค้นหา: ไอคอนแว่นขยายนำหน้า + ปุ่มล้าง (`labels.clear`) ที่แสดงเมื่อมีข้อความ กดแล้วล้างทันที
  ผ่าน flow เดียวกับการพิมพ์ (ยิง `filterChange`, ยกเลิก debounce ที่ค้าง) และคืน focus ให้ช่องค้นหา
- สถานะว่าง: ไอคอน `inbox` + ข้อความ และยังประกาศผ่าน live region
- options ใหม่: `striped`, `density`, `stickyHeader`, `maxHeight` (ตั้งผ่าน CSSOM จึงแทรก CSS ไม่ได้), `column.align`

## 3. ธีม (CSS)

- แยกเป็น `src/styles/{tokens,table,toolbar,pager,a11y}.css` ให้ `datagrid.css` import (build ยังออกไฟล์เดียว)
- ตัวแปรสาธารณะ `--dg-*` อ่านผ่านตัวแปรภายใน `--dgi-*` จึงไม่ทับค่าที่ผู้ใช้ตั้งบน ancestor
- โหมดมืด: `prefers-color-scheme` และ `[data-theme="dark"]` (`data-theme="light"` บังคับสว่าง)
- รองรับ forced-colors, reduced-motion (ปิด transition), container query ≤ 600px, ปุ่ม 44px บน `pointer: coarse`
- line-height 1.6 สำหรับภาษาไทย
- contrast: คำนวณด้วยสคริปต์ ข้อความ ≥ 4.5:1, ไอคอน/ขอบ control ≥ 3:1 ทั้งสองโทน (เส้นคั่นแถวเป็นเส้นตกแต่ง)
- ตัวแปรใหม่: `--dg-bg`, `--dg-color`, `--dg-muted-color`, `--dg-border-color`, `--dg-header-bg`, `--dg-header-color`,
  `--dg-row-hover-bg`, `--dg-stripe-bg`, `--dg-accent`, `--dg-accent-contrast`, `--dg-radius`,
  `--dg-cell-padding-y/x`, `--dg-cell-padding-y/x-compact`, `--dg-font-family`, `--dg-font-size`, `--dg-line-height`

## 4. Test และตัวอย่าง

- unit: `DataGrid.icons.test.js`, `DataGrid.clear.test.js` (ไอคอนสลับตามสถานะ, aria-label/disabled ของ pager,
  ปุ่มล้าง, override ไอคอน, สถานะว่าง, ไม่มีข้อมูลผู้ใช้ในไอคอน, `maxHeight` แทรก CSS ไม่ได้)
- e2e: `visual.spec.js` เก็บภาพไว้ที่ `test-results/visual/` (สว่าง/มืด/แคบ/สถานะว่าง) ยังไม่มี snapshot assertion
- `examples/index.html` มี 4 ตาราง (default, compact+striped, sticky, dark panel) e2e ของ pagination จึงจำกัดที่ `#grid-default`

## 5. ข้อตัดสินใจและข้อควรระวัง

- วาง toolbar (ค้นหา) ไว้บนและ pager ไว้ใต้ตาราง
- markup เปลี่ยน (`.dg-root`, `.dg-th`, Prev/Next ไม่มีข้อความ) จึงแก้ unit test เดิมที่เทียบข้อความปุ่ม
- ยังไม่ได้ตรวจด้วยตา: ข้อความไทยจริง, forced-colors, ปุ่ม 44px บนอุปกรณ์สัมผัส
- Prettier จัดรูปตารางในเอกสารเก่า 2 ไฟล์โดยไม่ตั้งใจ ย้อนกลับด้วย `git checkout` แล้ว
