# Siam Piwat DataGrid

Siam Piwat DataGrid แบบ vanilla JS ที่นำกลับมาใช้ซ้ำได้ ไม่มี runtime dependency และใช้ ES modules เท่านั้น

## Quick Start

ทำตามทีละขั้นเพื่อติดตั้งและแสดงตารางแรกให้ได้ภายในไม่กี่นาที (ใช้ Vite เป็นตัวอย่าง)

**ขั้นที่ 1 – เตรียมโปรเจกต์** (ข้ามได้ถ้ามีโปรเจกต์อยู่แล้ว; ต้องใช้ Node.js 22 ขึ้นไป)

```sh
npm create vite@latest my-app -- --template vanilla
cd my-app
```

**ขั้นที่ 2 – ติดตั้งแพ็กเกจ**

```sh
npm install @siampiwat/datagrid
```

**ขั้นที่ 3 – เตรียม element สำหรับวางตาราง** ใน `index.html`

```html
<div id="app"></div>
```

**ขั้นที่ 4 – สร้างตาราง** ใน `main.js` (stylesheet มากับ import นี้แล้ว ไม่ต้อง import CSS เพิ่ม)

```js
import { DataGrid } from '@siampiwat/datagrid';

const rows = [
  { id: 1, name: 'Ada', status: 'open' },
  { id: 2, name: 'Grace', status: 'closed' },
  { id: 3, name: 'Linus', status: 'open' },
];

const grid = new DataGrid(document.querySelector('#app'), {
  rowKey: 'id',
  columns: [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'status', label: 'Status', type: 'badge', badges: { open: { tone: 'success' } } },
  ],
  rows,
  searchable: true,
  pageSize: 10,
});
```

**ขั้นที่ 5 – รันและเปิดดู**

```sh
npm run dev
```

เปิด URL ที่ Vite แสดง (ปกติ `http://localhost:5173`) จะเห็นตารางที่เรียงลำดับ ค้นหา และแบ่งหน้าได้

**ขั้นที่ 6 – รับ event และเปลี่ยนข้อมูล**

```js
// ฟัง event (คืนค่าฟังก์ชัน unsubscribe)
grid.on('sortChange', ({ key, direction }) => console.log(key, direction));

// เปลี่ยนข้อมูล: คง sort / filter / หน้าปัจจุบันไว้
grid.setRows([...rows, { id: 4, name: 'Margaret', status: 'open' }]);

// เมื่อ element ถูกถอดออก (เปลี่ยนหน้า, React unmount) ให้เรียกทุกครั้ง
grid.destroy();
```

