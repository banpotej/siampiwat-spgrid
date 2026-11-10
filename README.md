# SPGrid

SPGrid แบบ vanilla JS ที่นำกลับมาใช้ซ้ำได้ ไม่มี runtime dependency และใช้ ES modules เท่านั้น

## Quick Start

ทำตามทีละขั้นเพื่อติดตั้งและแสดงตารางแรกให้ได้ภายในไม่กี่นาที (ใช้ Vite เป็นตัวอย่าง)

**ขั้นที่ 1 – เตรียมโปรเจกต์** (ข้ามได้ถ้ามีโปรเจกต์อยู่แล้ว; ต้องใช้ Node.js 22 ขึ้นไป)

```sh
npm create vite@latest my-app -- --template vanilla
cd my-app
```

**ขั้นที่ 2 – ติดตั้งแพ็กเกจ**

```sh
npm install @siampiwat/spgrid
```

**ขั้นที่ 3 – เตรียม element สำหรับวางตาราง** ใน `index.html`

```html
<div id="app"></div>
```

**ขั้นที่ 4 – สร้างตาราง** ใน `main.js` (stylesheet มากับ import นี้แล้ว ไม่ต้อง import CSS เพิ่ม)

```js
import { SPGrid } from '@siampiwat/spgrid';

const rows = [
  { id: 1, name: 'Ada', status: 'open' },
  { id: 2, name: 'Grace', status: 'closed' },
  { id: 3, name: 'Linus', status: 'open' },
];

const grid = new SPGrid(document.querySelector('#app'), {
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
> **Next.js?** ดู [Quick Start (Next.js)](#quick-start-nextjs) · **React อื่น ๆ?** สร้าง grid ใน `useEffect` ของ client component (ดู [docs/AGENT_GUIDE.md](docs/AGENT_GUIDE.md)) ·
> ตัวเลือกและ method ทั้งหมดอยู่ที่ [docs/API.md](docs/API.md)

## Quick Start (Next.js)

ใช้กับ Next.js (App Router) ต้องใช้ Node.js 22 ขึ้นไป แพ็กเกจนี้ทำงานกับ DOM จึง **ห้าม import บน server** — สร้าง grid ใน `useEffect` ของ client component และ import แบบ dynamic ตามตัวอย่างด้านล่าง

**ขั้นที่ 1 – เตรียมโปรเจกต์** (ข้ามได้ถ้ามีโปรเจกต์อยู่แล้ว)

```sh
npx create-next-app@latest my-app --ts --app
cd my-app
```

**ขั้นที่ 2 – ติดตั้งแพ็กเกจ**

```sh
npm install @siampiwat/spgrid
```

**ขั้นที่ 3 – สร้าง client component** ที่ `app/Grid.tsx` (stylesheet มากับ import นี้แล้ว ไม่ต้อง import CSS เพิ่ม)

```tsx
'use client';

import { useEffect, useRef } from 'react';

type Row = { id: number; name: string; status: string };

