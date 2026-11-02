# สรุปการดำเนินการ: ปรับปุ่ม column action ให้สวยงาม

วันที่: 2026-10-28 | ประเภท: Improve (CSS เท่านั้น) | commit: ยังไม่ได้ commit

ผลตรวจ: `npm run check` ผ่าน (269 unit test) และ e2e ผ่าน 22 รายการ
ดู screenshot โหมดสว่างและมืดของ `tests/e2e/fixtures/actions.html` ด้วยตาแล้ว CI บน GitHub ยังไม่ได้ตรวจ

## สิ่งที่ทำ

- ค่าเริ่มต้นใหม่: `--dg-action-padding` เป็น `0.35em 1em` (เดิม `0.15em 0.75em`) และ `--dg-action-radius` เป็น `6px` (เดิม `4px`)
- ปุ่มสูงขั้นต่ำ `2em` ตัวอักษรน้ำหนัก 500 เงาบางๆ
- hover: เข้มขึ้นและเงาชัดขึ้น / กดค้าง: เข้มขึ้น เงาหาย ขยับลง 1px / disabled: จางลงและไม่มีเงา
- ระยะห่างระหว่างปุ่มในเซลล์เพิ่มจาก `0.4em` เป็น `0.5em`
- โหมด compact: ความสูงขั้นต่ำ `1.8em`
- ปิด transition และการขยับเมื่อกด ถ้าผู้ใช้ตั้ง `prefers-reduced-motion: reduce`
- ไฟล์ที่แก้: `src/styles/actions.css`, `src/styles/tokens.css`; อัปเดตค่าเริ่มต้นใน `docs/API.md` และ `CHANGELOG.md` (หัวข้อ Changed)

## ข้อตัดสินใจ

- ไม่เปลี่ยน markup และ public API: ตัวแปร `--dg-action-bg`, `--dg-action-color`, `--dg-action-radius`, `--dg-action-padding` และ `className` ของ action ใช้ได้เหมือนเดิม
  (ตัวอย่าง `.btn-cancel` ของ `examples/index.html` ยังทำงาน) กฎพื้นฐานยังอยู่ใน `:where()` เพื่อให้ผู้ใช้ override ได้ง่าย
- คงสไตล์ปุ่มแบบสีทึบ (solid) ไม่เปลี่ยนเป็นแบบ outline เพื่อไม่ให้หน้าตาเปลี่ยนมากเกินคำขอ
- โหมด compact ปรับเฉพาะความสูง ไม่บังคับ padding เพื่อให้ `--dg-action-padding` ของผู้ใช้ยังมีผล

## ข้อสังเกต

- ปุ่มในตารางจะสูงขึ้นเล็กน้อย แถวที่มีปุ่มจึงสูงขึ้นตาม ผู้ที่ใช้ค่าเริ่มต้นอาจเห็นความสูงแถวเปลี่ยน
- test ที่ตรวจ CSS ไม่มี (ไม่มี assertion ด้าน visual) การยืนยันหน้าตาใช้การดู screenshot ด้วยตาเท่านั้น
- ยังไม่ได้ลองโหมด compact และหน้าจอแคบกับปุ่มใหม่ด้วยตา