> **ไม่ใช้ npm / bundler?** ดู [จาก URL ในเบราว์เซอร์](#จาก-url-ในเบราว์เซอร์-ไม่ใช้-npm) ·
> **React / Next.js?** สร้าง grid ใน `useEffect` ของ client component (ดู [docs/AGENT_GUIDE.md](docs/AGENT_GUIDE.md)) ·
> ตัวเลือกและ method ทั้งหมดอยู่ที่ [docs/API.md](docs/API.md)

## การติดตั้ง

ข้อกำหนด: Node.js 22 ขึ้นไป และ bundler ที่รองรับ ES modules (Vite, webpack, ...)

```sh
npm install @siampiwat/datagrid
```

แพ็กเกจเผยแพร่บน npm แล้ว หากติดตั้งผ่าน registry ไม่ได้ (เช่น ใช้ registry ภายใน) ให้ติดตั้งจาก URL หรือไฟล์แทน:

```sh
# ไฟล์ .tgz ที่แนบกับ GitHub Release (repo แบบ private ต้องใช้ token) - สร้างด้วย `npm run pack:release`
npm install https://github.com/banpotej/siampiwat-datagrid/releases/download/v1.0.9/siampiwat-datagrid-1.0.9.tgz

# git URL: npm จะรันสคริปต์ `prepare` ทำให้แพ็กเกจ build ตัวเองตอนติดตั้ง (ต้องมี git)
npm install github:banpotej/siampiwat-datagrid
npm install github:banpotej/siampiwat-datagrid#main   # branch หรือ tag

# tarball ในเครื่อง
npm install                # ใน repo นี้
npm run build
npm pack                   # สร้าง siampiwat-datagrid-1.0.9.tgz
npm install ../siampiwat-datagrid/siampiwat-datagrid-1.0.9.tgz   # ในโปรเจกต์ของคุณ
```

`import { DataGrid } from '@siampiwat/datagrid'` จะนำ stylesheet เข้ามาด้วย (ผ่าน bundler ของคุณ) ส่วน `@siampiwat/datagrid/style.css` ยังคง export อยู่ และ
`@siampiwat/datagrid/plain` คือ JS อย่างเดียว grid เข้าถึง DOM จึงต้องสร้างในเบราว์เซอร์เท่านั้น:
ใน React หรือ Next.js ให้สร้างใน `useEffect` ของ client component และเรียก `grid.destroy()` ตอน unmount

### ไฟล์ Release (.tgz และ .zip)

`npm run pack:release` (PowerShell; รัน `npm run check` ก่อน หรือเรียก `.\pack.ps1 -SkipCheck`) จะเขียนไฟล์สามไฟล์ลงใน `release\`:

- `siampiwat-datagrid-<version>.tgz` – แพ็กเกจ npm: `npm install .\release\siampiwat-datagrid-<version>.tgz`
- `siampiwat-datagrid-<version>.zip` – แพ็กเกจเดียวกันที่แตกไฟล์แล้ว สำหรับผู้ที่ไม่ใช้ npm: ใช้ `dist\datagrid.js` และ `dist\datagrid.css`
- `SHA256SUMS.txt` – checksum ของทั้งสองไฟล์

### สำหรับ AI coding agent

[docs/AGENT_GUIDE.md](docs/AGENT_GUIDE.md) บอก agent ว่าจะใช้แพ็กเกจนี้อย่างถูกต้องได้อย่างไร (การตั้งค่า, React / Next.js, columns, options,
กฎการ escape, ข้อผิดพลาดที่ควรหลีกเลี่ยง) ไฟล์นี้แถมมาในแพ็กเกจ: `node_modules/@siampiwat/datagrid/docs/AGENT_GUIDE.md` หรือ `@siampiwat/datagrid/agent-guide`
ให้ชี้ agent ของคุณมาที่ไฟล์นี้จาก `AGENTS.md` / `CLAUDE.md`

### จาก URL ในเบราว์เซอร์ (ไม่ใช้ npm)

`dist/datagrid.js` เป็น ES module ที่ครบในตัว (ไม่มี import ไม่มี dependency) หน้าเว็บจึงโหลดจาก URL ใดก็ได้
เมื่อแพ็กเกจอยู่บน npm แล้ว jsDelivr และ unpkg จะให้บริการ (ระบุเวอร์ชันให้ชัดเจน ไม่ใช้ `@latest`) หรือจะโฮสต์
`dist/datagrid.js` และ `dist/datagrid.css` เองบน static host ใดก็ได้:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@siampiwat/datagrid@1.0.9/dist/datagrid.css" />
<div id="app"></div>
<script type="module">
  import { DataGrid } from 'https://cdn.jsdelivr.net/npm/@siampiwat/datagrid@1.0.9/dist/datagrid.js';

  new DataGrid(document.getElementById('app'), {
    rowKey: 'id',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
    ],
    rows: [{ id: 1, name: 'Ada' }],
  });
</script>
```

## การใช้งาน

```js
import { DataGrid } from '@siampiwat/datagrid'; // stylesheet มาพร้อมกัน

const grid = new DataGrid(document.querySelector('#app'), {
  columns: [{ key: 'id', label: 'ID' }, { key: 'name' }],
  rows: [{ id: 1, name: 'Ada' }],
});

grid.setRows([{ id: 2, name: 'Grace' }]);
grid.destroy();
```

ค่าในเซลล์จะถูก escape HTML ให้อัตโนมัติ เว้นแต่คอลัมน์กำหนด `render` (กรณีนั้นคุณต้อง escape เอง) คอลัมน์ยังเป็นคอลัมน์ action
(`actions`) ที่ส่ง event `action` ได้ ดู API ทั้งหมดที่ [docs/API.md](docs/API.md)

## คำสั่ง

- `npm run dev` – dev server ตัวอย่างอยู่ที่ `/`
- `npm run build` – สร้าง library bundle และ `.d.ts` ลงใน `dist/`
- `npm test` – unit test
- `npm run test:e2e` – Playwright end-to-end test
- `npm run check` – lint, typecheck, unit test และ build

## ไอคอนและธีม

ไอคอนเป็น inline SVG จาก [Material Symbols](https://github.com/google/material-design-icons) (Apache-2.0)
รวมอยู่ในไลบรารีแล้ว: ไม่ใช้ icon font และไม่มี network request สามารถแทนที่ได้ด้วย `options.icons` grid รองรับ
dark mode (`prefers-color-scheme` หรือ `data-theme="dark"`), `striped`, `density`, `stickyHeader` และ CSS
variable (`--dg-*`) ดู [docs/API.md](docs/API.md#theming) การอ้างอิงแหล่งที่มาอยู่ใน [NOTICE](NOTICE)

ดูขอบเขตงานที่ [docs/ROADMAP.md](docs/ROADMAP.md)
