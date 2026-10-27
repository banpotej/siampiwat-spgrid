# API

## `new DataGrid(container, options)`

- `container: HTMLElement` – จุดที่ใช้ติดตั้ง (mount) ตาราง
- `options.columns: Column[]` – คอลัมน์ ดูรายละเอียดใน [Columns](#columns) (`key`, `label`, `sortable`, `align`,
  `width`, `ariaLabel`, `render`, `actions`)
- `options.rowKey?: string` – ชื่อฟิลด์ที่ระบุแถวได้เฉพาะตัว: ใส่ `data-row-id` ที่ `<tr>` และส่งเป็น `rowKey` ใน event
  `action` (ไม่ตั้ง = `rowKey` เป็น `undefined`; การหาแถวจากการคลิกไม่ใช้ค่านี้ ใช้แถวที่แสดงอยู่ปัจจุบัน)
- `options.onAction?: (payload: ActionEventPayload) => void` – เรียกเมื่อกดปุ่ม action หรือ element ที่มี
  `data-cell-action` (เหมือน `on('action', fn)`)
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
- `options.icons?: Partial<Record<IconName, string>>` – แทนไอคอนด้วย SVG ของคุณ (ดู [Icons](#icons))
- `options.striped?: boolean` – แถวสลับสี (ค่าเริ่มต้น `false`)
- `options.density?: 'compact' | 'comfortable'` – ระยะห่างในเซลล์ (ค่าเริ่มต้น `'comfortable'`)
- `options.stickyHeader?: boolean` – ให้หัวตารางค้างด้านบนเมื่อเลื่อน
- `options.maxHeight?: number | string` – ความสูงสูงสุดของพื้นที่ตาราง (ตัวเลข = px หรือความยาว CSS เช่น `'20rem'`)
  ตารางที่สูงกว่านี้จะเลื่อนภายในกรอบ ใช้คู่กับ `stickyHeader` ถ้าอยากให้หัวตารางค้าง ค่านี้ถูกตั้งผ่าน CSSOM
  จึงใส่ CSS อื่นแทรกเข้ามาไม่ได้
- `options.labels?` – ข้อความ UI (ค่าเริ่มต้นเป็นภาษาอังกฤษ):

  | key              | ใช้กับ                                 | ค่าเริ่มต้น                                   |
  | ---------------- | -------------------------------------- | --------------------------------------------- |
  | `search`         | `aria-label` ของช่องค้นหา              | `'Search'`                                    |
  | `empty`          | ข้อความเมื่อไม่มีแถว                   | `'No data'`                                   |
  | `pagination`     | `aria-label` ของ `<nav>` pager         | `'Pagination'`                                |
  | `prev` / `next`  | `aria-label` ปุ่มก่อนหน้า / ถัดไป      | `'Previous'` / `'Next'`                       |
  | `first` / `last` | `aria-label` ปุ่มหน้าแรก / หน้าสุดท้าย | `'First page'` / `'Last page'`                |
  | `clear`          | `aria-label` ปุ่มล้างช่องค้นหา         | `'Clear search'`                              |
  | `pageSize`       | ป้ายของ select จำนวนแถวต่อหน้า         | `'Rows per page'`                             |
  | `summary`        | `(from, to, total) => string`          | `Showing 1–10 of 25` (ว่าง: `Showing 0 of 0`) |

ค่าในเซลล์จะถูก HTML-escape

ภาษาไทย: `import { DataGrid, thaiLabels } from 'datagrid'` แล้วส่ง `labels: thaiLabels` (แก้บางข้อความได้ด้วย
`labels: { ...thaiLabels, empty: '…' }`) การเรียงและการค้นหาใช้ locale `'th'` เป็นค่าเริ่มต้นอยู่แล้ว

### Columns

| ฟิลด์       | ชนิด                            | ความหมาย                                                                                             |
| ----------- | ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `key`       | `string`                        | ฟิลด์ของแถวที่แสดง (ของ action column เป็นแค่ตัวระบุ)                                                |
| `label`     | `string`                        | ข้อความหัวคอลัมน์ (ค่าเริ่มต้น `key`; action column ค่าเริ่มต้นคือว่าง) ใส่ `\n` เพื่อขึ้นบรรทัดใหม่ |
| `sortable`  | `boolean`                       | คลิกหัวเพื่อเรียง (action column เรียงไม่ได้เสมอ)                                                    |
| `align`     | `'left'`, `'center'`, `'right'` | จัดชิดทั้งหัวและเซลล์                                                                                |
| `width`     | `string`                        | ความกว้างแบบ CSS เช่น `'80px'`, `'20%'` (ค่าที่มี `;` `:` หรือเครื่องหมายคำพูดถูกเมินเฉย)            |
| `ariaLabel` | `string`                        | `aria-label` ของ `<th>` ใช้กับคอลัมน์ที่ไม่มี label เพื่อไม่ให้ screen reader เจอหัวว่าง             |
| `render`    | `(value, row) => string`        | HTML ของเซลล์ (ดูคำเตือนด้านล่าง)                                                                    |
| `actions`   | `ActionDef[]`                   | ทำให้เป็น action column                                                                              |

**Multi-line label:** แต่ละบรรทัดของ `label` ถูก escape แล้วคั่นด้วย `<br>` เช่น `'เลขที่ใบสั่งซื้อ\nPO Number'`

**`render` — ความปลอดภัย:** ค่าที่ `render` คืนถูกใส่เป็น HTML **โดยไม่ escape** ผู้เรียกต้อง escape ข้อมูลผู้ใช้ทุกชิ้นที่แทรกเข้าไปเอง
(ใช้ `escapeHtml` ที่ export จาก `datagrid`) ถ้าไม่ได้ตั้ง `render` ค่าเซลล์จะถูก `escapeHtml` ให้เสมอ ผลลัพธ์ `null`/`undefined` = เซลล์ว่าง

```js
import { DataGrid, escapeHtml } from 'datagrid';
{ key: 'po', render: (v) => `<a href="#" data-cell-action="open">${escapeHtml(v)}</a>` }
```

#### Action columns

`actions: ActionDef[]` ทำให้คอลัมน์แสดงปุ่มจริง `<button type="button" class="dg-action {className}" data-action="{name}">` ต่อหนึ่งแถว
(ค่าใน `row[key]` ถูกเมินเฉย) `ActionDef` คือ `{ name, label, className?, title?, visible?(row), disabled?(row) }`
(`label`, `title`, `className` ถูก escape) `visible(row) === false` = ไม่แสดงปุ่ม, `disabled(row) === true` = ใส่ `disabled`

- action column ไม่เรียงได้ (ไม่มี `tabindex`/`aria-sort`/ไอคอน), ไม่ถูกค้น และใช้ใน `columnFilters`/`setSort` ไม่ได้ (โยน `RangeError`)
- ใช้ listener `click` ตัวเดียวบนตาราง ไม่ซ้ำเมื่อ render ใหม่ และถูกถอดตอน `destroy()`; ปุ่มที่ `disabled` ไม่ยิง event
  `<button>` ทำงานกับ Enter/Space เองอยู่แล้ว
- แถวถูกหาจาก **แถวที่แสดงอยู่ปัจจุบัน** (หลังกรอง/เรียง/แบ่งหน้า) ได้ object แถวเดิม ไม่ใช่สำเนา

#### Events: `action` และ `cellClick`

- `on('action', ({ action, row, key, rowKey }) => …)` – กดปุ่ม action (`action` = `ActionDef.name`) หรือคลิก element ที่ `render()`
  ใส่ `data-cell-action="…"` ไว้ (`action` = ค่านั้น) `key` คือคอลัมน์ที่คลิก
- `on('cellClick', ({ key, row, rowKey, originalEvent }) => …)` – ยิงก่อน `action` เมื่อคลิก `[data-cell-action]` ส่ง `originalEvent` มาด้วย
  เพื่อให้ `preventDefault()` ลิงก์ `href="#"` ได้เอง (ไลบรารีไม่ทำให้)

ชนิด `ActionDef`, `ActionEventPayload`, `CellClickPayload` และ `Column` export จาก `datagrid`

```js
new DataGrid(el, {
  rowKey: 'id',
  columns: [
    { key: '_view', ariaLabel: 'View', actions: [{ name: 'view', label: 'View' }] },
    {
      key: '_cancel',
      ariaLabel: 'Cancel',
      actions: [
        { name: 'cancel', label: 'Cancel', className: 'btn-cancel', visible: (r) => r.canCancel },
      ],
    },
    { key: 'id', label: 'ID', sortable: true },
  ],
  rows,
  onAction: ({ action, row }) => console.log(action, row.id),
});
```

ตัวแปร CSS: `--dg-action-bg`, `--dg-action-color`, `--dg-action-radius`, `--dg-action-padding` (ดูตารางด้านล่าง)
ตั้งบน `.dg-root` หรือบนปุ่มผ่าน `className` ของคุณ (`.dg-action` มี specificity เป็นศูนย์ จึงถูกทับด้วย class ของคุณได้ง่าย)

### Sorting

คอลัมน์ที่ตั้ง `sortable: true` จะคลิกที่หัวคอลัมน์ (หรือกด Enter / Space เมื่อโฟกัสอยู่) เพื่อวนลำดับ
`asc` → `desc` → ไม่เรียง ได้ เรียงได้ครั้งละหนึ่งคอลัมน์ ลำดับเดิมของ `rows` ไม่ถูกแก้ไข

- ตัวเลข เปรียบเทียบเชิงตัวเลข; `Date` เทียบด้วย `getTime()`; boolean เรียง `false` < `true`;
  สตริงใช้ `Intl.Collator` แบบ numeric
- `null`, `undefined`, `NaN` (และ `Date` ที่ไม่ถูกต้อง) อยู่ท้ายสุดทั้ง asc และ desc
- `<th>` ที่เรียงได้มี `tabindex="0"`; คอลัมน์ที่ใช้เรียงอยู่มี `aria-sort="ascending|descending"`
- ตัวบ่งชี้ลูกศรวาดด้วย CSS `::after` ปรับสีได้ด้วย `--dg-sort-indicator-color`
  (และ `--dg-focus-color`, `--dg-sort-hover-bg`)

ตัวแปร CSS อื่น: `--dg-toolbar-gap`, `--dg-input-border`, `--dg-input-radius`, `--dg-empty-color` (ดู [Theming](#theming))

ตัวบ่งชี้การเรียงเป็นไอคอน SVG: `arrow_upward` (asc), `arrow_downward` (desc) และ `unfold_more` สำหรับคอลัมน์ที่เรียงได้แต่ยังไม่ถูกเรียง
(จางและแสดงเมื่อ hover/โฟกัสเท่านั้น) ไอคอนซ่อนจาก screen reader เสมอ — `aria-sort` ยังเป็นแหล่งความจริงด้าน accessibility

`SortState` คือ `{ key: string, direction: 'asc' | 'desc' } | null`

### Filtering

เมื่อ `searchable: true` ผู้ใช้พิมพ์ในช่องค้นหาแล้วตารางจะกรองหลังหยุดพิมพ์ตาม `searchDebounce`
(ช่องว่างจะล้างตัวกรอง) ช่องค้นหาไม่ถูกเรนเดอร์ใหม่ จึงไม่เสีย focus/caret ระหว่างพิมพ์

- ค้นหาแบบ substring ไม่สนตัวพิมพ์ใหญ่/เล็ก และไม่สนรูปแบบการเข้ารหัสของตัวอักษร (NFC)
- หลายคำคั่นด้วยช่องว่าง = ต้องตรงทุกคำ (AND) โดยแต่ละคำตรงคนละคอลัมน์ได้
- ค้นเฉพาะ `key` ใน `options.columns` — ฟิลด์อื่นของแถวที่ไม่ได้แสดงจะไม่ถูกค้น
- `null`/`undefined` ไม่เคยตรง; ตัวเลข, boolean, `Date` เทียบผ่าน `String()`
- ลำดับการทำงาน: กรองก่อน แล้วจึงเรียง; `setRows()` คงตัวกรองและการเรียงเดิมไว้
- ช่องค้นหามีไอคอนแว่นขยายนำหน้า และปุ่มล้าง (`close`, `aria-label` = `labels.clear`) ที่แสดงเฉพาะเมื่อมีข้อความ
  กดแล้วล้างช่องและตัวกรองทันที (ไม่รอ debounce, ผ่าน flow เดียวกับการพิมพ์ จึงยิง `filterChange`) แล้วคืน focus ให้ช่องค้นหา
- ถ้าไม่มีแถวที่แสดง จะมีแถวเดียว ไอคอน `inbox` + `labels.empty` (colspan = จำนวนคอลัมน์) และประกาศผ่าน
  live region (`role="status"`, `aria-live="polite"`)

`FilterState` คือ `{ search?: string, columnFilters?: Record<string, string> }`
(`columnFilters` กรองตามคอลัมน์ แบบ AND; ยังไม่มี UI ให้ใช้ ต้องเรียกผ่าน `setFilter`)

### Pagination

ตั้ง `pageSize` เพื่อเปิดการแบ่งหน้า ลำดับการทำงานคือ กรอง → เรียง → แบ่งหน้า

- pager เป็น `<nav aria-label="…">` ใต้ตาราง ประกอบด้วยปุ่มไอคอน หน้าแรก / ก่อนหน้า / ถัดไป / หน้าสุดท้าย
  (`first_page`, `chevron_left`, `chevron_right`, `last_page`; ชื่อมาจาก `aria-label` ของ `labels`) และปุ่มเลขหน้า
  (ตัดด้วย `…` เมื่อมีหลายหน้า) หน้าปัจจุบันมี `aria-current="page"`; หน้าแรก/ก่อนหน้าถูก `disabled` ที่หน้าแรก
  และถัดไป/หน้าสุดท้ายที่หน้าสุดท้าย
- ข้อความสรุป `Showing X–Y of Z` นับเฉพาะแถวที่ผ่านตัวกรอง ถ้าไม่มีผลลัพธ์จะเป็น `Showing 0 of 0` (และยังมี
  pager หน้า 1 จาก 1 พร้อมแถว "No data")
- เปลี่ยนการค้นหา, ตัวกรอง หรือการเรียง → กลับไปหน้า 1; `setRows()` คงหน้าเดิมไว้แต่ปรับให้อยู่ในช่วง
  (หน้าที่ถูกปรับแล้วจะคงอยู่ ไม่เด้งกลับเมื่อข้อมูลเพิ่มขึ้น)
- เปลี่ยนจำนวนแถวต่อหน้า → กลับไปหน้า 1
- pager อยู่นอกตาราง และใช้ listener `click` ตัวเดียว (+ `change` ของ select) บน container ของ pager;
  หลังคลิก focus จะอยู่ที่ปุ่มเดิม (ปุ่มหน้า, หรือปุ่มลูกศรถ้ายังใช้งานได้ ไม่เช่นนั้นย้ายไปที่ `<nav>`)
- ตัวแปร CSS: `--dg-pager-gap`, `--dg-pager-border`, `--dg-pager-bg`, `--dg-pager-active-bg`,
  `--dg-pager-active-color`, `--dg-pager-muted-color`, `--dg-pager-disabled-opacity`

### Icons

ไอคอนเป็น inline SVG ในตัว (Google Material Symbols แบบ outlined, weight 400, 24px; Apache-2.0 ดู `NOTICE`)
ไม่มี icon font และไม่เรียกเครือข่ายตอนรัน แต่ละอันมี `viewBox="0 -960 960 960"`, `fill="currentColor"`,
`aria-hidden="true"`, `focusable="false"`, ขนาด `1em` และห่อด้วย
`<span class="dg-icon" data-icon="ชื่อ" aria-hidden="true">`

| `IconName`                       | ใช้ที่                                  |
| -------------------------------- | --------------------------------------- |
| `arrow_upward`                   | หัวคอลัมน์ที่เรียง asc                  |
| `arrow_downward`                 | หัวคอลัมน์ที่เรียง desc                 |
| `unfold_more`                    | คอลัมน์ที่เรียงได้แต่ยังไม่เรียง (hint) |
| `first_page` / `last_page`       | ปุ่มหน้าแรก / หน้าสุดท้าย               |
| `chevron_left` / `chevron_right` | ปุ่มก่อนหน้า / ถัดไป                    |
| `search`                         | นำหน้าช่องค้นหา                         |
| `close`                          | ปุ่มล้างช่องค้นหา                       |
| `inbox`                          | สถานะไม่มีข้อมูล                        |

`options.icons` แทนไอคอนแต่ละอันด้วยสตริง SVG ของคุณ (ชื่อที่ไม่รู้จักหรือค่าที่ไม่ใช่สตริงถูกเมินเฉย)
**สตริงนี้ถูกใส่เป็น HTML โดยไม่ escape — ผู้เรียกต้องไว้ใจได้ ห้ามใส่ข้อมูลผู้ใช้** ไอคอนของไลบรารีไม่เคยมีข้อมูลผู้ใช้ปนอยู่:
ข้อความทั้งหมด (label, ค่าเซลล์) ถูก escape และอยู่นอกไอคอน ชนิด `IconName` export จาก `datagrid`

```js
new DataGrid(el, { columns, icons: { search: '<svg viewBox="0 0 24 24">…</svg>' } });
```

### Theming

ตารางห่อด้วย `.dg-root` ตั้งธีมผ่านตัวแปร `--dg-*` บน `.dg-root` หรือ element บรรพบุรุษใดก็ได้
ค่าเริ่มต้นเป็นโทนสว่าง และเปลี่ยนเป็นโทนมืดเมื่อ `prefers-color-scheme: dark` หรือมี `data-theme="dark"` บน element บรรพบุรุษ
(`data-theme="light"` บังคับโทนสว่างแม้ OS เป็นโหมดมืด) ถ้าตั้งตัวแปรเอง ค่านั้นใช้ทั้งสองโทน
ให้กำหนดแยกใต้ `[data-theme="dark"]` ถ้าต้องการให้ต่างกัน

- รองรับ `forced-colors` (Windows High Contrast) และ `prefers-reduced-motion` (ปิด transition); transition ทั้งหมด ≤ 150ms
- อุปกรณ์สัมผัส (`pointer: coarse`): ปุ่ม pager และปุ่มล้างสูงอย่างน้อย 44px
- คอนเทนเนอร์กว้าง ≤ 600px: pager ซ้อนเป็นแนวตั้ง
- line-height เริ่มต้น 1.6 เพื่อไม่ให้สระ/วรรณยุกต์ไทยถูกตัด

| ตัวแปร                                                                                                                                                             | ความหมาย                                    | สว่าง / มืด                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- | -------------------------------------------- |
| `--dg-bg`                                                                                                                                                          | พื้นหลังตาราง/ช่อง                          | `#fff` / `#111827`                           |
| `--dg-color`                                                                                                                                                       | สีข้อความ                                   | `#1f2937` / `#e5e7eb`                        |
| `--dg-muted-color`                                                                                                                                                 | ข้อความรอง, ไอคอน                           | `#4b5563` / `#9ca3af`                        |
| `--dg-border-color`                                                                                                                                                | เส้นคั่นแถว, กรอบตาราง                      | `#e5e7eb` / `#374151`                        |
| `--dg-input-border`                                                                                                                                                | ขอบช่องค้นหา, ปุ่ม, select, เส้นใต้หัวตาราง | `#6b7280`                                    |
| `--dg-header-bg` / `--dg-header-color`                                                                                                                             | หัวตาราง                                    | `#f3f4f6` `#111827` / `#1f2937` `#f9fafb`    |
| `--dg-row-hover-bg`                                                                                                                                                | แถวเมื่อ hover                              | `#f3f4f6` / `#1f2937`                        |
| `--dg-stripe-bg`                                                                                                                                                   | แถวคู่เมื่อ `striped`                       | `#f9fafb` / `#151e2e`                        |
| `--dg-sort-hover-bg`                                                                                                                                               | หัวคอลัมน์/ปุ่มเมื่อ hover                  | `#e5e7eb` / `#374151`                        |
| `--dg-accent` / `--dg-accent-contrast`                                                                                                                             | หน้าปัจจุบัน                                | `#1d4ed8` `#fff` / `#60a5fa` `#0b1220`       |
| `--dg-focus-color`                                                                                                                                                 | วงโฟกัส                                     | `#1d4ed8` / `#93c5fd`                        |
| `--dg-sort-indicator-color`                                                                                                                                        | ไอคอนเรียง                                  | ตาม `--dg-muted-color`                       |
| `--dg-empty-color`                                                                                                                                                 | ข้อความไม่มีข้อมูล                          | ตาม `--dg-muted-color`                       |
| `--dg-radius` / `--dg-input-radius`                                                                                                                                | มุมโค้งตาราง / ช่องและปุ่ม                  | `8px` / `6px`                                |
| `--dg-cell-padding-y` / `--dg-cell-padding-x`                                                                                                                      | ระยะในเซลล์                                 | `12px` / `16px`                              |
| `--dg-cell-padding-y-compact` / `--dg-cell-padding-x-compact`                                                                                                      | ระยะในเซลล์เมื่อ `density: 'compact'`       | `6px` / `12px`                               |
| `--dg-action-bg` / `--dg-action-color`                                                                                                                             | ปุ่ม action: พื้นหลัง / สี                  | `--dg-accent` / `--dg-accent-contrast`       |
| `--dg-action-radius` / `--dg-action-padding`                                                                                                                       | ปุ่ม action: มุมโค้ง / ระยะใน               | `4px` / `0.15em 0.75em`                      |
| `--dg-toolbar-gap`                                                                                                                                                 | ระยะห่างแถบค้นหา/pager                      | `12px`                                       |
| `--dg-font-family` / `--dg-font-size` / `--dg-line-height`                                                                                                         | ตัวอักษร                                    | system-ui + ฟอนต์ไทยของระบบ / `14px` / `1.6` |
| `--dg-pager-gap`, `--dg-pager-border`, `--dg-pager-bg`, `--dg-pager-active-bg`, `--dg-pager-active-color`, `--dg-pager-muted-color`, `--dg-pager-disabled-opacity` | pager (ชื่อเดิม)                            | ตามธีม / `0.5`                               |

ค่าเริ่มต้นผ่านเกณฑ์ contrast: ข้อความ ≥ 4.5:1, ไอคอนและขอบของ control ≥ 3:1 (เส้นคั่นแถวเป็นเส้นตกแต่ง)
`--dg-input-radius`, `--dg-toolbar-gap`, `--dg-focus-color` และ `--dg-sort-indicator-color` มีค่าเริ่มต้นใหม่
`npm run test:e2e` เก็บภาพหน้าตัวอย่างไว้ที่ `test-results/visual/` สำหรับตรวจด้วยตา

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
- `on('action', fn)` / `on('cellClick', fn)` – ดู [Events](#events-action-และ-cellclick) คืนฟังก์ชัน unsubscribe
- `render()` – เรนเดอร์ตารางใหม่ (ช่องค้นหาและ pager ไม่ถูกแตะถ้าเนื้อหาเท่าเดิม)
- `destroy()` – ถอด event listener (หัวตาราง, ช่องค้นหา, pager), ยกเลิก debounce ที่ค้างอยู่ และล้างเนื้อหาใน container; หลังจากนั้นทุกเมธอดไม่ทำอะไร

## `escapeHtml(value)`

Escape อักขระ `& < > " '`; ค่า `null`/`undefined` จะกลายเป็น `''`

นำเข้าสไตล์ด้วย `import 'datagrid/style.css'`
