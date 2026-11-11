# สรุปการดำเนินการ: Advanced filter (toolbar, modal builder, chips) และออกแบบ modal ใหม่

วันที่: 2026-11-10 | ประเภท: Implement feature | commit: `553c56a`, `56ba52c`

## สิ่งที่ทำ

- API: `setAdvancedFilter(tree | null)`, `getAdvancedFilter()`; รวมกับ search และ column filter แบบ AND; ใช้กับ `exportExcel()` และ preview ด้วย; `getFilter()`/`filterChange` ส่ง `conditions`; `setFilter()` ไม่สนใจ; `resetView()` ล้าง
- option `advancedFilter`: ปุ่ม toolbar เปิด modal สร้างเงื่อนไข; `filterSummary` แสดงเป็น chip ลบได้
- ไฟล์ใหม่: `src/render/advancedFilter.js`, `conditionDialog.js`, `conditionRows.js`, `conditionLabels.js`, `conditionText.js`, `conditionPreview.js`, `src/styles/advancedFilter.css`; แก้ `core/view.js`, `filterControl.js`, `summary.js`, `toolbar.js`
- label ใหม่ (`advancedFilter`, `advMatch*`, `advField`, `advOperator`, `advValue`, `advAdd`, `advRemove`, `conditionOperator/And/Or`) และ icon `filter_list`
- `56ba52c` ออกแบบ modal ใหม่: การ์ดต่อเงื่อนไข, สวิตช์ all/any แบบ segmented, chip toggle สำหรับ enum, นับแถวที่ตรงแบบ live, Enter เพื่อ apply
- แก้ `.spg-modal-box` ให้ `grid-template-columns: minmax(0, 1fr)` เนื้อหากว้างเลื่อนในกล่องแทนขยาย modal
- ทดสอบ: `tests/unit/SPGrid.advanced-filter.test.js`, `SPGrid.advanced-filter-dialog.test.js`, `tests/e2e/advanced-filter.spec.js`; Purchase Order example เปิดใช้
- อัปเดต `docs/API.md`, `CHANGELOG.md`, `docs/AGENT_GUIDE.md`, `docs/ROADMAP.md`

## ข้อสังเกต

- Off by default grid เดิมไม่เปลี่ยน
- สรุปจาก git history ไม่ได้รัน check ซ้ำ
