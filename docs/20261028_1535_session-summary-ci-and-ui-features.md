# สรุปการดำเนินการ: แก้ CI และปรับ UI/ฟีเจอร์ของ DataGrid (รอบวันที่ 2026-10-28)

วันที่: 2026-10-28 | ประเภท: Fix bug + Implement features + Improve | commit: **ยังไม่ได้ commit ทั้งหมด**

ผลตรวจล่าสุด: `npm run check` ผ่าน (287 unit test, 20 ไฟล์ทดสอบ) และ e2e ผ่าน 24 รายการ
CI บน GitHub ยังไม่ได้ตรวจหลังแก้ (ยังไม่ได้ push)

## 1. Fixed bug / issue

| เรื่อง                                                                       | สาเหตุ                                                                                                                     | วิธีแก้                                                                                                                                     | เอกสารละเอียด                               |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| CI `check` ล้มทุก run บน `main` (`ERR_MODULE_NOT_FOUND: eslint-config-next`) | `eslint .` จาก root เข้าไป lint `nextjs-datagrid-test/` ซึ่งมี `eslint-config-next` เฉพาะใน `node_modules` บนเครื่อง local | เพิ่ม `nextjs-datagrid-test/` ใน `ignores` ของ `eslint.config.js` ตรวจโดยย้าย `node_modules` ของแอปนั้นออกชั่วคราวแล้ว `npm run check` ผ่าน | `20261028_1405_fix-ci-eslint-nested-app.md` |

## 2. Implement features

| ฟีเจอร์                   | สรุป                                                                                                                                           | เอกสารละเอียด                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| เลือกคอลัมน์ที่ค้นหา      | option `searchColumnSelect`, `getSearchColumn()` / `setSearchColumn()`, `labels.searchColumn` / `allColumns`, `filterChange` มี `searchColumn` | `20261028_1413_search-column-select.md`  |
| icon ในปุ่ม action        | `ActionDef.icon` + ไอคอนในตัวใหม่ `visibility`, `edit`, `delete`, `cancel`, `check`                                                            | `20261028_1445_action-button-icons.md`   |
| ตารางมี border ทุกเซลล์   | option `bordered` (class `dg-bordered`)                                                                                                        | `20261028_1530_table-bordered.md`        |
| ค้นหาแบบกดปุ่ม            | option `searchButton` (กรองเมื่อกดปุ่ม/Enter), ปุ่ม Clear search, ไอคอนและสีของทั้งสองปุ่ม, `labels.searchButton`                              | `20261028_1600_search-button.md`         |
| ส่วนค้นหาเป็น Input Group | select + ช่องค้นหา + ปุ่ม เชื่อมขอบเป็นแถบเดียว แยกแถวเมื่อ container แคบกว่า 520px                                                            | ต่อท้าย `20261028_1600_search-button.md` |

## 3. Improvements (CSS / ตัวอย่าง)

| เรื่อง              | สรุป                                                                                              | เอกสารละเอียด                            |
| ------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| ปุ่ม action สวยขึ้น | padding/radius/น้ำหนักตัวอักษร/สถานะ hover-active-disabled, รองรับ `prefers-reduced-motion`       | `20261028_1430_action-button-polish.md`  |
| สีปุ่ม action       | แบบ tonal + class `dg-action-danger` / `-success` / `-neutral`, ตัวแปร `--dg-action-tone` ฯลฯ     | `20261028_1545_action-button-colors.md`  |
| ตารางสวยขึ้น        | เงากรอบ, เส้นใต้หัวตารางอ่อนลง, padding ขอบแถว, เงา sticky header                                 | `20261028_1500_table-polish.md`          |
| font หน้าตัวอย่าง   | Google Sarabun ใน `examples/*.html`                                                               | `20261028_1515_examples-sarabun-font.md` |
| หัวข้อหน้าตัวอย่าง  | `<h1>` "PO List" เป็น "รายการใบสั่งซื้อ" ใน `examples/index.html` (แก้บรรทัดเดียว ไม่มีเอกสารแยก) | เอกสารนี้                                |

## Public API ที่เปลี่ยน (อัปเดต `docs/API.md` และ `CHANGELOG.md` แล้ว)

- Options ใหม่: `searchColumnSelect`, `searchButton`, `bordered`; `ActionDef.icon`; `IconName` เพิ่ม 5 ชื่อ; labels ใหม่ `searchColumn`, `allColumns`, `searchButton`
- เมธอดใหม่: `getSearchColumn()`, `setSearchColumn()`; `getFilter()` / `filterChange` อาจมี `searchColumn`
- ตัวแปร CSS ใหม่: `--dg-action-tone`, `--dg-action-hover-bg`, `--dg-danger`, `--dg-success`, `--dg-neutral`
- **เปลี่ยนพฤติกรรม:** ค่าเริ่มต้นของ `--dg-action-padding` / `--dg-action-radius` เปลี่ยน; ปุ่ม action เป็น tonal แทนสีทึบ (ผู้ที่ตั้งเฉพาะ `--dg-action-bg` ต้องตั้ง `--dg-action-color` คู่กัน)
- โครงสร้าง toolbar เปลี่ยน: ห่อด้วย `.dg-input-group` และ select คอลัมน์ย้ายมาอยู่หน้าสุด (ลำดับ Tab เปลี่ยน)

## ข้อควรระวังที่ยังค้าง

- ยังไม่ได้ commit / push: มีไฟล์เปลี่ยนแปลงและไฟล์ใหม่รวม 38 รายการใน working tree ยังไม่ได้ตรวจบน CI จริง
- ชื่อไฟล์เอกสารรอบนี้ `1430`–`1600` ผมตั้งเวลาโดยประมาณ ไม่ตรงนาฬิกาเครื่อง (ขณะเขียนเอกสารนี้ 15:35) ลำดับตามชื่อไฟล์จึงอาจไม่ตรงลำดับที่ทำงานจริง
- `src/DataGrid.js` เหลือ 290 บรรทัด ใกล้เพดาน 300 บรรทัดตามกฎโปรเจกต์ ควรแยกส่วนก่อนเพิ่มฟีเจอร์ที่แตะไฟล์นี้อีก
- CSS ใหม่ใช้ `color-mix()`, `light-dark()` และ container query ซึ่งต้องใช้เบราว์เซอร์รุ่นใหม่ (รายละเอียดในเอกสารแต่ละเรื่อง)
- การยืนยันหน้าตาทำด้วย screenshot ดูด้วยตาเท่านั้น ไม่มี assertion ด้าน visual; ยังไม่ได้ลองโหมด RTL, forced-colors และ compact กับทุกฟีเจอร์
- `docs/API.md` ถูก prettier จัดตารางใหม่ diff จึงใหญ่กว่าเนื้อหาที่เปลี่ยนจริง
- `docs/ROADMAP.md` ยังไม่ได้อัปเดต (ฟีเจอร์ข้างต้นไม่มีหัวข้อตรงในแผน Phase 1)
