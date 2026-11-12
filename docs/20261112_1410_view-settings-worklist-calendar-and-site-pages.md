# สรุปการดำเนินการ: view settings, worklist, group toggle, calendar และหน้า changelog/upgrade

วันที่: 2026-11-11 ถึง 2026-11-12 | ประเภท: Implement features / Fixed bug / Docs | เวอร์ชันที่ออก: `2.0.10`, `2.0.11` (calendar ยังอยู่ใน `[Unreleased]`)

## Implement features

### API / library (`src/`)

- `getViewSettings()` / `setViewSettings(settings)` (`ea34d8a`): อ่าน/เปลี่ยนหน้าตาตารางจากโค้ด (`striped`, `wrapped`, `gridLines`, `lineStyle`, `freezeColumns`) ใช้ได้โดยไม่ต้องมี option `*Toggle`, บันทึก `localStorage` เมื่อมี `*StorageKey`, ค่าไม่ถูกต้อง throw `TypeError` / `RangeError` โดยไม่เปลี่ยนอะไร; type ใหม่ `ViewSettings`
- `labels.groupCount` (`f33195e`, `6a46a35`): ฟังก์ชันกำหนดข้อความจำนวนแถวใน group header; รับอาร์กิวเมนต์ที่สอง `{ level, column, rows }` เพื่อให้แต่ละชั้น `groupBy` ใช้ข้อความต่างกันได้ (ฟังก์ชันที่รับอาร์กิวเมนต์เดียวยังใช้ได้)
- option `groupToggleAllButton` (`7726d79`): ปุ่มบน toolbar พับ/กางทุก group ของหน้า (แสดงเมื่อมีการ group); labels ใหม่ `collapseAllGroups`, `expandAllGroups`; icon ใหม่ `unfold_less`
- โหมดปฏิทิน `calendar` (`029deb2`): แสดงแถวเป็นนัดหมายตามเวลา อ่านอย่างเดียว
  - มุมมอง `agenda`, `day`, `workWeek`, `week`; ปุ่ม Today / ก่อนหน้า / ถัดไป
  - นัดที่ซ้อนเวลากันแบ่งความกว้าง, ชั่วโมงขยายตามนัด, เส้นเวลาปัจจุบัน, นัดข้ามเที่ยงคืนวาดทุกวัน
  - search / column filter / advanced filter / `setFilter()` ใช้กับนัดได้; `onRowActivate` ทำงานเมื่อคลิกหรือกด Enter
  - option ผิดรูปแบบ throw `TypeError` / `RangeError`; labels `calendar*` ใหม่; CSS variables `--spg-cal-hour-height`, `--spg-cal-max-height`
  - logic ล้วนอยู่ใน `src/core/calendar.js` (ไม่แตะ DOM); view ใน `src/render/calendarView.js`; style ใน `src/styles/calendar.css`
  - ปิดเป็นค่าเริ่มต้น กริดเดิมไม่เปลี่ยนพฤติกรรม

### Example / site

- `worklist.html`: แสดงข้อมูลเป็นลิสต์ (column `render` เดียว 3 บรรทัด, header ซ่อน); ต่อมาเพิ่มเอกสารซ้อนในแถบ (`groupBy: ['status','doc']`), toolbar แบบ Purchase Order (search, advanced filter, chips, export, column picker, refresh, reset, group-by, paging) และ details sheet เมื่อดับเบิลคลิก (`c99a7ee`)
- `view-settings.html`: หน้าทดลอง `getViewSettings` / `setViewSettings` / `setGroupBy` พร้อม preset และ `*StorageKey`; จัดแผงการตั้งค่าเป็นส่วน ๆ (`38f5e63`, `4824b47`)
- เมนู nav: เปลี่ยนลิงก์ตัวอย่างเป็น dropdown "Examples" (`examples/nav.js`)
- `calendar.html` (`examples/calendar.js`): ตัวอย่างโหมดปฏิทิน อยู่ใน nav และหน้า landing
- `changelog.html`: อ่านประวัติรุ่นจาก `CHANGELOG.md` ตอน build (การ์ดพับได้ต่อรุ่น, badge latest/BREAKING, expand/collapse all, ลิงก์ `#vX-Y-Z`; ใช้ `textContent` และรับเฉพาะลิงก์ http(s))
- `upgrade.html`: วิธีอัปเดต SPGrid ในโปรเจกต์ และวิธีออกรุ่น/deploy ใหม่
- `index.html` แสดงเวอร์ชันแพ็กเกจแบบไดนามิกในคำแนะนำติดตั้ง (`0a46a84`)

## Fixed

- group header: ไฮไลต์ตอน hover/focus ของปุ่มครอบทั้งแถวแล้ว (เดิม cell มี padding ของคอลัมน์แรก/สุดท้ายทำให้เหลือแถบที่ปลายสองข้าง) แก้ใน `src/styles/groups.css` (`38f5e63`)

## Tooling / chore

- `release.ps1` อัปเดตเลข `pkg-version` fallback ใน `index.html` ให้ตรงเวอร์ชันใหม่ด้วย
- ลบ CI workflow; ปรับเวอร์ชันในตัวอย่างการติดตั้งเป็น 2.0.11
- เพิ่ม `changelog.html`, `calendar.html` ใน `vite.site.config.js`

## เอกสารและการทดสอบ

- อัปเดต `CHANGELOG.md`, `docs/API.md` (ส่วน calendar, `groupCount`, view settings) และ `docs/ROADMAP.md` (calendar: รอบแรกเสร็จ)
- Unit: `calendar.test.js`, `SPGrid.calendar.test.js`, `SPGrid.calendar-options.test.js`, `changelog-page.test.js`
- E2E: `calendar.spec.js`, `changelog.spec.js`, `view-settings.spec.js`, `worklist.spec.js`, `theme-lavender.spec.js`, `examples-index.spec.js`

## ข้อสังเกต / สิ่งที่ยังไม่ทำ

- calendar ยังไม่มี `getCalendarView()` / `setCalendarView()`, มุมมองเดือน, นัดตลอดวัน, การลาก, นัดซ้ำ (ดู `docs/ROADMAP.md`)
- calendar ยังไม่ได้ออกเวอร์ชัน (อยู่ใต้ `[Unreleased]` ใน `CHANGELOG.md`)
- ตรวจสอบแล้ว: `npm run check` (lint + typecheck + unit + build + e2e) ผ่าน; e2e 100 passed เมื่อ 2026-11-12
