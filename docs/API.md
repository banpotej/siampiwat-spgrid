# API

## `new DataGrid(container, options)`

- `container: HTMLElement` – จุดที่ใช้ติดตั้ง (mount) ตาราง
- `options.columns: { key: string, label?: string, sortable?: boolean }[]`
- `options.rows?: Record<string, unknown>[]`
- `options.locale?: string` – locale ที่ใช้เรียงสตริง (`Intl.Collator`) และแปลงเป็นตัวพิมพ์เล็กตอนค้นหา (ค่าเริ่มต้น `'th'`)
- `options.onSortChange?: (sort: SortState) => void` – เรียกทุกครั้งที่การเรียงเปลี่ยน
- `options.searchable?: boolean` – แสดงช่องค้นหา (`<input type="search">`) เหนือตาราง
- `options.searchDebounce?: number` – หน่วงเวลา (ms) หลังพิมพ์ก่อนกรอง (ค่าเริ่มต้น `200`)
- `options.labels?: { search?: string, empty?: string }` – ข้อความ UI: `aria-label` ของช่องค้นหา (`'Search'`) และข้อความเมื่อไม่มีแถว (`'No data'`)
- `options.onFilterChange?: (filter: FilterState | null) => void` – เรียกทุกครั้งที่ตัวกรองเปลี่ยน

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

ตัวแปร CSS อื่น: `--dg-toolbar-gap`, `--dg-input-border`, `--dg-input-radius`, `--dg-empty-color`

`SortState` คือ `{ key: string, direction: 'asc' | 'desc' } | null`

### Filtering

เมื่อ `searchable: true` ผู้ใช้พิมพ์ในช่องค้นหาแล้วตารางจะกรองหลังหยุดพิมพ์ตาม `searchDebounce`
(ช่องว่างจะล้างตัวกรอง) ช่องค้นหาไม่ถูกเรนเดอร์ใหม่ จึงไม่เสีย focus/caret ระหว่างพิมพ์

- ค้นหาแบบ substring ไม่สนตัวพิมพ์ใหญ่/เล็ก และไม่สนรูปแบบการเข้ารหัสของตัวอักษร (NFC)
- หลายคำคั่นด้วยช่องว่าง = ต้องตรงทุกคำ (AND) โดยแต่ละคำตรงคนละคอลัมน์ได้
- ค้นเฉพาะ `key` ใน `options.columns` — ฟิลด์อื่นของแถวที่ไม่ได้แสดงจะไม่ถูกค้น
- `null`/`undefined` ไม่เคยตรง; ตัวเลข, boolean, `Date` เทียบผ่าน `String()`
- ลำดับการทำงาน: กรองก่อน แล้วจึงเรียง; `setRows()` คงตัวกรองและการเรียงเดิมไว้
- ถ้าไม่มีแถวที่แสดง จะมีแถวเดียว `labels.empty` (colspan = จำนวนคอลัมน์) และประกาศผ่าน
  live region (`role="status"`, `aria-live="polite"`)

`FilterState` คือ `{ search?: string, columnFilters?: Record<string, string> }`
(`columnFilters` กรองตามคอลัมน์ แบบ AND; ยังไม่มี UI ให้ใช้ ต้องเรียกผ่าน `setFilter`)

### Methods

- `setRows(rows)` – แทนที่ข้อมูลทั้งหมดและเรนเดอร์ใหม่ (การเรียงที่ใช้อยู่ยังคงอยู่)
- `getSort()` – คืน `SortState` ปัจจุบัน (สำเนา)
- `setSort(sort)` – ตั้งการเรียงด้วย `SortState` หรือ `null` เพื่อยกเลิก; โยน `RangeError` ถ้า `key`
  ไม่ใช่คอลัมน์ และ `TypeError` ถ้า `direction` ไม่ถูกต้อง
- `on('sortChange', fn)` – รับเหตุการณ์เมื่อการเรียงเปลี่ยน (ทั้งจากการคลิกและ `setSort`; ไม่เรียกถ้า
  ค่าไม่เปลี่ยน) คืนฟังก์ชัน unsubscribe
- `getFilter()` – คืน `FilterState` ปัจจุบัน (สำเนา) หรือ `null` เมื่อไม่ได้กรอง
- `setFilter(filter)` – ตั้งตัวกรองด้วย `{ search, columnFilters }` หรือ `null` เพื่อล้าง และเขียน `search`
  ลงในช่องค้นหาด้วย; โยน `RangeError` ถ้า key ใน `columnFilters` ไม่ใช่คอลัมน์
- `on('filterChange', fn)` – รับเหตุการณ์เมื่อตัวกรองเปลี่ยน (ครั้งเดียวต่อการเปลี่ยน ไม่ใช่ทุกตัวอักษร; ไม่เรียกถ้า
  ค่าไม่เปลี่ยน) คืนฟังก์ชัน unsubscribe
- `render()` – เรนเดอร์ตารางใหม่ (ช่องค้นหาไม่ถูกแตะ)
- `destroy()` – ถอด event listener, ยกเลิก debounce ที่ค้างอยู่ และล้างเนื้อหาใน container; หลังจากนั้นทุกเมธอดไม่ทำอะไร

## `escapeHtml(value)`

Escape อักขระ `& < > " '`; ค่า `null`/`undefined` จะกลายเป็น `''`

นำเข้าสไตล์ด้วย `import 'datagrid/style.css'`
