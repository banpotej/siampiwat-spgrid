# API

## `new DataGrid(container, options)`

- `container: HTMLElement` – จุดที่ใช้ติดตั้ง (mount) ตาราง
- `options.columns: { key: string, label?: string }[]`
- `options.rows?: Record<string, unknown>[]`

ค่าในเซลล์จะถูก HTML-escape

### Methods

- `setRows(rows)` – แทนที่ข้อมูลทั้งหมดและเรนเดอร์ใหม่
- `render()` – เรนเดอร์ใหม่
- `destroy()` – ล้างเนื้อหาใน container

## `escapeHtml(value)`

Escape อักขระ `& < > " '`; ค่า `null`/`undefined` จะกลายเป็น `''`

นำเข้าสไตล์ด้วย `import 'datagrid/style.css'`
