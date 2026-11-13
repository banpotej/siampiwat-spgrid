// The Claude Code prompt of each example page (key = the page's `data-prompt`). Text only: the card shows it
// through textContent. Replace the [bracketed] parts with the real page; the preamble is shared.
const PREAMBLE = `ใช้ SPGrid (@siampiwat/spgrid) ในโปรเจกต์นี้
ก่อนเขียนโค้ด: อ่าน node_modules/@siampiwat/spgrid/docs/AGENT_GUIDE.md และ docs/API.md ดูหน้าอื่นที่ใช้ SPGrid อยู่แล้วเพื่อทำตามรูปแบบเดิม (การ import, การ mount/destroy, โครงโฟลเดอร์) และทำตาม CLAUDE.md ของโปรเจกต์`;

const RULES = `ข้อควรระวัง: ข้อมูลที่ใส่ใน render ต้องผ่าน escapeHtml, เรียก grid.destroy() ตอนถอด component, ใช้ grid.setRows() เมื่อโหลดข้อมูลใหม่, ไม่เพิ่ม dependency ใหม่ และไม่แก้ไฟล์ที่ไม่เกี่ยวข้อง
เมื่อเสร็จ: รัน typecheck, lint, test และ build แล้วสรุปไฟล์ที่เพิ่ม/แก้ ยังไม่ต้อง commit`;

