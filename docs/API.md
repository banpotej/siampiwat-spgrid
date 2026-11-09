# API

## `new SPGrid(container, options)`

- `container: HTMLElement` – จุดที่ใช้ติดตั้ง (mount) ตาราง
- `options.columns: Column[]` – คอลัมน์ ดูรายละเอียดใน [Columns](#columns) (`key`, `label`, `sortable`, `align`,
  `width`, `ariaLabel`, `render`, `actions`)
- `options.rowKey?: string` – ชื่อฟิลด์ที่ระบุแถวได้เฉพาะตัว: ใส่ `data-row-id` ที่ `<tr>` และส่งเป็น `rowKey` ใน event
  `action` (ไม่ตั้ง = `rowKey` เป็น `undefined`; การหาแถวจากการคลิกไม่ใช้ค่านี้ ใช้แถวที่แสดงอยู่ปัจจุบัน)
- `options.onAction?: (payload: ActionEventPayload) => void` – เรียกเมื่อกดปุ่ม action หรือ element ที่มี
  `data-cell-action` (เหมือน `on('action', fn)`)
- `options.onRowActivate?: (payload: RowActivatePayload) => void` – เปิดให้แถวถูก "เปิด" ได้ และเรียกเมื่อดับเบิลคลิกแถว หรือกด Enter ขณะโฟกัสที่แถว
  (เหมือน `on('rowActivate', fn)`) ดู [Row activation](#row-activation)
- `options.rows?: Record<string, unknown>[]`
- `options.locale?: string` – locale ที่ใช้เรียงสตริง (`Intl.Collator`) และแปลงเป็นตัวพิมพ์เล็กตอนค้นหา (ค่าเริ่มต้น `'th'`)
- `options.onSortChange?: (sort: SortState) => void` – เรียกทุกครั้งที่การเรียงเปลี่ยน
- `options.searchable?: boolean` – แสดงช่องค้นหา (`<input type="search">`) เหนือตาราง
- `options.searchColumnSelect?: boolean` – (ใช้คู่กับ `searchable`) เพิ่ม `<select>` ข้างช่องค้นหาให้เลือกค้นเฉพาะคอลัมน์เดียว (ค่าเริ่มต้น `false` = ค้นทุกคอลัมน์)
- `options.searchButton?: boolean` – (ใช้คู่กับ `searchable`) เพิ่มปุ่ม "Search" ข้างช่องค้นหา เมื่อเปิดจะกรองเมื่อกดปุ่มหรือกด Enter ในช่อง ไม่กรองระหว่างพิมพ์ (`searchDebounce` ไม่มีผล) ค่าเริ่มต้น `false`
- `options.exportButton?: boolean` – แสดงปุ่ม "Export Excel" (`<button class="spg-export">` ไอคอน `download` อย่างเดียว ไม่มีข้อความ; ชื่อสำหรับ screen reader และ tooltip มาจาก `labels.exportExcel`) เป็นส่วนสุดท้ายของ Input Group ต่อจากช่องค้นหา (ถ้าไม่เปิด `searchable` จะเป็นปุ่มเดี่ยวในแถบเครื่องมือ); กดแล้วเรียก `exportExcel()` ค่าเริ่มต้น `false` สีปุ่มปรับได้ด้วย `--spg-success`
- `options.filterSummary?: boolean` – แสดงแถบสรุปใต้แถบเครื่องมือ (`<div class="spg-summary">`) **เฉพาะขณะมีตัวกรอง**: ข้อความจำนวน เช่น "Found 12 of 250" (`labels.filterSummary(shown, total)`; `shown` = แถวที่ผ่านตัวกรองก่อนแบ่งหน้า, `total` = แถวทั้งหมด) และชิปหนึ่งอันต่อตัวกรองที่ใช้อยู่ (`<li class="spg-chip">`) ได้แก่ ข้อความค้นหา (ขึ้นต้นด้วย `labels.search` หรือชื่อคอลัมน์ถ้าจำกัดการค้นหาไว้คอลัมน์เดียว) และ `columnFilters` แต่ละคอลัมน์ ปุ่ม ✕ บนชิป (`labels.removeFilter(text)` เป็น aria-label) ลบตัวกรองนั้น: ลบชิปค้นหาจะล้างช่องค้นหาและกลับไปค้นทุกคอลัมน์ด้วย และยิง `filterChange` ครั้งเดียว ค่าเริ่มต้น `false`
- `options.refreshButton?: boolean` – แสดงปุ่ม Refresh (`<button class="spg-tool-btn spg-refresh">` ไอคอน `refresh` อย่างเดียว; ชื่อและ tooltip มาจาก `labels.refresh`) ในกลุ่ม Input Group กดแล้วยิง event `refresh` (และเรียก `onRefresh`) เท่านั้น ไลบรารีไม่โหลดข้อมูลเอง — แอปโหลดแล้วเรียก `setRows()` ค่าเริ่มต้น `false`
- `options.onRefresh?: () => void` – เรียกเมื่อกดปุ่ม Refresh (เหมือน `on('refresh', fn)`)
- `options.title?: string` – ชื่อ grid แสดงที่มุมซ้ายของ toolbar (`<h2 class="spg-title">` ถูก escape; แสดง toolbar ให้แม้ไม่มีช่องค้นหา) ค่าเริ่มต้นไม่แสดง
- `options.description?: string` – คำอธิบาย grid แสดงเป็นแถบใต้ toolbar (`<div class="spg-desc">` ถูก escape) มีปุ่มลูกศร (`.spg-desc-toggle`, `aria-expanded`) ข้างชื่อไว้ซ่อน/แสดง เริ่มต้นแสดง ชื่อปุ่มมาจาก `labels.toggleDescription`
- `options.resetButton?: boolean` – เพิ่มปุ่มข้อความ "Reset view" (`<button class="spg-modal-btn spg-settings-reset">` ข้อความจาก `labels.resetView`) ที่มุมซ้ายของท้าย **modal ตั้งค่า** (ปุ่ม Settings จะแสดงเองแม้ไม่เปิด `columnPicker`) กดแล้วปิด modal ตั้งค่า (เหมือน Cancel) และ **ถามยืนยันก่อน** (ดู `confirmReset`) แล้วจึงเรียก `resetView()` ค่าเริ่มต้น `false`
- `options.confirmReset?: false | (message: string) => boolean | Promise<boolean>` – วิธีถามยืนยันของปุ่ม Reset view โดย `message` คือ `labels.confirmReset` ค่าเริ่มต้นแสดง modal ในตัว (`.spg-modal` ปุ่มยกเลิกได้โฟกัส; Esc หรือคลิกฉากหลังคือยกเลิก; ปุ่มใช้ `labels.confirmOk` / `labels.cancel`); ส่งฟังก์ชันของคุณเองเพื่อใช้ dialog อื่นได้ (คืนหรือ resolve `true` เพื่อไปต่อ ค่าอื่นหรือ error ถือว่ายกเลิก) หรือส่ง `false` เพื่อรีเซ็ตทันทีโดยไม่ถาม มีผลกับปุ่มเท่านั้น `resetView()` ที่เรียกจากโค้ดไม่ถามเสมอ และถ้ากริดถูก `destroy()` ระหว่างรอคำตอบจะไม่ทำอะไร
- `options.columnPicker?: boolean` – แสดงปุ่ม "Settings" (`<button class="spg-columns-btn">` ไอคอน `settings` อย่างเดียว; ชื่อและ tooltip มาจาก `labels.columns`) เป็นส่วนสุดท้ายของ Input Group ต่อจากปุ่ม Export (ถ้าไม่เปิด `searchable` จะเป็นปุ่มเดี่ยวในแถบเครื่องมือ) กดแล้วเปิด **modal ตั้งค่า** (`.spg-modal` > `.spg-settings`, `role="dialog"`, `aria-modal`; ปุ่มมี `aria-haspopup="dialog"`) ที่มีช่องติ๊กซ่อน/แสดงของ **คอลัมน์ข้อมูลทุกคอลัมน์** (ไม่รวมคอลัมน์ action ซึ่งแสดงเสมอ) และถ้ามีคอลัมน์ `sortable` จะมีส่วน **การเรียง**: select เลือกคอลัมน์ (`ไม่เรียง` + คอลัมน์ที่ `sortable`) กับ select ทิศทาง (`asc`/`desc` ปิดไว้เมื่อไม่เรียง) Apply เรียกเหมือน `setSort()` จึงถูกจำด้วย `sortStorageKey` (ถ้าตั้งไว้) และเป็นค่าที่ผู้ใช้เลือกเองแทน `defaultSort` ครั้งถัดไป ค่าเริ่มต้นของ modal คือสถานะปัจจุบัน และจะไม่มีอะไรเปลี่ยนจนกว่าจะกด **Apply** ช่องติ๊กสุดท้ายที่ยังแสดงอยู่จะถูก `disabled` เพราะต้องเหลืออย่างน้อยหนึ่งคอลัมน์ modal ปิดด้วย Cancel, Esc หรือคลิกฉากหลัง (ทิ้งการแก้ไข; โฟกัสกลับที่ปุ่ม) Tab วนอยู่ใน modal ข้อความมาจาก `labels.columnSettings`, `labels.apply`, `labels.cancel`, `labels.sortBy`, `labels.noSort`, `labels.sortDirection`, `labels.ascending`, `labels.descending` `resetButton`, `stripedToggle` และ `textWrapToggle` เพิ่มส่วนของตัวเองใน modal เดียวกันและทำให้ปุ่ม Settings แสดงเอง (ส่วนรายการคอลัมน์/การเรียงมีเมื่อเปิด `columnPicker` เท่านั้น) ค่าเริ่มต้น `false`
- `options.hiddenColumns?: string[]` – key ของคอลัมน์ข้อมูลที่ซ่อนตั้งแต่เริ่ม (ถูกแทนที่ด้วยค่าที่บันทึกไว้ถ้ามี `columnStorageKey`) โยน `RangeError` ถ้ามี key ที่ไม่ใช่คอลัมน์ข้อมูล หรือซ่อนครบทุกคอลัมน์
- `options.columnStorageKey?: string` – จำคอลัมน์ที่ซ่อนไว้ใน `localStorage` ภายใต้ `spgrid:columns:<ชื่อ>` แล้วคืนค่าตอนสร้างกริดครั้งถัดไป (เก็บเป็น JSON ของ key ที่ซ่อน จึงไม่กระทบคอลัมน์ใหม่ที่เพิ่มภายหลัง) ควรตั้งชื่อต่างกันในแต่ละกริด ถ้าไม่ระบุจะไม่บันทึก; key ที่ไม่มีแล้ว, JSON เสีย หรือรายการที่ซ่อนครบทุกคอลัมน์ จะถูกเมินเฉย และถ้า `localStorage` ใช้ไม่ได้ (private mode, quota เต็ม) กริดยังทำงานต่อโดยไม่บันทึก
- `options.onColumnsChange?: (hidden: string[]) => void` – เรียกทุกครั้งที่ชุดคอลัมน์ที่ซ่อนเปลี่ยน (เหมือน `on('columnsChange', fn)`)
- `options.searchDebounce?: number` – หน่วงเวลา (ms) หลังพิมพ์ก่อนกรอง (ค่าเริ่มต้น `200`)
- `options.labels?: { search?: string, empty?: string }` – ข้อความ UI: `aria-label` ของช่องค้นหา (`'Search'`) และข้อความเมื่อไม่มีแถว (`'No data'`)
- `options.onFilterChange?: (filter: FilterState | null) => void` – เรียกทุกครั้งที่ตัวกรองเปลี่ยน
- `options.pageSize?: number` – จำนวนแถวต่อหน้า; ระบุแล้วจึงเปิดการแบ่งหน้า (ค่าเริ่มต้น: ปิด แสดงทุกแถว
  ไม่มี pager) ต้องเป็นจำนวนเต็มบวก ไม่เช่นนั้นโยน `RangeError`
- `options.pageSizeOptions?: number[]` – ตัวเลือกใน `<select>` เปลี่ยนจำนวนแถวต่อหน้า เช่น `[10, 20, 50]`
  (ค่า `pageSize` ปัจจุบันจะถูกเพิ่มเข้ารายการให้ถ้าไม่มีอยู่)
- `options.defaultSort?: { key: string, direction: 'asc' | 'desc' }` – การเรียงเริ่มต้นตอนสร้างกริด (และที่ `resetView()` กลับไป แทนการไม่เรียง) `key` ต้องเป็นคอลัมน์ข้อมูล ไม่เช่นนั้น constructor โยน `RangeError` (direction ผิดโยน `TypeError`) ค่าเริ่มต้น: ไม่เรียง
- `options.sortStorageKey?: string` – จำการเรียงไว้ใน `localStorage` ภายใต้ `spgrid:sort:<ชื่อ>` ทุกครั้งที่เปลี่ยน (จากผู้ใช้ `setSort` หรือ `resetView`) แล้วคืนค่าตอนสร้างกริดครั้งถัดไปโดยใช้แทน `defaultSort` การยกเลิกการเรียงก็ถูกจำด้วย (ครั้งหน้าเริ่มแบบไม่เรียง) ควรตั้งชื่อต่างกันในแต่ละกริด ถ้าไม่ระบุจะไม่บันทึก; key ที่ไม่มีแล้ว, direction ผิด, JSON เสีย หรือ `localStorage` ใช้ไม่ได้จะถูกเมินเฉย (ใช้ `defaultSort` ตามเดิม)
- `options.pageSizeStorageKey?: string` – จำจำนวนแถวต่อหน้าไว้ใน `localStorage` ภายใต้ `spgrid:pageSize:<ชื่อ>` ทุกครั้งที่เปลี่ยน (จากผู้ใช้หรือ `setPageSize`) แล้วคืนค่าตอนสร้างกริดครั้งถัดไปโดยใช้แทน `pageSize` ควรตั้งชื่อต่างกันในแต่ละกริด ถ้าไม่ระบุจะไม่บันทึก; ค่าที่ไม่ใช่จำนวนเต็มบวก, JSON เสีย หรือ `localStorage` ใช้ไม่ได้จะถูกเมินเฉย (ใช้ `pageSize` ตามเดิม) ค่าที่จำไว้ไม่อยู่ใน `pageSizeOptions` ก็ยังใช้ได้ (ถูกเพิ่มเข้ารายการ)
- `options.onPageChange?: (page: { page: number, pageSize: number }) => void` – เรียกทุกครั้งที่หน้าหรือ
  จำนวนแถวต่อหน้าเปลี่ยน
- `options.icons?: Partial<Record<IconName, string>>` – แทนไอคอนด้วย SVG ของคุณ (ดู [Icons](#icons))
- `options.striped?: boolean` – แถวสลับสี (ค่าเริ่มต้น `false`; ถูกแทนที่ด้วยค่าที่บันทึกไว้ถ้ามี `stripedStorageKey`)
- `options.reorderableColumns?: boolean` – ให้ผู้ใช้จัดลำดับคอลัมน์: ลากหัวคอลัมน์ไปวางบนหัวคอลัมน์อื่น (วางครึ่งซ้ายของเซลล์เป้าหมาย = ก่อนหน้า, ครึ่งขวา = ถัดไป; กลับด้านใน RTL) เซลล์ที่กำลังลากจะจางลงและมีเส้นสีน้ำเงินบอกตำแหน่งที่จะวาง หรือโฟกัสหัวคอลัมน์แล้วกด Alt+ลูกศรซ้าย/ขวาเพื่อขยับทีละหนึ่งตำแหน่ง (โฟกัสยังอยู่ที่คอลัมน์นั้น) หัวคอลัมน์จะมี `draggable="true"` และ `tabindex="0"` ใช้ได้กับทุกคอลัมน์รวมคอลัมน์ action การจับ handle ของ `resizableColumns` จะปรับความกว้าง ไม่ลากคอลัมน์ ค่าเริ่มต้น `false`
- `options.columnOrderStorageKey?: string` – จำลำดับคอลัมน์ไว้ใน `localStorage` ภายใต้ `spgrid:columnOrder:<ชื่อ>` (เก็บเป็น JSON ของ key ทุกคอลัมน์ตามลำดับที่แสดง) แล้วคืนค่าตอนสร้างกริดครั้งถัดไป ใช้ได้แม้ไม่ได้เปิด `reorderableColumns` key ที่ไม่มีแล้วหรือ JSON เสียจะถูกเมินเฉย คอลัมน์ใหม่ที่ยังไม่เคยบันทึกจะต่อท้ายตามลำดับเดิม ควรตั้งชื่อต่างกันในแต่ละกริด ถ้าไม่ระบุจะไม่บันทึก
- `options.onColumnOrderChange?: (order: string[]) => void` – เรียกทุกครั้งที่ลำดับคอลัมน์เปลี่ยน (เหมือน `on('columnOrderChange', fn)`)
- `options.resizableColumns?: boolean` – ให้ผู้ใช้ลากขอบขวาของหัวคอลัมน์เพื่อปรับความกว้าง (`<span class="spg-resize" role="separator" tabindex="0">`; โฟกัสแล้วกดลูกศรซ้าย/ขวาได้ ถือ Shift เพื่อขยับทีละ 40px ชื่อของ handle มาจาก `labels.resizeColumn(name)`) ความกว้างขั้นต่ำ 48px คอลัมน์ action ปรับไม่ได้ การปรับครั้งแรกจะล็อกทุกคอลัมน์เป็นความกว้างพิกเซลและใช้ `table-layout: fixed` (`spg-fixed`) หลังจากนั้นคอลัมน์อื่นไม่ขยับ ตารางกว้างขึ้นตามผลรวม (ถ้ากว้างเกิน wrapper ให้ตั้ง `overflow-x: auto`) ความกว้างจำไว้ในหน่วยความจำจนกว่าจะ `destroy()` (บันทึกลง `localStorage` ได้ด้วย `columnWidthStorageKey`) และ `resetView()` ไม่แตะค่านี้ ค่าเริ่มต้น `false`
- `options.columnWidthStorageKey?: string` – ใช้คู่กับ `resizableColumns`: จำความกว้างคอลัมน์ไว้ใน `localStorage` ภายใต้ `spgrid:columnWidths:<ชื่อ>` (JSON ของ `{ key: px }`) เขียนเมื่อการปรับขนาดจบ (ปล่อยเมาส์หรือกดลูกศร) แล้วคืนค่าตอนสร้างกริดครั้งถัดไป ตารางจึงเริ่มด้วยความกว้างที่ล็อกไว้ทันที คอลัมน์ที่ไม่มีในค่าที่บันทึก (เช่นเพิ่งเพิ่มใหม่) ได้ 120px ค่าที่ใช้ไม่ได้ (ต่ำกว่า 48px, ไม่ใช่ตัวเลข, JSON เสีย) จะถูกเมินเฉย ควรตั้งชื่อต่างกันในแต่ละกริด ถ้าไม่ระบุจะไม่บันทึก
- `options.highlightSearch?: boolean` – ไฮไลต์ข้อความที่ค้นหาในเซลล์ด้วย `<mark class="spg-mark">` (ถ้าค้นคอลัมน์ enum จะไฮไลต์ **ทั้งเซลล์** ด้วย class `spg-match` บน `<td>` แทน — ดู "ค้นหาคอลัมน์ enum") (จับคำแบบเดียวกับการค้นหา: ไม่สนตัวพิมพ์ ไม่สนวรรณยุกต์/accent ทีละคำ; ถ้าเลือกค้นเฉพาะคอลัมน์ จะไฮไลต์เฉพาะคอลัมน์นั้น; ไฮไลต์ข้อความที่แสดงจริง รวมถึงวันที่และ badge; ไม่แตะคอลัมน์ action) ค่าเริ่มต้น `true` ปรับสีด้วย `--spg-mark-bg`
- `options.textWrap?: boolean` – ข้อความยาวในเซลล์ขึ้นบรรทัดใหม่ (`true`) หรืออยู่บรรทัดเดียว (`false`; ตารางเลื่อนแนวนอนแทน) ค่าเริ่มต้น `true` (ถูกแทนที่ด้วยค่าที่บันทึกไว้ถ้ามี `textWrapStorageKey`) ปิดแล้วจะมี class `spg-nowrap` บน `.spg-root`
- `options.textWrapToggle?: boolean` – เพิ่มสวิตช์ "Wrap text" (`<input type="checkbox" role="switch" data-flag="wrapped">` ข้อความจาก `labels.textWrap`) ในหัวข้อ "Display" ของ modal ตั้งค่า ให้ผู้ใช้เปิด/ปิดการตัดข้อความเอง มีผลเมื่อกด Apply (ค่าเริ่มต้น `false`)
- `options.textWrapStorageKey?: string` – จำตัวเลือกตัดข้อความไว้ใน `localStorage` ภายใต้ `spgrid:textWrap:<ชื่อ>` ทุกครั้งที่ผู้ใช้กดปุ่ม แล้วคืนค่าตอนสร้างกริดครั้งถัดไปโดยใช้แทน `textWrap` ควรตั้งชื่อต่างกันในแต่ละกริด ถ้าไม่ระบุจะไม่บันทึก; ค่าที่ไม่ใช่ boolean, JSON เสีย หรือ `localStorage` ใช้ไม่ได้จะถูกเมินเฉย `resetView()` ไม่แตะค่านี้
- `options.stripedToggle?: boolean` – เพิ่มสวิตช์ "Striped rows" (`<input type="checkbox" role="switch" data-flag="striped">` ข้อความจาก `labels.stripedRows`) ในหัวข้อ "Display" ของ modal ตั้งค่า ให้ผู้ใช้เปิด/ปิดแถวสลับสีเอง มีผลเมื่อกด Apply (ค่าเริ่มต้น `false`)
- `options.stripedStorageKey?: string` – จำตัวเลือกแถวสลับสีไว้ใน `localStorage` ภายใต้ `spgrid:striped:<ชื่อ>` ทุกครั้งที่ผู้ใช้กดปุ่ม แล้วคืนค่าตอนสร้างกริดครั้งถัดไปโดยใช้แทน `striped` ควรตั้งชื่อต่างกันในแต่ละกริด ถ้าไม่ระบุจะไม่บันทึก; ค่าที่ไม่ใช่ boolean, JSON เสีย หรือ `localStorage` ใช้ไม่ได้จะถูกเมินเฉย (ใช้ `striped` ตามเดิม) `resetView()` ไม่แตะค่านี้
- `options.bordered?: boolean` – เส้นขอบรอบทุกเซลล์ (เส้นแนวตั้งระหว่างคอลัมน์ด้วย) ใช้สี `--spg-border-color` (ค่าเริ่มต้น `false`) เท่ากับ `gridLines: 'both'` (ถ้าตั้งทั้งคู่ `gridLines` ชนะ)
- `options.gridLines?: 'default' | 'horizontal' | 'vertical' | 'both' | 'none'` – เส้นที่ตารางวาด (ค่าเริ่มต้น `'default'`; ค่าที่ไม่รู้จักโยน `RangeError`) ดู [Grid lines](#grid-lines)
- `options.lineStyle?: 'default' | 'solid' | 'dashed' | 'dotted'` – ประเภท (ลักษณะ) ของเส้นตาราง (ค่าเริ่มต้น `'default'` = ตามธีม `--spg-line-style` ซึ่งเป็น `dashed`; ค่าที่ไม่รู้จักโยน `RangeError`) ดู [Grid lines](#grid-lines)
- `options.lineStyleToggle?: boolean` – เพิ่ม select "Line style" (`<select data-choice="lineStyle">` ข้อความจาก `labels.lineStyle`) ในหัวข้อ "Display" ของ modal Settings (มีผลเมื่อกด Apply) และทำให้ปุ่ม Settings แสดง (ค่าเริ่มต้น `false`)
- `options.lineStyleStorageKey?: string` – จำประเภทเส้นไว้ใน `localStorage` ภายใต้ `spgrid:lineStyle:<ชื่อ>` ทุกครั้งที่ผู้ใช้กด Apply แล้วคืนค่าตอนสร้างกริดครั้งถัดไปโดยใช้แทน `lineStyle` ควรตั้งชื่อต่างกันในแต่ละกริด ถ้าไม่ระบุจะไม่บันทึก; ค่าที่ไม่ใช่ประเภทเส้นหรือ `localStorage` ใช้ไม่ได้จะถูกเมินเฉย `resetView()` ไม่แตะค่านี้
- `options.groupBy?: string[]` – key ของคอลัมน์ข้อมูลที่ใช้จัดกลุ่มแถว เรียงจากชั้นนอกเข้าใน เช่น `['department', 'status']` (ค่าเริ่มต้น `[]` = ไม่จัดกลุ่ม; key ที่ไม่ใช่คอลัมน์ข้อมูลหรือซ้ำโยน `RangeError`) ดู [Row grouping](#row-grouping)
- `options.groupByToggle?: boolean` – เพิ่มส่วน "Grouping" ใน modal Settings ที่มี select "Group by" และ "Then by" (มีผลเมื่อกด Apply) และทำให้ปุ่ม Settings แสดง (ค่าเริ่มต้น `false`)
- `options.groupByStorageKey?: string` – จำคอลัมน์ที่จัดกลุ่มไว้ใน `localStorage` ภายใต้ `spgrid:groupBy:<ชื่อ>` แล้วคืนค่าตอนสร้างกริดครั้งถัดไปโดยใช้แทน `groupBy` (การเลือก "ไม่จัดกลุ่ม" ก็ถูกจำ) ควรตั้งชื่อต่างกันในแต่ละกริด ถ้าไม่ระบุจะไม่บันทึก; key ที่ไม่ใช่คอลัมน์แล้วหรือซ้ำจะถูกตัดทิ้ง
- `options.onGroupByChange?: (groupBy: string[]) => void` – เรียกทุกครั้งที่ชุดคอลัมน์ที่จัดกลุ่มเปลี่ยน (เหมือน `on('groupByChange', fn)`)
- `options.gridLinesToggle?: boolean` – เพิ่ม select "Grid lines" (`<select class="spg-settings-lines-select">` ข้อความจาก `labels.gridLines`) ในหัวข้อ "Display" ของ modal Settings เพื่อให้ผู้ใช้เลือกโหมดเอง (มีผลเมื่อกด Apply) และทำให้ปุ่ม Settings แสดง (ค่าเริ่มต้น `false`)
- `options.gridLinesStorageKey?: string` – จำโหมดเส้นไว้ใน `localStorage` ภายใต้ `spgrid:gridLines:<ชื่อ>` ทุกครั้งที่ผู้ใช้กด Apply แล้วคืนค่าตอนสร้างกริดครั้งถัดไปโดยใช้แทน `gridLines`/`bordered` ควรตั้งชื่อต่างกันในแต่ละกริด ถ้าไม่ระบุจะไม่บันทึก; ค่าที่ไม่ใช่โหมดหรือ `localStorage` ใช้ไม่ได้จะถูกเมินเฉย `resetView()` ไม่แตะค่านี้
- `options.freezeColumns?: number` – จำนวนคอลัมน์ที่ตรึงไว้ นับจากคอลัมน์ซ้ายสุดของคอลัมน์ที่แสดงอยู่ คอลัมน์เหล่านี้ไม่เลื่อนตามเมื่อเลื่อนตารางไปทางข้าง (เซลล์ได้ class `spg-frozen`) พื้นที่ตารางต้องเลื่อนได้ (ตั้ง `maxHeight` หรือให้ `.spg-table-wrap` เป็น `overflow-x: auto`) และจะเหลือคอลัมน์ที่ไม่ตรึงอย่างน้อย 1 คอลัมน์เสมอ (ค่าเริ่มต้น `0`; ค่าที่ไม่ใช่จำนวนเต็มตั้งแต่ 0 ขึ้นไปโยน `RangeError`) ดู [Freeze columns](#freeze-columns)
- `options.freezeColumnsToggle?: boolean` – เพิ่ม select "Frozen columns" (`<select data-choice="freezeColumns">` ตัวเลือก ไม่ตรึง, 1, 2 … ข้อความจาก `labels.freezeColumns`) ในหัวข้อ "Display" ของ modal Settings (มีผลเมื่อกด Apply) และทำให้ปุ่ม Settings แสดง (ค่าเริ่มต้น `false`)
- `options.freezeColumnsStorageKey?: string` – จำจำนวนคอลัมน์ที่ตรึงไว้ใน `localStorage` ภายใต้ `spgrid:freezeColumns:<ชื่อ>` ทุกครั้งที่ผู้ใช้กด Apply แล้วคืนค่าตอนสร้างกริดครั้งถัดไปโดยใช้แทน `freezeColumns` ควรตั้งชื่อต่างกันในแต่ละกริด ถ้าไม่ระบุจะไม่บันทึก; ค่าที่ไม่ใช่จำนวนเต็มตั้งแต่ 0 ขึ้นไปหรือ `localStorage` ใช้ไม่ได้จะถูกเมินเฉย `resetView()` ไม่แตะค่านี้
- `options.density?: 'compact' | 'comfortable'` – ระยะห่างในเซลล์ (ค่าเริ่มต้น `'comfortable'`)
- `options.stickyHeader?: boolean` – ให้หัวตารางค้างด้านบนเมื่อเลื่อน
- `options.maxHeight?: number | string` – ความสูงสูงสุดของพื้นที่ตาราง (ตัวเลข = px หรือความยาว CSS เช่น `'20rem'`)
  ตารางที่สูงกว่านี้จะเลื่อนภายในกรอบ ใช้คู่กับ `stickyHeader` ถ้าอยากให้หัวตารางค้าง ค่านี้ถูกตั้งผ่าน CSSOM
  จึงใส่ CSS อื่นแทรกเข้ามาไม่ได้
- `options.labels?` – ข้อความ UI (ค่าเริ่มต้นเป็นภาษาอังกฤษ):

  | key                                                                                                  | ใช้กับ                                                                                                      | ค่าเริ่มต้น                                                                   |
  | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
  | `search`                                                                                             | `aria-label` ของช่องค้นหา                                                                                   | `'Search'`                                                                    |
  | `empty`                                                                                              | ข้อความเมื่อไม่มีแถว                                                                                        | `'No data'`                                                                   |
  | `pagination`                                                                                         | `aria-label` ของ `<nav>` pager                                                                              | `'Pagination'`                                                                |
  | `prev` / `next`                                                                                      | `aria-label` ปุ่มก่อนหน้า / ถัดไป                                                                           | `'Previous'` / `'Next'`                                                       |
  | `first` / `last`                                                                                     | `aria-label` ปุ่มหน้าแรก / หน้าสุดท้าย                                                                      | `'First page'` / `'Last page'`                                                |
  | `clear`                                                                                              | `aria-label` ปุ่มล้างช่องค้นหา และชื่อ/tooltip ของปุ่ม Clear search (`searchButton`)                        | `'Clear search'`                                                              |
  | `yes` / `no`                                                                                         | ชื่อสำหรับ screen reader ของค่า `true` / `false` ในคอลัมน์ `type: 'boolean'`                                | `'Yes'` / `'No'`                                                              |
  | `exportExcel`                                                                                        | aria-label และ tooltip ของปุ่ม Export (`exportButton`)                                                      | `'Export Excel'`                                                              |
  | `refresh`                                                                                            | aria-label และ tooltip ของปุ่ม Refresh (`refreshButton`)                                                    | `'Refresh'`                                                                   |
  | `resetView`                                                                                          | aria-label และ tooltip ของปุ่ม Reset view (`resetButton`)                                                   | `'Reset view'`                                                                |
  | `columnSettings`                                                                                     | หัวข้อของ modal ตั้งค่า (`columnPicker`)                                                                    | `'Column settings'`                                                           |
  | `selectAll` / `clearAll`                                                                             | ปุ่มเลือกทั้งหมด / ล้างทั้งหมด (เหลือคอลัมน์แรกไว้) ใต้รายการคอลัมน์ใน modal ตั้งค่า                        | `'Select all'` / `'Clear all'`                                                |
  | `groupSection` / `groupBy` / `thenBy` / `noGrouping`                                                 | หัวข้อส่วนจัดกลุ่ม / ข้อความของ select ชั้นแรก / ชั้นถัดไป / ตัวเลือกว่างใน modal ตั้งค่า (`groupByToggle`) | `'Grouping'` / `'Group by'` / `'Then by'` / `'No grouping'`                   |
  | `columnsSection` / `sortSection` / `displaySection`                                                  | หัวข้อส่วนรายการคอลัมน์ / ส่วนการเรียง / ส่วนสวิตช์การแสดงผลใน modal ตั้งค่า                                | `'Columns'` / `'Sorting'` / `'Display'`                                       |
  | `sortBy` / `noSort` / `sortDirection` / `ascending` / `descending`                                   | ข้อความของส่วนการเรียงใน modal ตั้งค่าคอลัมน์                                                               | `'Sort by'` / `'No sorting'` / `'Direction'` / `'Ascending'` / `'Descending'` |
  | `apply`                                                                                              | ปุ่มยืนยันของ modal ตั้งค่าคอลัมน์                                                                          | `'Apply'`                                                                     |
  | `confirmReset`                                                                                       | ข้อความถามยืนยันของปุ่ม Reset view (`resetButton`)                                                          | ข้อความอังกฤษ (ดู `thaiLabels` สำหรับไทย)                                     |
  | `toggleDescription`                                                                                  | ชื่อและ tooltip ของปุ่มซ่อน/แสดง `description`                                                              | `'Show or hide description'`                                                  |
  | `close`                                                                                              | aria-label ของปุ่มปิดกลมที่มุมขวาบนของ modal Settings                                                       | `'Close'`                                                                     |
  | `stripedRows`                                                                                        | ข้อความของสวิตช์ `stripedToggle`                                                                            | `'Striped rows'`                                                              |
  | `gridLines`                                                                                          | ข้อความของ select `gridLinesToggle`                                                                         | `'Grid lines'`                                                                |
  | `lineStyle`                                                                                          | ข้อความของ select `lineStyleToggle`                                                                         | `'Line style'`                                                                |
  | `lineStyleDefault` / `lineStyleSolid` / `lineStyleDashed` / `lineStyleDotted`                        | ข้อความของแต่ละประเภทใน select นั้น                                                                         | `'Default'` / `'Solid'` / `'Dashed'` / `'Dotted'`                             |
  | `gridLinesDefault` / `gridLinesHorizontal` / `gridLinesVertical` / `gridLinesBoth` / `gridLinesNone` | ข้อความของแต่ละโหมดใน select นั้น                                                                           | `'Default'` / `'Horizontal'` / `'Vertical'` / `'Both'` / `'None'`             |
  | `freezeColumns`                                                                                      | ข้อความของ select `freezeColumnsToggle`                                                                     | `'Frozen columns'`                                                            |
  | `freezeColumnsNone`                                                                                  | ข้อความของตัวเลือก 0 (ไม่ตรึง) ใน select นั้น (ตัวเลือกอื่นเป็นตัวเลข)                                      | `'None'`                                                                      |
  | `confirmOk`                                                                                          | ปุ่มยืนยันใน modal ของ Reset view                                                                           | `'Reset'`                                                                     |
  | `cancel`                                                                                             | ปุ่มยกเลิกใน modal ของ Reset view                                                                           | `'Cancel'`                                                                    |
  | `removeFilter`                                                                                       | ฟังก์ชัน `(text) => string` aria-label ของปุ่มลบบนชิปตัวกรอง (`filterSummary`)                              | `` `Remove filter ${text}` ``                                                 |
  | `filterSummary`                                                                                      | ฟังก์ชัน `(shown, total) => string` ข้อความจำนวนในแถบสรุป (`filterSummary`)                                 | `` `Found ${shown} of ${total}` ``                                            |
  | `columns`                                                                                            | aria-label และ tooltip ของปุ่ม Settings                                                                     | `'Columns'`                                                                   |
  | `searchButton`                                                                                       | ข้อความบนปุ่มค้นหา (`searchButton`)                                                                         | `'Search'`                                                                    |
  | `searchColumn`                                                                                       | `aria-label` ของ select เลือกคอลัมน์ค้นหา                                                                   | `'Search in'`                                                                 |
  | `allColumns`                                                                                         | ตัวเลือกแรกของ select (ค้นทุกคอลัมน์)                                                                       | `'All columns'`                                                               |
  | `allValues`                                                                                          | ตัวเลือกแรกของ select ค่า (ค้นคอลัมน์ enum)                                                                 | `'All'`                                                                       |
  | `dateFrom` / `dateTo`                                                                                | aria-label ของช่องวันที่ "ตั้งแต่" / "ถึง" (ค้นคอลัมน์วันที่)                                               | `'From'` / `'To'`                                                             |
  | `pageSize`                                                                                           | ป้ายของ select จำนวนแถวต่อหน้า                                                                              | `'Rows per page'`                                                             |
  | `summary`                                                                                            | `(from, to, total) => string`                                                                               | `Showing 1–10 of 25` (ว่าง: `Showing 0 of 0`)                                 |

ค่าในเซลล์จะถูก HTML-escape

ภาษาไทย: `import { SPGrid, thaiLabels } from '@siampiwat/spgrid'` แล้วส่ง `labels: thaiLabels` (แก้บางข้อความได้ด้วย
`labels: { ...thaiLabels, empty: '…' }`) การเรียงและการค้นหาใช้ locale `'th'` เป็นค่าเริ่มต้นอยู่แล้ว

### Columns

| ฟิลด์       | ชนิด                                                      | ความหมาย                                                                                                                  |
| ----------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `key`       | `string`                                                  | ฟิลด์ของแถวที่แสดง (ของ action column เป็นแค่ตัวระบุ)                                                                     |
| `label`     | `string`                                                  | ข้อความหัวคอลัมน์ (ค่าเริ่มต้น `key`; action column ค่าเริ่มต้นคือว่าง) ใส่ `\n` เพื่อขึ้นบรรทัดใหม่                      |
| `sortable`  | `boolean`                                                 | คลิกหัวเพื่อเรียง (action column เรียงไม่ได้เสมอ)                                                                         |
| `align`     | `'left'`, `'center'`, `'right'`                           | จัดชิดทั้งหัวและเซลล์                                                                                                     |
| `width`     | `string`                                                  | ความกว้างแบบ CSS เช่น `'80px'`, `'20%'` (ค่าที่มี `;` `:` หรือเครื่องหมายคำพูดถูกเมินเฉย)                                 |
| `ariaLabel` | `string`                                                  | `aria-label` ของ `<th>` ใช้กับคอลัมน์ที่ไม่มี label เพื่อไม่ให้ screen reader เจอหัวว่าง                                  |
| `render`    | `(value, row) => string`                                  | HTML ของเซลล์ (ดูคำเตือนด้านล่าง)                                                                                         |
| `type`      | `'text'`, `'badge'`, `'date'`, `'boolean'`, `'number'`    | รูปแบบเซลล์ (ค่าเริ่มต้น `'text'`) ดู [Column types](#column-types)                                                       |
| `format`    | `Intl.NumberFormatOptions` / `Intl.DateTimeFormatOptions` | ตัวเลือกจัดรูปแบบของ `number` / `date`                                                                                    |
| `badges`    | `Record<string, { tone?, icon?, label? }>`                | ลักษณะของ badge ตามค่า (ใช้กับ `type: 'badge'`)                                                                           |
| `options`   | `(string \| { value, label? })[]`                         | ทำให้เป็นคอลัมน์ **enum** (ค่าที่เป็นไปได้); คอลัมน์ `badge` ที่มี `badges` นับเป็น enum อัตโนมัติ ดู "ค้นหาคอลัมน์ enum" |
| `actions`   | `ActionDef[]`                                             | ทำให้เป็น action column                                                                                                   |

**Multi-line label:** แต่ละบรรทัดของ `label` ถูก escape แล้วคั่นด้วย `<br>` เช่น `'เลขที่ใบสั่งซื้อ\nPO Number'`

**`render` — ความปลอดภัย:** ค่าที่ `render` คืนถูกใส่เป็น HTML **โดยไม่ escape** ผู้เรียกต้อง escape ข้อมูลผู้ใช้ทุกชิ้นที่แทรกเข้าไปเอง
(ใช้ `escapeHtml` ที่ export จาก `spgrid`) ถ้าไม่ได้ตั้ง `render` ค่าเซลล์จะถูก `escapeHtml` ให้เสมอ ผลลัพธ์ `null`/`undefined` = เซลล์ว่าง

```js
import { SPGrid, escapeHtml } from '@siampiwat/spgrid';
{ key: 'po', render: (v) => `<a href="#" data-cell-action="open">${escapeHtml(v)}</a>` }
```

#### Column types

ตั้ง `type` ให้คอลัมน์ข้อมูลเพื่อให้เซลล์สวยและอ่านง่ายขึ้นโดยไม่ต้องเขียน `render` เอง ทุกแบบ escape ค่าให้เสมอ,
ค่าว่าง (`null`/`undefined`/`''`) แสดงเป็นขีดจาง `–`, และการเรียง/ค้นหา/`exportExcel()` ใช้ค่าดิบของแถว (ไม่ใช่ข้อความที่จัดรูปแบบ)
ถ้าตั้ง `render` จะใช้ `render` แทน `type`

| `type`      | แสดงเป็น                                                                                                                             | จัดชิดเริ่มต้น |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------- |
| `'badge'`   | ป้ายสีแคปซูลพร้อมจุดสี (หรือไอคอนถ้าตั้ง `icon`) สีและข้อความตาม `badges[ค่า]`; ค่าที่ไม่อยู่ใน `badges` เป็นสี `neutral`            | ซ้าย           |
| `'date'`    | `Date`, สตริง ISO หรือ timestamp จัดรูปแบบตาม `locale` ของ grid (ค่าเริ่มต้น `{ dateStyle: 'medium' }`) พร้อมไอคอนปฏิทิน ใน `<time>` | ซ้าย           |
| `'boolean'` | วงกลมติ๊กถูกสีเขียวสำหรับ `true` และกากบาทจางสำหรับ `false` (`aria-label` จาก `labels.yes` / `labels.no`)                            | กลาง           |
| `'number'`  | ตัวเลขจัดรูปแบบด้วย `Intl.NumberFormat` (`format` เช่น `{ style: 'currency', currency: 'THB' }`) ตัวเลขกว้างเท่ากัน                  | ขวา            |

`badges` คือ `{ [ค่า]: { tone?, icon?, label? } }` โดย `tone` เป็น `'success' | 'danger' | 'warning' | 'info' | 'neutral'`
(ค่าอื่นกลายเป็น `neutral`), `icon` คือ `IconName` และ `label` แทนข้อความที่แสดง สีปรับได้ด้วย `--spg-success`, `--spg-danger`,
`--spg-warning`, `--spg-info`, `--spg-neutral`

```js
{ key: 'status', type: 'badge', badges: { paid: { tone: 'success', icon: 'check' }, late: { tone: 'danger' } } },
{ key: 'due', type: 'date' },
{ key: 'total', type: 'number', format: { style: 'currency', currency: 'THB' } },
{ key: 'received', type: 'boolean' },
```

#### Action columns

`actions: ActionDef[]` ทำให้คอลัมน์แสดงปุ่มจริง `<button type="button" class="spg-action {className}" data-action="{name}">` ต่อหนึ่งแถว
(ค่าใน `row[key]` ถูกเมินเฉย) `ActionDef` คือ `{ name, label, icon?, showLabel?, className?, title?, visible?(row), disabled?(row) }`
(`label`, `title`, `className` ถูก escape) `icon` คือชื่อไอคอนในตัว (`IconName`, ดู [Icons](#icons)) ปุ่มที่มี `icon` เป็น **ปุ่มไอคอนล้วน** (`class="spg-action spg-action-icononly"`; ไอคอนเป็น `<span class="spg-icon spg-action-icon" aria-hidden="true">`) โดย `label` กลายเป็น `aria-label` และ tooltip (`title`; ถ้าตั้ง `title` ไว้จะใช้ค่านั้นเป็น tooltip แทน) ตั้ง `showLabel: true` เพื่อแสดงข้อความต่อท้ายไอคอนด้วย (ไม่มี aria-label/title อัตโนมัติ) ปุ่มที่ไม่มี `icon` ยังเป็นปุ่มข้อความตามเดิม และแทน SVG ได้ด้วย `options.icons`; ชื่อที่ไม่รู้จักถูกเมินเฉย; `visible(row) === false` = ไม่แสดงปุ่ม, `disabled(row) === true` = ใส่ `disabled`

- action column ไม่เรียงได้ (ไม่มี `tabindex`/`aria-sort`/ไอคอน), ไม่ถูกค้น และใช้ใน `columnFilters`/`setSort` ไม่ได้ (โยน `RangeError`)
- ใช้ listener `click` ตัวเดียวบนตาราง ไม่ซ้ำเมื่อ render ใหม่ และถูกถอดตอน `destroy()`; ปุ่มที่ `disabled` ไม่ยิง event
  `<button>` ทำงานกับ Enter/Space เองอยู่แล้ว
- แถวถูกหาจาก **แถวที่แสดงอยู่ปัจจุบัน** (หลังกรอง/เรียง/แบ่งหน้า) ได้ object แถวเดิม ไม่ใช่สำเนา

#### Events: `action` และ `cellClick`

- `on('action', ({ action, row, key, rowKey }) => …)` – กดปุ่ม action (`action` = `ActionDef.name`) หรือคลิก element ที่ `render()`
  ใส่ `data-cell-action="…"` ไว้ (`action` = ค่านั้น) `key` คือคอลัมน์ที่คลิก
- `on('cellClick', ({ key, row, rowKey, originalEvent }) => …)` – ยิงก่อน `action` เมื่อคลิก `[data-cell-action]` ส่ง `originalEvent` มาด้วย
  เพื่อให้ `preventDefault()` ลิงก์ `href="#"` ได้เอง (ไลบรารีไม่ทำให้)

ชนิด `ActionDef`, `ActionEventPayload`, `CellClickPayload`, `RowActivatePayload` และ `Column` export จาก `spgrid`

```js
new SPGrid(el, {
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

ปุ่มเป็นแบบ tonal: พื้นอ่อนและขอบจากโทนสีเดียว ตัวอักษรเป็นสีโทนนั้น (อ่านชัดทั้งโหมดสว่าง/มืด) ค่าเริ่มต้นเป็นโทนเทา (`--spg-neutral`) ทุกปุ่มจึงเป็นพื้นเทาสีเดียวกัน
เลือกโทนด้วย class ใน `className`: `spg-action-danger` (แดง), `spg-action-success` (เขียว), `spg-action-neutral` (เทา), `spg-action-warning` (ส้ม/เหลือง จาก `--spg-warning`) หรือตั้ง `--spg-action-tone`
ถ้าต้องการปุ่มสีทึบ ให้เพิ่ม class `spg-action-solid` คู่กับคลาสโทน เช่น `className: 'spg-action-warning spg-action-solid'` ปุ่มจะเต็มสีโทน ตัวอักษรขาว (โหมดมืดใช้ตัวอักษรเข้ม `#0b1220` เพราะโทนมืดเป็นสีสว่าง) และเข้มขึ้นเล็กน้อยเมื่อ hover ยังตั้ง `--spg-action-bg` / `--spg-action-color` / `--spg-action-hover-bg` ทับได้เหมือนเดิม (`.spg-action-solid` มี specificity เป็นศูนย์)

ตัวแปร CSS: `--spg-action-tone`, `--spg-action-bg`, `--spg-action-color`, `--spg-action-hover-bg`, `--spg-action-radius`, `--spg-action-padding`, `--spg-danger`, `--spg-success`, `--spg-warning`, `--spg-neutral` (ดูตารางด้านล่าง)
ตั้งบน `.spg-root` หรือบนปุ่มผ่าน `className` ของคุณ (`.spg-action` มี specificity เป็นศูนย์ จึงถูกทับด้วย class ของคุณได้ง่าย)

### Row activation

ตั้ง `onRowActivate` เพื่อให้ผู้ใช้ "เปิด" แถวได้โดยไม่ต้องกดปุ่มในแถว (เช่น ดูรายละเอียด):

- ดับเบิลคลิกที่แถว หรือกด **Enter** ขณะที่แถวมีโฟกัส (ไม่ใช่ปุ่มในแถว) → ยิง `rowActivate` ด้วย `{ row, rowKey, originalEvent }`
  (`row` เป็น object เดิม หาจากแถวที่แสดงอยู่หลังกรอง/เรียง/แบ่งหน้า; `originalEvent` เป็น `MouseEvent` หรือ `KeyboardEvent`)
- เมื่อตั้ง option นี้ทุก `<tr>` ในตัวตารางจะมี `tabindex="0"` และ class `spg-activatable` (เคอร์เซอร์เป็นมือชี้ และมีกรอบโฟกัส `:focus-visible`)
  ถ้าไม่ตั้ง แถวจะไม่ interactive และไม่ยิง event
- ปุ่ม ลิงก์ และ form control ในแถว (รวม `[data-action]`/`[data-cell-action]`) ทำงานของตัวเองตามเดิม ดับเบิลคลิกที่ตัวเหล่านั้นไม่ยิง `rowActivate`
  ส่วนหัวตารางและแถว "ไม่มีข้อมูล" ไม่ยิง event; ดับเบิลคลิกจะล้างข้อความที่ถูกเลือกจากการดับเบิลคลิก
- ติดตามเพิ่มได้ด้วย `on('rowActivate', fn)` (คืนฟังก์ชัน unsubscribe); listener ถูกถอดตอน `destroy()`

```js
new SPGrid(el, {
  rowKey: 'id',
  columns,
  rows,
  onRowActivate: ({ row }) => openDetails(row),
});
```

### Grid lines

`gridLines` กำหนดเส้นที่ตารางวาด โดยใส่ class บน `.spg-root`:

| โหมด           | เส้นที่เห็น                                               | class บน `.spg-root`   |
| -------------- | --------------------------------------------------------- | ---------------------- |
| `'default'`    | เส้นแถวตามธีม (ใต้หัวตาราง และระหว่างแถว)                 | (ไม่มี)                |
| `'horizontal'` | เส้นแถวเท่านั้น (หน้าตาเหมือน `'default'` แต่เลือกชัดเจน) | `spg-lines-horizontal` |
| `'vertical'`   | เส้นแนวตั้งระหว่างคอลัมน์เท่านั้น (ไม่มีเส้นใต้หัวตาราง)  | `spg-lines-vertical`   |
| `'both'`       | เส้นรอบทุกเซลล์ (เหมือน `bordered: true`)                 | `spg-bordered`         |
| `'none'`       | ไม่มีเส้นเลย (ไม่มีเส้นใต้หัวตารางด้วย)                   | `spg-lines-none`       |

- ชนิด `GridLines` และ `LineStyle` export จาก `spgrid` สีเส้นใช้ `--spg-border-color`
- **ประเภทเส้น** (`lineStyle`): `'solid'` (เส้นทึบ) `'dashed'` (เส้นประ) `'dotted'` (เส้นจุด) ใส่ class `spg-line-solid` / `spg-line-dashed` / `spg-line-dotted`
  บน `.spg-root` ซึ่งตั้งค่า `--spgi-line-style` ของเส้นแถวและเส้นแนวตั้งทั้งหมด; `'default'` ไม่ใส่ class ปล่อยให้ธีมตัดสิน (`--spg-line-style`, ค่าเริ่มต้น `dashed`)
  เส้นใต้หัวตารางเป็นเส้นทึบเสมอ ใช้ร่วมกับโหมดข้างบนได้ทุกโหมด
- ตั้ง `lineStyleToggle: true` เพื่อให้ผู้ใช้เลือกประเภทเส้นใน modal Settings และ `lineStyleStorageKey` เพื่อจำตัวเลือก
  ข้อความมาจาก `labels.lineStyle` และ `labels.lineStyleDefault` / `lineStyleSolid` / `lineStyleDashed` / `lineStyleDotted` (มีภาษาไทยใน `thaiLabels`)
- ตั้ง `gridLinesToggle: true` เพื่อให้ผู้ใช้เลือกโหมดใน modal Settings และ `gridLinesStorageKey` เพื่อจำตัวเลือก
  ข้อความของ select มาจาก `labels.gridLines` และ `labels.gridLinesDefault` / `gridLinesHorizontal` / `gridLinesVertical` / `gridLinesBoth` / `gridLinesNone`
  (มีภาษาไทยใน `thaiLabels`)

```js
new SPGrid(el, {
  columns,
  rows,
  gridLines: 'horizontal',
  gridLinesToggle: true,
  gridLinesStorageKey: 'orders',
  lineStyle: 'solid',
  lineStyleToggle: true,
  lineStyleStorageKey: 'orders',
});
```

### Freeze columns

`freezeColumns: n` ตรึง `n` คอลัมน์แรก (นับจากซ้ายสุดของคอลัมน์ที่แสดงอยู่ ตามลำดับที่แสดง รวมคอลัมน์ action) ให้อยู่กับที่เมื่อเลื่อนตารางไปทางข้าง

- เซลล์หัวและเซลล์ในแถวของคอลัมน์ที่ตรึงได้ class `spg-frozen` และ `position: sticky` โดยระยะจากขอบเริ่มต้นคือผลรวมความกว้างของคอลัมน์ก่อนหน้า (ตั้งผ่าน CSSOM เป็น `--spgi-freeze-start`) คอลัมน์ที่ตรึงสุดท้ายได้ `spg-frozen-last` เพื่อวาดเส้นขอบด้านขวา แถวหัวกลุ่มของ `groupBy` ไม่ถูกตรึง
- ระยะคำนวณใหม่ทุกครั้งที่ตารางวาดใหม่ เปลี่ยนความกว้างคอลัมน์ (`resizableColumns`) หรือขนาดตารางเปลี่ยน (ถ้าเบราว์เซอร์มี `ResizeObserver`)
- พื้นที่ตารางต้องเลื่อนไปทางข้างได้เอง: `.spg-table-wrap` เป็น `overflow: clip` ตามค่าเริ่มต้น ให้ตั้ง `maxHeight` (พื้นที่จะเลื่อนได้) หรือกำหนด `overflow-x: auto` ให้ `.spg-table-wrap`
- ใส่ได้ไม่เกินจำนวนคอลัมน์ลบ 1: ค่าที่มากกว่านั้นถูกลดลง เพราะต้องเหลือคอลัมน์ที่เลื่อนได้อย่างน้อยหนึ่งคอลัมน์
- ตั้ง `freezeColumnsToggle: true` เพื่อให้ผู้ใช้เลือกจำนวนใน modal Settings (ตัวเลือก 0 ถึงจำนวนคอลัมน์ลบ 1) และ `freezeColumnsStorageKey` เพื่อจำตัวเลือก
  ข้อความมาจาก `labels.freezeColumns` และ `labels.freezeColumnsNone` (มีภาษาไทยใน `thaiLabels`)

```js
new SPGrid(el, {
  columns,
  rows,
  maxHeight: 400,
  freezeColumns: 1,
  freezeColumnsToggle: true,
  freezeColumnsStorageKey: 'orders',
});
```

### Row grouping

`groupBy` จัดแถวเป็นกลุ่มตามค่าของคอลัมน์ (หลายชั้นได้) โดยแต่ละกลุ่มมีแถวหัวกลุ่มเต็มความกว้าง (`<tr class="spg-group-row">`) ก่อนแถวของกลุ่ม ในแถวหัวมีปุ่ม (`.spg-group-toggle`, `aria-expanded`) ที่ยุบ/ขยายกลุ่ม ชั้นในจะเยื้องตามระดับ (`--spg-group-level`)

```js
new SPGrid(el, {
  columns,
  rows,
  groupBy: ['department', 'status'], // แผนก → สถานะ
  groupByToggle: true, // ให้ผู้ใช้เลือกใน modal Settings
  groupByStorageKey: 'projects',
});
grid.setGroupBy(['status']);
grid.getGroupBy(); // ['status']
```

- ค่าในหัวกลุ่มแสดงแบบเดียวกับเซลล์ของคอลัมน์นั้น (คอลัมน์ `badge` แสดงเป็น badge, `date` จัดรูปแบบตาม locale, `render` ของคอลัมน์ก็ถูกใช้) ตามด้วยจำนวนแถวของกลุ่ม **ที่อยู่ในหน้านั้น** `(3)`
- ลำดับ: จัดกลุ่มตามคอลัมน์ชั้นนอกก่อน (น้อยไปมาก; ค่าว่างอยู่ท้าย) แล้วชั้นในต่อ ภายในกลุ่มแถวเรียงตาม `sort` ถ้า `sort` อยู่บนคอลัมน์ที่จัดกลุ่ม ลำดับของกลุ่มจะตามทิศทางของ `sort`
- การจัดกลุ่มทำก่อนแบ่งหน้า (filter → sort → group → paginate) จึงมีกลุ่มที่คร่อมหลายหน้าได้ โดยหัวกลุ่มจะถูกวาดซ้ำที่ต้นหน้าถัดไป การส่งออก Excel ใช้ลำดับที่จัดกลุ่มแล้ว (ไม่มีแถวหัวกลุ่ม)
- คอลัมน์ที่จัดกลุ่มซ่อนได้ (จัดกลุ่มตามคอลัมน์ที่ซ่อนอยู่ได้) การค้นหาไม่ไฮไลต์ในแถวหัวกลุ่ม
- กลุ่มที่ยุบไว้ยังคงยุบเมื่อข้อมูลหรือหน้าเปลี่ยน (จำไว้ในหน่วยความจำ ไม่บันทึกลง `localStorage`) ยุบกลุ่มชั้นนอกจะซ่อนกลุ่มชั้นในด้วย
- modal Settings แสดง select ชั้นละหนึ่งตัว (อย่างน้อย 2 ชั้น หรือเท่าจำนวนที่ตั้งจากโค้ด) ชั้นถัดไปใช้ไม่ได้จนกว่าจะเลือกชั้นก่อนหน้า และเลือกคอลัมน์เดียวกันซ้ำไม่ได้
- `resetView()` กลับเป็น `options.groupBy`

### Sorting

คอลัมน์ที่ตั้ง `sortable: true` จะคลิกที่หัวคอลัมน์ (หรือกด Enter / Space เมื่อโฟกัสอยู่) เพื่อวนลำดับ
`asc` → `desc` → ไม่เรียง ได้ เรียงได้ครั้งละหนึ่งคอลัมน์ ลำดับเดิมของ `rows` ไม่ถูกแก้ไข

- ตัวเลข เปรียบเทียบเชิงตัวเลข; `Date` เทียบด้วย `getTime()`; boolean เรียง `false` < `true`;
  สตริงใช้ `Intl.Collator` แบบ numeric
- `null`, `undefined`, `NaN` (และ `Date` ที่ไม่ถูกต้อง) อยู่ท้ายสุดทั้ง asc และ desc
- `<th>` ที่เรียงได้มี `tabindex="0"`; คอลัมน์ที่ใช้เรียงอยู่มี `aria-sort="ascending|descending"`
- ตัวบ่งชี้ลูกศรวาดด้วย CSS `::after` ปรับสีได้ด้วย `--spg-sort-indicator-color`
  (และ `--spg-focus-color`, `--spg-sort-hover-bg`)

ตัวแปร CSS อื่น: `--spg-toolbar-gap`, `--spg-input-border`, `--spg-input-radius`, `--spg-empty-color` (ดู [Theming](#theming))

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

### Input Group

ส่วนค้นหาเป็น Input Group เดียว `<div class="spg-input-group">` เรียงจากซ้าย: select เลือกคอลัมน์ (ถ้าเปิด `searchColumnSelect`), ช่องค้นหา, ปุ่ม Search และปุ่ม Clear search (ถ้าเปิด `searchButton`) ปุ่ม Refresh (`refreshButton`), ปุ่ม Reset view (`resetButton`), ปุ่ม Export (`exportButton`) และปุ่มเลือกคอลัมน์ (`columnPicker`) ตามลำดับนี้ (เฉพาะที่เปิด) เชื่อมขอบติดกัน โค้งเฉพาะมุมนอก ส่วนที่ไม่ได้เปิดจะไม่ถูกเรนเดอร์ (ถ้าไม่เปิดอะไรเลยจะเหลือแค่ช่องค้นหา)
เมื่อ container กว้างไม่เกิน 520px ช่องค้นหาจะขึ้นบรรทัดของตัวเองและส่วนที่เหลือเรียงต่อด้านล่าง โดยแต่ละส่วนมีมุมโค้งครบ
ลำดับ Tab ตามลำดับที่เห็น

_ตำแหน่ง:_ แถบกรองชิดขอบขวา (ขอบท้ายของบรรทัด) ของตาราง; ในจอแคบที่กลุ่มเต็มความกว้างจึงไม่เห็นความต่าง

_ดีไซน์ของแถบกรอง:_ select เป็น addon สีอ่อนมีลูกศรของตัวเอง ช่องค้นหามี placeholder (ข้อความจาก `labels.search`) และไอคอนที่เปลี่ยนเป็นสี focus เมื่อพิมพ์ กลุ่มทั้งแถบมีเงาเรืองรอบนอกเมื่อส่วนใดส่วนหนึ่งมี focus (focus ring ของแต่ละส่วนอยู่ด้านในไม่ถูกเพื่อนบ้านบัง)

### Search button

ตั้ง `searchButton: true` (คู่กับ `searchable`) ให้การค้นหาเป็นแบบกดปุ่ม

- มีปุ่ม `<button type="button" class="spg-search-submit">` (ไอคอน `search` อย่างเดียว ไม่มีข้อความ; ชื่อสำหรับ screen reader และ tooltip มาจาก `labels.searchButton`; สีทึบตาม `--spg-accent`) ข้างช่องค้นหา
- พิมพ์ในช่องจะไม่กรอง (ไม่มี debounce) กรองเมื่อคลิกปุ่มหรือกด Enter ในช่อง (ไม่นับ Enter ที่ใช้ยืนยันตัวอักษรของ IME)
- ส่งข้อความว่างเท่ากับล้างตัวกรอง; ปุ่มล้าง (`close`) ยังล้างทันที; select เลือกคอลัมน์ยังกรองใหม่ทันที
- มีปุ่มรอง `<button type="button" class="spg-search-reset">` ไอคอน `close` อย่างเดียว ไม่มีข้อความ; ชื่อและ tooltip มาจาก `labels.clear` ("Clear search" / "ล้างการค้นหา") สีเทา tonal ต่อจากปุ่มค้นหา กดแล้วล้างช่อง ล้างตัวกรองทันที และคืน focus ให้ช่อง (ไม่รีเซ็ตคอลัมน์ที่เลือก)
- `filterChange` ยิงครั้งเดียวต่อการค้นหาที่ทำให้ตัวกรองเปลี่ยน
- `setFilter()` ยังเขียนข้อความลงช่องและกรองทันทีเหมือนเดิม

### Search column

ตั้ง `searchColumnSelect: true` (คู่กับ `searchable`) เพื่อให้ผู้ใช้เลือกคอลัมน์ที่จะค้นได้

- `<select class="spg-search-column">` อยู่ข้างช่องค้นหา ตัวเลือกแรกคือ `labels.allColumns` (ค้นทุกคอลัมน์) ตามด้วยคอลัมน์ข้อมูลที่แสดงอยู่ (ไม่รวมคอลัมน์ action และคอลัมน์ที่ซ่อนด้วย `columnPicker` / `hiddenColumns`; ตัวเลือกของคอลัมน์ที่ซ่อนถูกซ่อนและ disable) การค้นทุกคอลัมน์จึงค้นเฉพาะคอลัมน์ที่แสดงอยู่ และถ้าซ่อนคอลัมน์ที่เลือกค้นอยู่ ตัวเลือกจะกลับไปเป็นทุกคอลัมน์ ใช้ `label` ของหัวตาราง (หัวหลายบรรทัดแสดงเป็นบรรทัดเดียวคั่นด้วย `/`)

### ค้นหาคอลัมน์ enum

คอลัมน์ที่มี `options` (หรือเป็น `badge` ที่มี `badges`) ถือเป็น enum เมื่อผู้ใช้เลือกคอลัมน์นั้นใน `spg-search-column` ช่องข้อความ (`.spg-search`) จะถูกซ่อนและแทนด้วย `<select class="spg-search-value">` (ตัวเลือกแรก = `labels.allValues`, ที่เหลือคือค่าของคอลัมน์ ข้อความมาจาก `label` ของ option / `badges[ค่า].label` ไม่ก็ตัวค่าเอง และ escape แล้ว) เลือกค่าแล้วกรองทันที (ไม่รอปุ่ม Search) โดย **เทียบทั้งค่าในเซลล์** แบบไม่สนตัวพิมพ์ ไม่ใช่ substring จึงไม่เก็บ "Not Approved" เมื่อเลือก "Approved" ช่องข้อความที่ซ่อนอยู่ยังเก็บค่าค้นหา ทำให้ `getFilter()`, `setFilter()`, chip และปุ่มล้างทำงานเหมือนเดิม เมื่อสลับระหว่างคอลัมน์ enum กับคอลัมน์ธรรมดา (หรือทุกคอลัมน์) คำค้นเดิมจะถูกล้าง

- เลือกแล้วกรองใหม่ทันทีด้วยข้อความที่พิมพ์ไว้ และกลับไปหน้า 1; ค่าที่เลือกคงอยู่แม้ล้างข้อความค้นหา
- `getFilter()` และ `filterChange` มี `searchColumn` เมื่อมีข้อความค้นหาและเลือกคอลัมน์ไว้ (เปลี่ยนคอลัมน์ขณะมีข้อความค้นหาจะยิง `filterChange` หนึ่งครั้ง; ถ้ายังไม่มีข้อความค้นหาจะไม่ยิง)
- ใช้ผ่าน API ได้โดยไม่ต้องมี select: `setSearchColumn(key | null)` / `getSearchColumn()`

`FilterState` คือ `{ search?: string, columnFilters?: Record<string, string>, searchColumn?: string }` (`searchColumn` มีเฉพาะในค่าที่คืนจาก `getFilter()` / `filterChange`)
(`columnFilters` กรองตามคอลัมน์ แบบ AND; ยังไม่มี UI ให้ใช้ ต้องเรียกผ่าน `setFilter`)

### ค้นหาคอลัมน์วันที่ (from / to)

คอลัมน์ `type: 'date'` (ที่ไม่มี `options`) เมื่อถูกเลือกเป็นคอลัมน์ค้นหา ช่องข้อความจะถูกซ่อนและแทนด้วยช่อง `<input type="date">` สองช่อง (`.spg-date-from` / `.spg-date-to` ใน `.spg-search-range`; aria-label จาก `labels.dateFrom` / `labels.dateTo`) กรองทันทีเมื่อเลือกวันที่ จะใส่ช่องเดียวก็ได้ (ตั้งแต่วันนั้นเป็นต้นไป หรือถึงวันนั้น) ขอบเขตรวมวันที่เลือกทั้งสองด้าน เทียบเป็น **วัน** ตามที่เซลล์แสดง: สตริง `YYYY-MM-DD` คือวันนั้นตรง ๆ ส่วน `Date`, ISO ที่มีเวลา และ timestamp คือวันตามเขตเวลาของผู้ใช้ ค่าว่างหรืออ่านไม่ได้ไม่ตรงเงื่อนไข ค่าค้นหาที่เก็บใน `getFilter().search` เป็นสตริง `FROM..TO` (เช่น `2026-10-01..2026-10-15` หรือ `2026-10-01..`) ซึ่ง `setFilter()` รับในรูปแบบนี้ได้ (เมื่อ `searchColumn` เป็นคอลัมน์วันที่) chip ใน `filterSummary` แสดงเป็น `FROM – TO` และเซลล์ที่ตรงถูกไฮไลต์ทั้งเซลล์ เหมือนคอลัมน์ enum การสลับชนิดของคอลัมน์ค้นหาจะล้างคำค้นเดิม

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
- ดีไซน์ footer: pager เป็น pill แบบ segmented (ปุ่มไม่มีขอบบนพื้นสีอ่อน หน้าปัจจุบันเป็นชิปสี accent ทึบ) และ select จำนวนแถวต่อหน้าสไตล์เดียวกับ select ในแถบกรอง; `--spg-pager-border` / `--spg-pager-bg` ค่าเริ่มต้นเป็นโปร่งใส
- ตัวแปร CSS: `--spg-pager-gap`, `--spg-pager-border`, `--spg-pager-bg`, `--spg-pager-active-bg`,
  `--spg-pager-active-color`, `--spg-pager-muted-color`, `--spg-pager-disabled-opacity`

### Icons

ไอคอนเป็น inline SVG ในตัว (Google Material Symbols แบบ outlined, weight 400, 24px; Apache-2.0 ดู `NOTICE`)
ไม่มี icon font และไม่เรียกเครือข่ายตอนรัน แต่ละอันมี `viewBox="0 -960 960 960"`, `fill="currentColor"`,
`aria-hidden="true"`, `focusable="false"`, ขนาด `1em` และห่อด้วย
`<span class="spg-icon" data-icon="ชื่อ" aria-hidden="true">`

| `IconName`                                            | ใช้ที่                                        |
| ----------------------------------------------------- | --------------------------------------------- |
| `arrow_upward`                                        | หัวคอลัมน์ที่เรียง asc                        |
| `arrow_downward`                                      | หัวคอลัมน์ที่เรียง desc                       |
| `unfold_more`                                         | คอลัมน์ที่เรียงได้แต่ยังไม่เรียง (hint)       |
| `first_page` / `last_page`                            | ปุ่มหน้าแรก / หน้าสุดท้าย                     |
| `chevron_left` / `chevron_right`                      | ปุ่มก่อนหน้า / ถัดไป                          |
| `search`                                              | นำหน้าช่องค้นหา                               |
| `close`                                               | ปุ่มล้างช่องค้นหา                             |
| `inbox`                                               | สถานะไม่มีข้อมูล                              |
| `view_column`                                         | (ไม่ได้ใช้แล้ว; ยังคงไว้เพื่อความเข้ากันได้)  |
| `settings`                                            | ปุ่ม Settings (`columnPicker`)                |
| `refresh` / `restart_alt`                             | ปุ่ม Refresh / (Reset view ไม่มีไอคอนแล้ว)    |
| `stripes`                                             | (ไม่ได้ใช้แล้ว) แถวสลับสี (`stripedToggle`)   |
| `wrap_text`                                           | (ไม่ได้ใช้แล้ว) ตัดข้อความ (`textWrapToggle`) |
| `visibility` / `edit` / `delete` / `cancel` / `check` | ไอคอนของปุ่ม action (`ActionDef.icon`)        |

`options.icons` แทนไอคอนแต่ละอันด้วยสตริง SVG ของคุณ (ชื่อที่ไม่รู้จักหรือค่าที่ไม่ใช่สตริงถูกเมินเฉย)
**สตริงนี้ถูกใส่เป็น HTML โดยไม่ escape — ผู้เรียกต้องไว้ใจได้ ห้ามใส่ข้อมูลผู้ใช้** ไอคอนของไลบรารีไม่เคยมีข้อมูลผู้ใช้ปนอยู่:
ข้อความทั้งหมด (label, ค่าเซลล์) ถูก escape และอยู่นอกไอคอน ชนิด `IconName` export จาก `spgrid`

```js
new SPGrid(el, { columns, icons: { search: '<svg viewBox="0 0 24 24">…</svg>' } });
```

### Theming

ตารางห่อด้วย `.spg-root` ตั้งธีมผ่านตัวแปร `--spg-*` บน `.spg-root` หรือ element บรรพบุรุษใดก็ได้
ค่าเริ่มต้นเป็นโทนสว่าง และเปลี่ยนเป็นโทนมืดเมื่อ `prefers-color-scheme: dark` หรือมี `data-theme="dark"` บน element บรรพบุรุษ
(`data-theme="light"` บังคับโทนสว่างแม้ OS เป็นโหมดมืด) ถ้าตั้งตัวแปรเอง ค่านั้นใช้ทั้งสองโทน
ให้กำหนดแยกใต้ `[data-theme="dark"]` ถ้าต้องการให้ต่างกัน

- รองรับ `forced-colors` (Windows High Contrast) และ `prefers-reduced-motion` (ปิด transition); transition ทั้งหมด ≤ 150ms
- อุปกรณ์สัมผัส (`pointer: coarse`): ปุ่ม pager และปุ่มล้างสูงอย่างน้อย 44px
- คอนเทนเนอร์กว้าง ≤ 600px: pager ซ้อนเป็นแนวตั้ง
- line-height เริ่มต้น 1.6 เพื่อไม่ให้สระ/วรรณยุกต์ไทยถูกตัด

| ตัวแปร                                                                                                                                                                    | ความหมาย                                                                              | สว่าง / มืด                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `--spg-bg`                                                                                                                                                                | พื้นหลังตาราง/ช่อง                                                                    | `#fff` / `#111827`                                                         |
| `--spg-color`                                                                                                                                                             | สีข้อความ                                                                             | `#1f2937` / `#e5e7eb`                                                      |
| `--spg-muted-color`                                                                                                                                                       | ข้อความรอง, ไอคอน                                                                     | `#4b5563` / `#9ca3af`                                                      |
| `--spg-border-color`                                                                                                                                                      | เส้นคั่นแถว, กรอบตาราง                                                                | `#e5e7eb` / `#374151`                                                      |
| `--spg-input-border`                                                                                                                                                      | ขอบช่องค้นหา, ปุ่ม, select, เส้นใต้หัวตาราง                                           | `#6b7280`                                                                  |
| `--spg-header-bg-image`                                                                                                                                                   | รูป/gradient ซ้อนบนพื้นหัวตาราง (`background-image` ของ `th`; ไม่กระทบ sticky header) | `none`                                                                     |
| `--spg-header-bg` / `--spg-header-color`                                                                                                                                  | หัวตาราง                                                                              | `#f9fafb` `#111827` / `#172033` `#f9fafb`                                  |
| `--spg-row-hover-bg`                                                                                                                                                      | แถวเมื่อ hover                                                                        | `#f9fafb` / `#172033`                                                      |
| `--spg-stripe-bg`                                                                                                                                                         | แถวคู่เมื่อ `striped`                                                                 | `#fcfcfd` / `#131b2b`                                                      |
| `--spg-sort-hover-bg`                                                                                                                                                     | หัวคอลัมน์/ปุ่มเมื่อ hover                                                            | `#f3f4f6` / `#1f2937`                                                      |
| `--spg-accent` / `--spg-accent-contrast`                                                                                                                                  | หน้าปัจจุบัน                                                                          | `#1d4ed8` `#fff` / `#60a5fa` `#0b1220`                                     |
| `--spg-focus-color`                                                                                                                                                       | วงโฟกัส                                                                               | `#1d4ed8` / `#93c5fd`                                                      |
| `--spg-sort-indicator-color`                                                                                                                                              | ไอคอนเรียง                                                                            | ตาม `--spg-muted-color`                                                    |
| `--spg-empty-color`                                                                                                                                                       | ข้อความไม่มีข้อมูล                                                                    | ตาม `--spg-muted-color`                                                    |
| `--spg-radius` / `--spg-input-radius`                                                                                                                                     | มุมโค้งตาราง / ช่องและปุ่ม                                                            | `8px` / `6px`                                                              |
| `--spg-cell-padding-y` / `--spg-cell-padding-x`                                                                                                                           | ระยะในเซลล์                                                                           | `12px` / `16px`                                                            |
| `--spg-cell-padding-y-compact` / `--spg-cell-padding-x-compact`                                                                                                           | ระยะในเซลล์เมื่อ `density: 'compact'`                                                 | `6px` / `12px`                                                             |
| `--spg-action-tone`                                                                                                                                                       | โทนสีของปุ่ม action (พื้นอ่อน ขอบ และตัวอักษร)                                        | `--spg-neutral`                                                            |
| `--spg-danger` / `--spg-success` / `--spg-neutral`                                                                                                                        | โทนของ `spg-action-danger` / `-success` / `-neutral`                                  | `#b91c1c` / `#15803d` / `#374151` (มืด: `#f87171` / `#4ade80` / `#d1d5db`) |
| `--spg-action-bg` / `--spg-action-color` / `--spg-action-hover-bg`                                                                                                        | ปุ่ม action: พื้นหลัง / สี                                                            | `--spg-accent` / `--spg-accent-contrast`                                   |
| `--spg-line-style`                                                                                                                                                        | ลักษณะเส้นแถว/เส้นระหว่างเซลล์ภายในตาราง                                              | `dashed`                                                                   |
| `--spg-action-radius` / `--spg-action-padding`                                                                                                                            | ปุ่ม action: มุมโค้ง / ระยะใน                                                         | `6px` / `0.3em 0.95em`                                                     |
| `--spg-control-height`                                                                                                                                                    | ความสูงของช่องค้นหา select และปุ่มใน toolbar                                          | `2.25em`                                                                   |
| `--spg-toolbar-gap`                                                                                                                                                       | ระยะห่างแถบค้นหา/pager                                                                | `12px`                                                                     |
| `--spg-font-family` / `--spg-font-size` / `--spg-line-height`                                                                                                             | ตัวอักษร                                                                              | system-ui + ฟอนต์ไทยของระบบ / `14px` / `1.6`                               |
| `--spg-pager-gap`, `--spg-pager-border`, `--spg-pager-bg`, `--spg-pager-active-bg`, `--spg-pager-active-color`, `--spg-pager-muted-color`, `--spg-pager-disabled-opacity` | pager (ชื่อเดิม)                                                                      | ตามธีม / `0.5`                                                             |

ค่าเริ่มต้นผ่านเกณฑ์ contrast: ข้อความ ≥ 4.5:1, ไอคอนและขอบของ control ≥ 3:1 (เส้นคั่นแถวเป็นเส้นตกแต่ง)
`--spg-input-radius`, `--spg-toolbar-gap`, `--spg-focus-color` และ `--spg-sort-indicator-color` มีค่าเริ่มต้นใหม่
`npm run test:e2e` เก็บภาพหน้าตัวอย่างไว้ที่ `test-results/visual/` สำหรับตรวจด้วยตา

#### ธีม Lavender

ธีมสีม่วงอ่อน (ไม่เปิดเอง; ตารางที่ไม่ใช้ธีมหน้าตาเหมือนเดิม) เปิดด้วยการใส่ class `spg-theme-lavender` หรือ `data-spg-theme="lavender"` ที่ `.spg-root` หรือ element ที่ครอบอยู่ (เช่น container ที่ส่งให้ `new SPGrid()`) ธีมนี้ตั้งเฉพาะตัวแปร `--spg-*` (หัวตารางไล่เฉด `linear-gradient(#fff, #ece7f7)` ผ่าน `--spg-header-bg-image`, แถวสลับ `#f6f3fc`, เส้นขอบ `#d9d2ee`, accent `#7c5cbf`, `--spg-radius: 4px`, `--spg-warning: #c2410c`) และมีชุดโทนมืดตาม `prefers-color-scheme` / `[data-theme="dark"]` (`[data-theme="light"]` บังคับโทนสว่าง) ในธีมนี้ตัวอักษรหัวตารางใช้ `--spg-header-color` (ธีมเริ่มต้นใช้สีรอง) ตัวแปรที่ตั้งใกล้ตารางกว่า ยังทับค่าของธีมได้ ดูตัวอย่างที่ `theme-lavender.html`

```js
container.classList.add('spg-theme-lavender');
new SPGrid(container, { columns, rows, striped: true, gridLines: 'both' });
```

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
- `getSearchColumn()` – คอลัมน์ที่จำกัดการค้นหา หรือ `null` = ทุกคอลัมน์
- `setSearchColumn(key)` – จำกัดการค้นหาให้คอลัมน์ `key` (หรือ `null` เพื่อค้นทุกคอลัมน์) ย้าย select ตาม และกลับหน้า 1; โยน `RangeError` ถ้า `key` ไม่ใช่คอลัมน์ข้อมูล
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
- `resetView()` – กลับสู่มุมมองเริ่มต้น: ล้างข้อความค้นหาและตัวกรอง (รวมช่องค้นหา), ค้นทุกคอลัมน์, การเรียงกลับเป็น `options.defaultSort` (ไม่เรียงถ้าไม่ได้ตั้งไว้), คอลัมน์ที่ซ่อนกลับเป็น `options.hiddenColumns`, การจัดกลุ่มกลับเป็น `options.groupBy`, ลำดับคอลัมน์กลับเป็นลำดับของ `options.columns`, จำนวนแถวต่อหน้ากลับเป็น `options.pageSize` (ปิดการแบ่งหน้าถ้าไม่ได้ตั้งไว้) และหน้า 1 แต่ละส่วนที่เปลี่ยนยิง event ของตัวเอง (`sortChange`, `filterChange`, `columnsChange`, `columnOrderChange`, `groupByChange`, `pageChange`) ไม่ยิงถ้าไม่มีอะไรเปลี่ยน ค่าที่บันทึกไว้ด้วย `columnStorageKey` / `columnOrderStorageKey` / `pageSizeStorageKey` / `sortStorageKey` / `groupByStorageKey` จะถูกเขียนทับด้วยค่าเริ่มต้นนี้
- `on('refresh', fn)` – รับเหตุการณ์เมื่อกดปุ่ม Refresh (ไม่มี payload) คืนฟังก์ชัน unsubscribe
- `getHiddenColumns()` – key ของคอลัมน์ที่ซ่อนอยู่ เรียงตามลำดับคอลัมน์ (สำเนา)
- `setHiddenColumns(keys)` – ซ่อน **เฉพาะ** คอลัมน์ข้อมูลใน `keys` (ที่เหลือแสดง) อัปเดตแผงเลือกคอลัมน์ และบันทึกถ้ามี `columnStorageKey`; โยน `RangeError` ถ้า key ไม่ใช่คอลัมน์ข้อมูล (รวมคอลัมน์ action) หรือซ่อนครบทุกคอลัมน์ คอลัมน์ที่ซ่อนจะไม่ถูกค้นหา (ทั้งการค้นทุกคอลัมน์และตัวเลือกใน `searchColumnSelect`) และ `exportExcel()` ส่งออกแถวชุดเดียวกับที่กริดแสดง แต่ยังเรียงด้วยคอลัมน์นั้นได้และอยู่ในไฟล์ที่ส่งออก
- `getColumnOrder()` – key ของทุกคอลัมน์ (รวมคอลัมน์ action) ตามลำดับที่แสดง
- `getGroupBy()` – key ของคอลัมน์ที่จัดกลุ่มแถว ชั้นนอกสุดก่อน (สำเนา; `[]` เมื่อไม่จัดกลุ่ม)
- `setGroupBy(keys)` – จัดกลุ่มแถวตามคอลัมน์ข้อมูลเหล่านี้ (`[]` = เลิกจัดกลุ่ม) และกลับไปหน้า 1 โยน `RangeError` ถ้ามี key ที่ไม่ใช่คอลัมน์ข้อมูลหรือซ้ำ (`TypeError` ถ้าไม่ใช่อาร์เรย์ของสตริง) ยิง `groupByChange` และบันทึกลง `localStorage` ถ้ามี `groupByStorageKey`
- `setColumnOrder(keys)` – แสดงคอลัมน์ตามลำดับนี้ คอลัมน์ที่ไม่ได้ระบุจะต่อท้ายตามลำดับเดิม โยน `RangeError` ถ้ามี key ที่ไม่ใช่คอลัมน์ บันทึกลง `localStorage` ถ้ามี `columnOrderStorageKey` ลำดับนี้มีผลกับการส่งออก Excel ด้วย
- `on('columnOrderChange', fn)` – รับ `string[]` (key ทุกคอลัมน์ตามลำดับที่แสดง) ครั้งเดียวต่อการเปลี่ยน (ไม่เรียกถ้าไม่เปลี่ยน) คืนฟังก์ชัน unsubscribe
- `on('groupByChange', fn)` – รับ `string[]` (key ที่จัดกลุ่ม ชั้นนอกสุดก่อน) ครั้งเดียวต่อการเปลี่ยน คืนฟังก์ชัน unsubscribe
- `on('columnsChange', fn)` – รับ `string[]` (key ที่ซ่อน) ครั้งเดียวต่อการเปลี่ยน (ไม่เรียกถ้าไม่เปลี่ยน) คืนฟังก์ชัน unsubscribe
- `on('action', fn)` / `on('cellClick', fn)` – ดู [Events](#events-action-และ-cellclick) คืนฟังก์ชัน unsubscribe
- `on('rowActivate', fn)` – ดู [Row activation](#row-activation) คืนฟังก์ชัน unsubscribe
- `exportExcel({ filename, sheetName })` – ดาวน์โหลดไฟล์ `.xlsx` (สร้างในเบราว์เซอร์ ไม่ใช้ไลบรารีเพิ่ม) ของแถวที่ผ่านการค้นหา/กรอง/เรียงปัจจุบัน
  **ทุกหน้า** เฉพาะคอลัมน์ข้อมูล (ไม่รวม action) โดยแถวแรกเป็น `label` ตัวหนา; ค่าเป็นค่าดิบของแถว ไม่ใช่ผลของ `column.render`;
  ตัวเลขและ boolean คงชนิด ส่วนอื่นเป็นข้อความ (จึงไม่ถูกตีความเป็นสูตร) `filename` ค่าเริ่มต้น `export.xlsx`
  (เติม `.xlsx` ให้ถ้าไม่มี), `sheetName` ค่าเริ่มต้น `Sheet1` คืน `Blob` ของไฟล์
- `render()` – เรนเดอร์ตารางใหม่ (ช่องค้นหาและ pager ไม่ถูกแตะถ้าเนื้อหาเท่าเดิม)
- `destroy()` – ถอด event listener (หัวตาราง, ช่องค้นหา, pager), ยกเลิก debounce ที่ค้างอยู่ และล้างเนื้อหาใน container; หลังจากนั้นทุกเมธอดไม่ทำอะไร

## `escapeHtml(value)`

Escape อักขระ `& < > " '`; ค่า `null`/`undefined` จะกลายเป็น `''`

นำเข้าสไตล์: `import { SPGrid } from '@siampiwat/spgrid'` ดึง CSS มาด้วยเองผ่าน bundler (Vite, webpack, Next.js) ส่วน `import '@siampiwat/spgrid/style.css'` ยังใช้ได้ และ `@siampiwat/spgrid/plain` คือ JS ล้วนไม่มี CSS
(`dist/spgrid.js` กับ `dist/spgrid.css` ที่โหลดผ่าน URL ไม่เปลี่ยน)

## `showDetails(row, columns, options?)`

เปิด modal รายละเอียดของแถว (หัวสีอ่อนแสดงชื่อเรื่องและ badge `status` แล้วตามด้วยข้อมูลเป็นกลุ่ม) ใช้ look เดียวกับ modal อื่นของกริด เรียกจาก `onRowActivate` หรือ `onAction` ค่าทุกตัวถูกใส่เป็นข้อความ ไม่ถูกตีความเป็น HTML คืนฟังก์ชันที่ปิด modal

```js
import { SPGrid, showDetails } from '@siampiwat/spgrid';

const container = document.querySelector('#app');
new SPGrid(container, {
  columns,
  rows,
  onRowActivate: ({ row }) =>
    showDetails(row, columns, { root: container, title: (r) => r.poNumber }),
});
```

- `row` – แถวข้อมูล; `columns` – คอลัมน์ของกริด (ข้ามคอลัมน์ action)
- `options.root?: HTMLElement` – container ของกริดหรือ `.spg-root` เพื่อให้ modal ได้ธีมของกริดนั้น (ค่าเริ่มต้น `.spg-root` แรกในหน้า ไม่มีก็ใช้ `document.body`)
- `options.title?: (row) => string` – หัวเรื่อง (ค่าเริ่มต้น ค่าของคอลัมน์ข้อมูลแรก)
- `options.groups?: [heading, keys[]][]` – ส่วนต่างๆ เรียงตามลำดับ heading ว่างได้ (ค่าเริ่มต้น ส่วนเดียวที่มีทุกคอลัมน์ข้อมูล) key ที่ไม่มีคอลัมน์จะถูกข้าม
- `options.wide?: string[]` – key ของคอลัมน์ที่ค่าเต็มบรรทัด (ค่าเริ่มต้น ไม่มี)
- `options.labels?: Labels` – ข้อความ `details` (หัวเล็กเหนือชื่อเรื่อง), `close`, `yes`, `no` (`thaiLabels` มีภาษาไทย)
- `options.locale?: string` – locale ของคอลัมน์ `date` (ค่าเริ่มต้นของเบราว์เซอร์)
- ค่าว่างแสดงเป็น `-`; คอลัมน์ `boolean` แสดง `labels.yes`/`labels.no`; `badge` แสดงเป็น badge ตาม `badges[value]`
- Esc, คลิกพื้นหลัง และปุ่มปิดจะปิด modal, Tab วนอยู่ใน modal และโฟกัสกลับไปที่เดิม; ชนิด `DetailsOptions` export จาก `spgrid`
