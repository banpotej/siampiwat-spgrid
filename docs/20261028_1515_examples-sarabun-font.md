# สรุปการดำเนินการ: เปลี่ยน font หน้าตัวอย่างเป็น Google Sarabun

วันที่: 2026-10-28 | ประเภท: Improve (เฉพาะหน้าตัวอย่าง) | commit: ยังไม่ได้ commit

ผลตรวจ: `npm run check` ผ่าน (273 unit test) และ e2e ผ่าน 22 รายการ
ตรวจใน Chromium ว่า Sarabun โหลดจริง (`document.fonts`) และ computed `font-family` ของ body, ตาราง, ช่องค้นหา, select, ปุ่ม action, pager เป็น Sarabun ทั้งหมด
CI บน GitHub ยังไม่ได้ตรวจ

## สิ่งที่ทำ

- `examples/index.html` และ `examples/basic.html`: เพิ่ม `<link>` Google Fonts `Sarabun` (น้ำหนัก 400/500/600/700, `display=swap`) พร้อม `preconnect`
- ตั้ง `font-family: 'Sarabun', sans-serif` ที่ `body` และตั้ง `--dg-font-family` ให้ตารางใช้ฟอนต์เดียวกัน
  (ผ่านตัวแปร theme ที่ไลบรารีมีอยู่แล้ว ไม่แก้โค้ดไลบรารี)

## ข้อตัดสินใจ

- ตีความ "หน้าตัวอย่าง" เป็น `examples/*.html` เท่านั้น ไม่แตะค่าเริ่มต้นของไลบรารี (`src/styles/tokens.css`) ที่ยังเป็น system font
  เพราะไลบรารี zero-dependency และไม่ควรบังคับโหลดฟอนต์ภายนอกให้ผู้ใช้ทุกคน
- ไม่แตะ fixture ของ e2e (`tests/e2e/fixtures/*.html`) เพื่อให้ test ไม่ต้องพึ่งเครือข่าย

## ข้อสังเกต

- หน้าตัวอย่างต้องต่ออินเทอร์เน็ตเพื่อโหลดฟอนต์ ถ้าออฟไลน์จะ fallback เป็น `sans-serif` ของระบบ ไม่ทำให้หน้าพัง
- ไม่ต้องแก้ `docs/API.md` / `CHANGELOG.md` เพราะไม่ใช่การเปลี่ยน public API
- ถ้าต้องการให้ไลบรารีใช้ Sarabun เป็นค่าเริ่มต้นเอง หรือ self-host ฟอนต์ บอกได้ (กรณีหลังจะเพิ่มไฟล์ฟอนต์ในรีโป)