export const PROMPTS = {
  'purchase-order': `${PREAMBLE}

สร้างหน้า [ชื่อหน้า เช่น รายการใบสั่งซื้อ] เป็นรายการข้อมูลแบบเต็มฟีเจอร์ เหมือนตัวอย่าง "Purchase Order list" ของ SPGrid
- ข้อมูล: [ที่มา เช่น API /api/xxx] ฟิลด์ [รายการฟิลด์] คอลัมน์ [ชื่อ ชนิด (text/number/date/badge) และคอลัมน์ที่ sortable]
- คอลัมน์ _actions: ปุ่ม [เช่น ดู, ยกเลิก] ผ่าน actions และ onAction (ปุ่มที่ทำลายข้อมูลต้องถามยืนยัน) ดับเบิลคลิกแถวหรือ Enter เปิดรายละเอียดด้วย onRowActivate + showDetails
- options: searchable, searchColumnSelect, searchButton, searchDebounce: 50, exportButton + exportColumnSelect, advancedFilter, filterSummary, columnPicker, resetButton, refreshButton (onRefresh โหลดข้อมูลใหม่แล้ว setRows), pageSize + pageSizeOptions, defaultSort, striped, gridLines: 'both', density: 'compact', resizableColumns, reorderableColumns, labels: thaiLabels
- ปุ่มตั้งค่า: stripedToggle, textWrapToggle, gridLinesToggle, lineStyleToggle, groupByToggle, freezeColumnsToggle
- ทุก *StorageKey ใช้ชื่อ [ชื่อหน้า] เดียวกัน เพื่อให้ระบบจำค่าที่ผู้ใช้เลือก

${RULES}`,

  'theme-lavender': `${PREAMBLE}

สร้างหน้า [ชื่อหน้า] ด้วยธีมลาเวนเดอร์ เหมือนตัวอย่าง "ธีมลาเวนเดอร์" ของ SPGrid
- เปิดธีมด้วย container.classList.add('spg-theme-lavender') ที่ element ที่ส่งให้ new SPGrid() เท่านั้น ห้ามเขียน CSS ทับสีของไลบรารี
- ข้อมูล: [ที่มา] คอลัมน์ [ชื่อ ชนิด และคอลัมน์ที่ sortable] คอลัมน์สถานะใช้ type: 'badge' กับ badges: { <ค่า>: { tone: 'success' | 'neutral' } }
- ปุ่มการดำเนินการ [เช่น แก้ไข, ลบ] ใน _actions ใช้ className 'spg-action-warning spg-action-solid' (แก้ไข) และ 'spg-action-danger spg-action-solid' (ลบ) จัดการใน onAction (ลบต้องถามยืนยัน)
- options: searchable, searchColumnSelect, searchButton, searchDebounce: 50, columnPicker, resetButton, striped: true, gridLines: 'both', labels: thaiLabels
- ปุ่มตั้งค่า: stripedToggle, textWrapToggle, gridLinesToggle, lineStyleToggle, groupByToggle, freezeColumnsToggle และ *StorageKey ชื่อ [ชื่อหน้า] ทุกตัว

${RULES}`,

  'recent-receipts': `${PREAMBLE}

สร้างหน้า [ชื่อหน้า เช่น รับเข้าล่าสุด] เป็นการ์ดรายการสั้น ๆ เหมือนตัวอย่าง "รับเข้าล่าสุด (Recent receipts)" ของ SPGrid
- ชื่อการ์ดใส่เป็น title จำนวนรายการที่มุมขวาใช้ rowCount: true (ข้อความมาจาก labels.rowCount) ไม่มีแถวหัวตารางด้วย showHeader: false และ gridLines: 'horizontal' ใช้ labels: thaiLabels
- ข้อมูล: [ที่มา] ฟิลด์ [รายการฟิลด์ เช่น code, name, category, qty, receivedAt (Date), status]
- สองคอลัมน์: คอลัมน์ render สร้างข้อความหลายบรรทัดจากทั้งแถว (รหัสแบบ monospace, ชื่อตัวหนา, หมวด · จำนวน, เวลา "วันนี้ 17:40" / "เมื่อวาน 16:41" คำนวณเองใน render) และคอลัมน์ type: 'badge' align: 'right' กับ badges: { <ค่า>: { tone, label } }

${RULES}`,

  'status-summary': `${PREAMBLE}

สร้างหน้า [ชื่อหน้า เช่น สรุปตามสถานะ] เป็นการ์ดสรุปแบบแถบบาร์ เหมือนตัวอย่าง "สรุปตามสถานะ (Status summary)" ของ SPGrid
- ชื่อการ์ดใส่เป็น title บรรทัดรองใส่เป็น description ไม่มีแถวหัวตารางด้วย showHeader: false และไม่มีเส้นคั่นด้วย gridLines: 'none' ใช้ labels: thaiLabels
- ข้อมูล: [ที่มา] หนึ่งแถวต่อสถานะ ฟิลด์ label, count, color
- สามคอลัมน์: ชื่อสถานะ, แถบบาร์ที่สร้างด้วย render (รางสีจาง กับแถบสีที่ความกว้าง = count / ค่าสูงสุด คำนวณเป็นตัวเลข ส่วนสีผ่าน escapeHtml; count เป็น 0 ให้แสดงรางว่าง) และ count ชิดขวา (type: 'number', align: 'right')

${RULES}`,

  worklist: `${PREAMBLE}

สร้างหน้า [ชื่อหน้า เช่น รายการงาน] แสดงข้อมูลเป็นรายการ (ไม่ใช่ตารางหลายคอลัมน์) เหมือนตัวอย่าง "รายการงาน (Worklist)" ของ SPGrid
- หนึ่งแถวต่อหนึ่งรายการ [ฟิลด์ของแถว] จัดกลุ่มตาม [เช่น เอกสาร] ด้วย groupBy: ['<ฟิลด์กลุ่ม>'] โดยคอลัมน์กลุ่มเป็น hiddenColumns และใช้ render สร้างข้อความหัวกลุ่ม จำนวนรายการในหัวกลุ่มมาจาก labels.groupCount(count) ชื่อรายการรวม [เช่น Worklist — รออนุมัติ] ใส่เป็น title ของตาราง ไม่ต้องทำเป็นหัวกลุ่ม
- คอลัมน์ที่แสดงมีคอลัมน์เดียว ใช้ render สร้างรายการจากทั้งแถว (รหัส หมวด จำนวน สถานที่ วันที่ และรายการย่อย) ทุกค่าผ่าน escapeHtml ฟิลด์ที่ไม่วาดให้เป็น hiddenColumns เพื่อใช้ค้นหา กรอง ส่งออก และแสดงในแผ่นรายละเอียด (onRowActivate + showDetails)
- ซ่อนแถวหัวตารางด้วย CSS (ให้ screen reader ยังอ่านได้) และใส่ groupToggleAllButton
- มุมมองปฏิทิน: ฟิลด์เวลาต้องเป็น Date เพิ่ม calendar: { start: '[ฟิลด์เวลาเริ่ม]', end: '[ฟิลด์เวลาสิ้นสุด]', title: '[ฟิลด์ชื่อ]', subtitle: '[ฟิลด์รอง]', view: 'day' }, defaultView: 'grid', viewToggle: true
- options อื่น: searchable, searchColumnSelect, searchButton, exportButton + exportColumnSelect, advancedFilter, columnPicker, filterSummary, resetButton, refreshButton, pageSize + pageSizeOptions, labels: thaiLabels และ *StorageKey ชื่อ [ชื่อหน้า]

${RULES}`,

  calendar: `${PREAMBLE}

สร้างหน้า [ชื่อหน้า เช่น ตารางนัดหมาย] แสดงแถวเป็นนัดหมายบนปฏิทิน เหมือนตัวอย่าง "Calendar" ของ SPGrid
- ข้อมูล: [ที่มา] ทุกแถวมีเวลาเริ่ม/สิ้นสุดเป็น Date, ISO string หรือ timestamp ถ้าไม่มีเวลาสิ้นสุดนัดจะยาว 30 นาที
- options: calendar: { start: '[ฟิลด์เริ่ม]', end: '[ฟิลด์สิ้นสุด]', title: '[ฟิลด์ชื่อ]', subtitle: '[ฟิลด์รอง เช่น สถานที่]', hours: [8, 18] } (ใส่ date เพื่อเปิดที่วันที่กำหนด ไม่ใส่คือวันนี้) views / view เลือกมุมมองที่มี (agenda, day, workWeek, week)
- columns ใช้สำหรับค้นหา กรอง ส่งออก และแผ่นรายละเอียดเท่านั้น (pageSize และ groupBy ไม่มีผลในโหมดปฏิทิน) ใส่ searchable, searchColumnSelect, filterSummary
- คลิกนัดหรือกด Enter เรียก onRowActivate ใช้เปิดรายละเอียดด้วย showDetails
- ถ้าอยากให้สลับกลับเป็นตารางได้ ใส่ viewToggle: true (และ defaultView: 'grid' ถ้าให้เริ่มที่ตาราง)

${RULES}`,

  'view-settings': `${PREAMBLE}

เพิ่มการควบคุมหน้าตาของตาราง [ชื่อกริด] จากโค้ด เหมือนตัวอย่าง "View settings" ของ SPGrid โดยไม่ต้องเปิด *Toggle
- อ่านค่าด้วย grid.getViewSettings() ได้ { striped, wrapped, gridLines, lineStyle, freezeColumns } และเปลี่ยนด้วย grid.setViewSettings({ ... }) (ค่าที่ไม่ส่งมาคงเดิม) ค่าที่ไม่ถูกต้องโยน TypeError / RangeError และไม่เปลี่ยนอะไรเลย ให้ดักและแสดงข้อความ
- จัดกลุ่มจากโค้ดด้วย grid.setGroupBy([...]) และอ่านด้วย getGroupBy()
- ถ้าต้องการให้จำค่า ใส่ stripedStorageKey, textWrapStorageKey, gridLinesStorageKey, lineStyleStorageKey, freezeColumnsStorageKey, groupByStorageKey ชื่อ [ชื่อหน้า]
- UI: [เช่น ปุ่มชุดค่าสำเร็จรูป (preset) และ control ทีละค่า] ให้ control ตามค่าปัจจุบันเสมอ

${RULES}`,
};
