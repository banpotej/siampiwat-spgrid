# API

## `new DataGrid(container, options)`

- `container: HTMLElement` – จุดที่ใช้ติดตั้ง (mount) ตาราง
- `options.columns: { key: string, label?: string, sortable?: boolean }[]`
- `options.rows?: Record<string, unknown>[]`
- `options.locale?: string` – locale ของ `Intl.Collator` ที่ใช้เรียงสตริง (ค่าเริ่มต้น `'th'`)
- `options.onSortChange?: (sort: SortState) => void` – เรียกทุกครั้งที่การเรียงเปลี่ยน

ค่าในเซลล์จะถูก HTML-escape

### Sorting

คอลัมน์ที่ตั้ง `sortable: true` จะคลิกที่หัวคอลัมน์ (หรือกด Enter / Space เมื่อโฟกัสอยู่) เพื่อวนลำดับ
`asc` → `desc` → ไม่เรียง ได้ เรียงได้ครั้งละหนึ่งคอลัมน์ ลำดับเดิมของ `rows` ไม่ถูกแก้ไข

- ตัวเลข เปรียบเทียบเชิงตัวเลข; `Date` เทียบด้วย `getTime()`; boolean เรียง `false` < `true`;
  สตริงใช้ `Intl.Collator` แบบ numeric
- `null`, `undefined`, `NaN` (และ `Date` ที่ไม่ถูกต้อง) อยู่ท้ายสุดทั้ง asc และ desc
- `<th>` ที่เรียงได้มี `tabindex="0"`; คอลัมน์ที่ใช้เรียงอยู่มี `aria-sort="ascending|descending"`
- ตัวบ่งชี้ลูกศรวาดด้วย CSS `::after` ปรับสีได้ด้วย `--dg-sort-indicator-color`
  (และ `--dg-focus-color`, `--dg-sort-hover-bg`)

`SortState` คือ `{ key: string, direction: 'asc' | 'desc' } | null`

### Methods

- `setRows(rows)` – แทนที่ข้อมูลทั้งหมดและเรนเดอร์ใหม่ (การเรียงที่ใช้อยู่ยังคงอยู่)
- `getSort()` – คืน `SortState` ปัจจุบัน (สำเนา)
- `setSort(sort)` – ตั้งการเรียงด้วย `SortState` หรือ `null` เพื่อยกเลิก; โยน `RangeError` ถ้า `key`
  ไม่ใช่คอลัมน์ และ `TypeError` ถ้า `direction` ไม่ถูกต้อง
- `on('sortChange', fn)` – รับเหตุการณ์เมื่อการเรียงเปลี่ยน (ทั้งจากการคลิกและ `setSort`; ไม่เรียกถ้า
  ค่าไม่เปลี่ยน) คืนฟังก์ชัน unsubscribe
- `render()` – เรนเดอร์ใหม่
- `destroy()` – ถอด event listener และล้างเนื้อหาใน container; หลังจากนั้นทุกเมธอดไม่ทำอะไร

## `escapeHtml(value)`

Escape อักขระ `& < > " '`; ค่า `null`/`undefined` จะกลายเป็น `''`

นำเข้าสไตล์ด้วย `import 'datagrid/style.css'`
