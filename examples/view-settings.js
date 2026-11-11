import { SPGrid } from '/src/index.js';

const rows = [
  ['สมชาย ใจดี', 'บัญชี', 'หัวหน้าแผนก', 'อาคาร A ชั้น 3', 'somchai@example.com', 'ใช้งาน'],
  ['สมหญิง รักเรียน', 'บัญชี', 'นักบัญชี', 'อาคาร A ชั้น 3', 'somying@example.com', 'ใช้งาน'],
  [
    'วิชัย มั่นคง',
    'จัดซื้อ',
    'เจ้าหน้าที่จัดซื้อ',
    'อาคาร B ชั้น 1',
    'wichai@example.com',
    'ใช้งาน',
  ],
  ['มานี มีสุข', 'จัดซื้อ', 'หัวหน้าแผนก', 'อาคาร B ชั้น 1', 'manee@example.com', 'ปิดใช้งาน'],
  ['นภา แสงทอง', 'ทรัพยากรบุคคล', 'เจ้าหน้าที่ HR', 'อาคาร A ชั้น 2', 'napa@example.com', 'ใช้งาน'],
  [
    'ปรีชา เก่งกล้า',
    'ทรัพยากรบุคคล',
    'ผู้จัดการ',
    'อาคาร A ชั้น 2',
    'preecha@example.com',
    'ใช้งาน',
  ],
].map(([name, department, position, office, email, active], i) => ({
  id: i + 1,
  name,
  department,
  position,
  office,
  email,
  active,
}));

const columns = [
  { key: 'id', label: 'รหัส', width: '80px' },
  { key: 'name', label: 'ชื่อ-นามสกุล', width: '200px' },
  { key: 'department', label: 'แผนก', width: '180px' },
  { key: 'position', label: 'ตำแหน่ง', width: '200px' },
  { key: 'office', label: 'สถานที่ทำงาน', width: '200px' },
  { key: 'email', label: 'อีเมล', width: '240px' },
  {
    key: 'active',
    label: 'สถานะ',
    type: 'badge',
    badges: { ใช้งาน: { tone: 'success' }, ปิดใช้งาน: { tone: 'neutral' } },
  },
];

// No `*Toggle` options: the settings modal stays off and the look is driven from code only.
// The `*StorageKey` options make `setViewSettings()` remember each choice, so a reload keeps it.
const grid = new SPGrid(document.getElementById('grid'), {
  rowKey: 'id',
  rows,
  columns,
  striped: true,
  gridLines: 'horizontal',
  stripedStorageKey: 'view-settings-demo',
  textWrapStorageKey: 'view-settings-demo',
  gridLinesStorageKey: 'view-settings-demo',
  lineStyleStorageKey: 'view-settings-demo',
  freezeColumnsStorageKey: 'view-settings-demo',
  groupByStorageKey: 'view-settings-demo',
});

const log = document.getElementById('log');
const show = (text) => {
  log.textContent = text;
};

// Keep the controls in step with the grid: a preset, or a value restored from localStorage, moves them too.
const report = () => {
  const settings = grid.getViewSettings();
  for (const [name, value] of Object.entries(settings)) {
    const input = document.querySelector(`#controls [name="${name}"]`);
    if (input.type === 'checkbox') input.checked = value;
    else input.value = value;
  }
  document.getElementById('group-by').value = grid.getGroupBy()[0] ?? '';
  show(`getViewSettings() = ${JSON.stringify(settings)}`);
};

// Presets: each is one call; settings that are left out keep their value.
const presets = {
  compact: { striped: false, wrapped: false, gridLines: 'horizontal', lineStyle: 'default' },
  audit: { striped: true, gridLines: 'both', lineStyle: 'dashed', freezeColumns: 2 },
  plain: { striped: false, gridLines: 'none', lineStyle: 'default', freezeColumns: 0 },
};
for (const button of document.querySelectorAll('[data-preset]')) {
  button.addEventListener('click', () => {
    grid.setViewSettings(presets[button.dataset.preset]);
    report();
  });
}

// One control per setting; each changes only its own setting.
const controls = document.getElementById('controls');
controls.addEventListener('change', ({ target }) => {
  const { name, type, value, checked } = target;
  const next = {
    checkbox: { [name]: checked },
    number: { [name]: Number(value) },
    'select-one': { [name]: value },
  }[type];
  if (!next) return;
  try {
    grid.setViewSettings(next);
    report();
  } catch (error) {
    // A bad value throws and changes nothing at all.
    show(`${error.name}: ${error.message}`);
  }
});

document.getElementById('group-by').addEventListener('change', ({ target }) => {
  grid.setGroupBy(target.value ? [target.value] : []);
  report();
});

document.getElementById('invalid').addEventListener('click', () => {
  try {
    grid.setViewSettings({ striped: false, gridLines: 'diagonal' });
  } catch (error) {
    show(
      `${error.name}: ${error.message} (ไม่มีอะไรเปลี่ยน striped ยังเป็น ${grid.getViewSettings().striped})`,
    );
  }
});

report();