export default function Grid({ rows }: { rows: Row[] }) {
  const el = useRef<HTMLDivElement>(null);
  const grid = useRef<{ setRows(rows: Row[]): void; destroy(): void } | null>(null);

  // สร้างครั้งเดียว
  useEffect(() => {
    let cancelled = false;
    import('@siampiwat/spgrid').then(({ SPGrid }) => {
      if (cancelled || !el.current) return;
      grid.current = new SPGrid(el.current, {
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
    });
    return () => {
      cancelled = true;
      grid.current?.destroy(); // ทุกครั้งที่ component ถูกถอดออก
      grid.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ข้อมูลเปลี่ยน: ส่งเฉพาะข้อมูลใหม่ (คง sort / filter / หน้าปัจจุบันไว้)
  useEffect(() => {
    grid.current?.setRows(rows);
  }, [rows]);

  return <div ref={el} />;
}
```

**ขั้นที่ 4 – เรียกใช้ใน page** ที่ `app/page.tsx`

```tsx
import Grid from './Grid';

const rows = [
  { id: 1, name: 'Ada', status: 'open' },
  { id: 2, name: 'Grace', status: 'closed' },
  { id: 3, name: 'Linus', status: 'open' },
];

export default function Home() {
  return <Grid rows={rows} />;
}
```

**ขั้นที่ 5 – รันและเปิดดู**

```sh
npm run dev
```

เปิด `http://localhost:3000` จะเห็นตารางที่เรียงลำดับ ค้นหา และแบ่งหน้าได้

> ถ้าข้อมูลมาจาก API ให้ดึงใน server component หรือ `fetch` ใน client แล้วส่งเป็น prop `rows` — `setRows` จะอัปเดตตารางให้โดยไม่รีเซ็ต sort / filter

## การติดตั้ง

ข้อกำหนด: Node.js 22 ขึ้นไป และ bundler ที่รองรับ ES modules (Vite, webpack, ...)

```sh
npm install @siampiwat/spgrid
```

แพ็กเกจเผยแพร่บน npm แล้ว หากติดตั้งผ่าน registry ไม่ได้ (เช่น ใช้ registry ภายใน) ให้ติดตั้งจาก URL หรือไฟล์แทน:

```sh
# ไฟล์ .tgz ที่แนบกับ GitHub Release (repo แบบ private ต้องใช้ token) - สร้างด้วย `npm run pack:release`
npm install https://github.com/banpotej/siampiwat-datagrid/releases/download/v2.0.6/siampiwat-spgrid-2.0.6.tgz

# git URL: npm จะรันสคริปต์ `prepare` ทำให้แพ็กเกจ build ตัวเองตอนติดตั้ง (ต้องมี git)
npm install github:banpotej/siampiwat-datagrid
npm install github:banpotej/siampiwat-datagrid#main   # branch หรือ tag

# tarball ในเครื่อง
npm install                # ใน repo นี้
npm run build
npm pack                   # สร้าง siampiwat-spgrid-2.0.6.tgz
npm install ../siampiwat-datagrid/siampiwat-spgrid-2.0.6.tgz   # ในโปรเจกต์ของคุณ
```

`import { SPGrid } from '@siampiwat/spgrid'` จะนำ stylesheet เข้ามาด้วย (ผ่าน bundler ของคุณ) ส่วน `@siampiwat/spgrid/style.css` ยังคง export อยู่ และ
`@siampiwat/spgrid/plain` คือ JS อย่างเดียว grid เข้าถึง DOM จึงต้องสร้างในเบราว์เซอร์เท่านั้น:
ใน React หรือ Next.js ให้สร้างใน `useEffect` ของ client component และเรียก `grid.destroy()` ตอน unmount

### ไฟล์ Release (.tgz และ .zip)

`npm run pack:release` (PowerShell; รัน `npm run check` ก่อน หรือเรียก `.\pack.ps1 -SkipCheck`) จะเขียนไฟล์สามไฟล์ลงใน `release\`:

- `siampiwat-spgrid-<version>.tgz` – แพ็กเกจ npm: `npm install .\release\siampiwat-spgrid-<version>.tgz`
- `siampiwat-spgrid-<version>.zip` – แพ็กเกจเดียวกันที่แตกไฟล์แล้ว สำหรับผู้ที่ไม่ใช้ npm: ใช้ `dist\spgrid.js` และ `dist\spgrid.css`
- `SHA256SUMS.txt` – checksum ของทั้งสองไฟล์

### สำหรับ AI coding agent

[docs/AGENT_GUIDE.md](docs/AGENT_GUIDE.md) บอก agent ว่าจะใช้แพ็กเกจนี้อย่างถูกต้องได้อย่างไร (การตั้งค่า, React / Next.js, columns, options,
กฎการ escape, ข้อผิดพลาดที่ควรหลีกเลี่ยง) ไฟล์นี้แถมมาในแพ็กเกจ: `node_modules/@siampiwat/spgrid/docs/AGENT_GUIDE.md` หรือ `@siampiwat/spgrid/agent-guide`
ให้ชี้ agent ของคุณมาที่ไฟล์นี้จาก `AGENTS.md` / `CLAUDE.md`

### จาก URL ในเบราว์เซอร์ (ไม่ใช้ npm)

`dist/spgrid.js` เป็น ES module ที่ครบในตัว (ไม่มี import ไม่มี dependency) หน้าเว็บจึงโหลดจาก URL ใดก็ได้
เมื่อแพ็กเกจอยู่บน npm แล้ว jsDelivr และ unpkg จะให้บริการ (ระบุเวอร์ชันให้ชัดเจน ไม่ใช้ `@latest`) หรือจะโฮสต์
`dist/spgrid.js` และ `dist/spgrid.css` เองบน static host ใดก็ได้:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@siampiwat/spgrid@2.0.6/dist/spgrid.css"
/>
<div id="app"></div>
<script type="module">
  import { SPGrid } from 'https://cdn.jsdelivr.net/npm/@siampiwat/spgrid@2.0.6/dist/spgrid.js';

  new SPGrid(document.getElementById('app'), {
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
import { SPGrid } from '@siampiwat/spgrid'; // stylesheet มาพร้อมกัน

const grid = new SPGrid(document.querySelector('#app'), {
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
- `npm run pack:site` – build landing page แล้วสร้าง `release/spgrid-site.zip` (มี `index.html` อยู่ที่ราก) สำหรับอัปโหลดเป็น static file ขึ้น Cloudflare (Workers & Pages › Upload assets) หรือ static host อื่นด้วยมือ ไม่มี CI deploy อัตโนมัติแล้ว
- `npm run deploy:site` – แตก `release/spgrid-site.zip` แล้วอัปโหลดขึ้น Cloudflare (Worker ชื่อตาม `wrangler.jsonc`) ด้วย `wrangler deploy` (ดึงผ่าน `npx` ไม่ได้เป็น dependency ของโปรเจกต์) ครั้งแรกจะเปิดเบราว์เซอร์ให้ login หรือตั้ง `CLOUDFLARE_API_TOKEN` และ `CLOUDFLARE_ACCOUNT_ID` สำหรับรันโดยไม่มีหน้าจอ เพิ่ม `-Pack` เพื่อ build + zip ก่อน หรือ `-DryRun` เพื่อลองโดยไม่ deploy จริง (`powershell -File deploy-site.ps1 -Pack -DryRun`)

## ไอคอนและธีม

ไอคอนเป็น inline SVG จาก [Material Symbols](https://github.com/google/material-design-icons) (Apache-2.0)
รวมอยู่ในไลบรารีแล้ว: ไม่ใช้ icon font และไม่มี network request สามารถแทนที่ได้ด้วย `options.icons` grid รองรับ
dark mode (`prefers-color-scheme` หรือ `data-theme="dark"`), `striped`, `density`, `stickyHeader` และ CSS
variable (`--spg-*`) ดู [docs/API.md](docs/API.md#theming) การอ้างอิงแหล่งที่มาอยู่ใน [NOTICE](NOTICE)

ดูขอบเขตงานที่ [docs/ROADMAP.md](docs/ROADMAP.md)
