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
- `options.pageSize?: number` – จำนวนแถวต่อหน้า; ระบุแล้วจึงเปิดการแบ่งหน้า (ค่าเริ่มต้น: ปิด แสดงทุกแถว
  ไม่มี pager) ต้องเป็นจำนวนเต็มบวก ไม่เช่นนั้นโยน `RangeError`
- `options.pageSizeOptions?: number[]` – ตัวเลือกใน `<select>` เปลี่ยนจำนวนแถวต่อหน้า เช่น `[10, 20, 50]`
  (ค่า `pageSize` ปัจจุบันจะถูกเพิ่มเข้ารายการให้ถ้าไม่มีอยู่)
- `options.onPageChange?: (page: { page: number, pageSize: number }) => void` – เรียกทุกครั้งที่หน้าหรือ
  จำนวนแถวต่อหน้าเปลี่ยน
- `options.labels?` – ข้อความ UI (ค่าเริ่มต้นเป็นภาษาอังกฤษ):

  | key             | ใช้กับ                         | ค่าเริ่มต้น                                   |
  | --------------- | ------------------------------ | --------------------------------------------- |
  | `search`        | `aria-label` ของช่องค้นหา      | `'Search'`                                    |
  | `empty`         | ข้อความเมื่อไม่มีแถว           | `'No data'`                                   |
  | `pagination`    | `aria-label` ของ `<nav>` pager | `'Pagination'`                                |
  | `prev` / `next` | ปุ่มก่อนหน้า / ถัดไป           | `'Previous'` / `'Next'`                       |
  | `pageSize`      | ป้ายของ select จำนวนแถวต่อหน้า | `'Rows per page'`                             |
  | `summary`       | `(from, to, total) => string`  | `Showing 1–10 of 25` (ว่าง: `Showing 0 of 0`) |

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

### Pagination

ตั้ง `pageSize` เพื่อเปิดการแบ่งหน้า ลำดับการทำงานคือ กรอง → เรียง → แบ่งหน้า

- pager เป็น `<nav aria-label="…">` ใต้ตาราง ประกอบด้วยปุ่มก่อนหน้า/ถัดไปและปุ่มเลขหน้า (ตัดด้วย `…`
  เมื่อมีหลายหน้า) หน้าปัจจุบันมี `aria-current="page"`; ก่อนหน้าถูก `disabled` ที่หน้าแรก และถัดไปที่หน้าสุดท้าย
- ข้อความสรุป `Showing X–Y of Z` นับเฉพาะแถวที่ผ่านตัวกรอง ถ้าไม่มีผลลัพธ์จะเป็น `Showing 0 of 0` (และยังมี
  pager หน้า 1 จาก 1 พร้อมแถว "No data")
- เปลี่ยนการค้นหา, ตัวกรอง หรือการเรียง → กลับไปหน้า 1; `setRows()` คงหน้าเดิมไว้แต่ปรับให้อยู่ในช่วง
  (หน้าที่ถูกปรับแล้วจะคงอยู่ ไม่เด้งกลับเมื่อข้อมูลเพิ่มขึ้น)
- เปลี่ยนจำนวนแถวต่อหน้า → กลับไปหน้า 1
- pager อยู่นอกตาราง และใช้ listener `click` ตัวเดียว (+ `change` ของ select) บน container ของ pager;
  หลังคลิก focus จะอยู่ที่ปุ่มเดิม (ปุ่มหน้า, หรือก่อนหน้า/ถัดไปถ้ายังใช้งานได้ ไม่เช่นนั้นย้ายไปที่ `<nav>`)
- ตัวแปร CSS: `--dg-pager-gap`, `--dg-pager-border`, `--dg-pager-bg`, `--dg-pager-active-bg`,
  `--dg-pager-active-color`, `--dg-pager-muted-color`, `--dg-pager-disabled-opacity`

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
- `getPage()` – หน้าที่แสดงอยู่ (เริ่มที่ 1; คืน `1` ถ้าไม่ได้เปิดการแบ่งหน้า)
- `setPage(n)` – ไปหน้า `n` (ปรับให้อยู่ในช่วง `1..จำนวนหน้า`); ไม่ทำอะไรถ้าไม่ได้เปิดการแบ่งหน้า
- `getPageSize()` – จำนวนแถวต่อหน้า หรือ `null` ถ้าไม่ได้เปิดการแบ่งหน้า
- `setPageSize(n)` – เปลี่ยนจำนวนแถวต่อหน้าและกลับไปหน้า 1 (เปิดการแบ่งหน้าให้ถ้ายังปิดอยู่);
  โยน `RangeError` ถ้า `n` ไม่ใช่จำนวนเต็มบวก
- `on('pageChange', fn)` – รับ `{ page, pageSize }` ครั้งเดียวต่อการเปลี่ยน (รวมถึงตอนเปลี่ยนจำนวนแถวต่อหน้า,
  ตอนที่การค้นหา/เรียงรีเซ็ตเป็นหน้า 1 และตอนที่ `setRows()` ทำให้หน้าถูกปรับ; ไม่เรียกถ้าไม่เปลี่ยน
  หรือไม่ได้เปิดการแบ่งหน้า) คืนฟังก์ชัน unsubscribe
- `render()` – เรนเดอร์ตารางใหม่ (ช่องค้นหาและ pager ไม่ถูกแตะถ้าเนื้อหาเท่าเดิม)
- `destroy()` – ถอด event listener (หัวตาราง, ช่องค้นหา, pager), ยกเลิก debounce ที่ค้างอยู่ และล้างเนื้อหาใน container; หลังจากนั้นทุกเมธอดไม่ทำอะไร

## `escapeHtml(value)`

Escape อักขระ `& < > " '`; ค่า `null`/`undefined` จะกลายเป็น `''`

นำเข้าสไตล์ด้วย `import 'datagrid/style.css'`
