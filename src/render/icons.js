// @ts-check

/** @typedef {import('../types.js').IconName} IconName */

/**
 * Path data of Google's Material Symbols (outlined, weight 400, 24px), copied
 * verbatim from github.com/google/material-design-icons (Apache-2.0, see NOTICE).
 * @type {Record<IconName, string>}
 */
const PATHS = {
  arrow_upward: 'M440-160v-487L216-423l-56-57 320-320 320 320-56 57-224-224v487h-80Z',
  arrow_downward: 'M440-800v487L216-537l-56 57 320 320 320-320-56-57-224 224v-487h-80Z',
  unfold_more:
    'M480-120 300-300l58-58 122 122 122-122 58 58-180 180ZM358-598l-58-58 180-180 180 180-58 58-122-122-122 122Z',
  unfold_less:
    'm356-160-56-56 180-180 180 180-56 56-124-124-124 124Zm124-404L300-744l56-56 124 124 124-124 56 56-180 180Z',
  chevron_left: 'M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z',
  chevron_right: 'M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z',
  first_page: 'M240-240v-480h80v480h-80Zm440 0L440-480l240-240 56 56-184 184 184 184-56 56Z',
  last_page: 'm280-240-56-56 184-184-184-184 56-56 240 240-240 240Zm360 0v-480h80v480h-80Z',
  search:
    'M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z',
  close:
    'm256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z',
  inbox:
    'M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-120H640q-30 38-71.5 59T480-240q-47 0-88.5-21T320-320H200v120Zm280-120q38 0 69-22t43-58h168v-360H200v360h168q12 36 43 58t69 22ZM200-200h560-560Z',
  visibility:
    'M480-320q75 0 127.5-52.5T660-500q0-75-52.5-127.5T480-680q-75 0-127.5 52.5T300-500q0 75 52.5 127.5T480-320Zm0-72q-45 0-76.5-31.5T372-500q0-45 31.5-76.5T480-608q45 0 76.5 31.5T588-500q0 45-31.5 76.5T480-392Zm0 192q-146 0-266-81.5T40-500q54-137 174-218.5T480-800q146 0 266 81.5T920-500q-54 137-174 218.5T480-200Zm0-300Zm0 220q113 0 207.5-59.5T832-500q-50-101-144.5-160.5T480-720q-113 0-207.5 59.5T128-500q50 101 144.5 160.5T480-280Z',
  edit: 'M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z',
  delete:
    'M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z',
  cancel:
    'm336-280 144-144 144 144 56-56-144-144 144-144-56-56-144 144-144-144-56 56 144 144-144 144 56 56ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z',
  download:
    'M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z',
  calendar_today:
    'M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z',
  view_column:
    'M121-280v-400q0-33 23.5-56.5T201-760h559q33 0 56.5 23.5T840-680v400q0 33-23.5 56.5T760-200H201q-33 0-56.5-23.5T121-280Zm79 0h133v-400H200v400Zm213 0h133v-400H413v400Zm213 0h133v-400H626v400Z',
  restart_alt:
    'M440-122q-121-15-200.5-105.5T160-440q0-66 26-126.5T260-672l57 57q-38 34-57.5 79T240-440q0 88 56 155.5T440-202v80Zm80 0v-80q87-16 143.5-83T720-440q0-100-70-170t-170-70h-3l44 44-56 56-140-140 140-140 56 56-44 44h3q134 0 227 93t93 227q0 121-79.5 211.5T520-122Z',
  refresh:
    'M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z',
  filter_list: 'M400-240v-80h160v80H400ZM240-440v-80h480v80H240ZM120-640v-80h720v80H120Z',
  check: 'M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z',
  // Not from Material Symbols: drawn for this project (a frame with every other row filled), see NOTICE.
  // Likewise drawn for this project: two full lines and a short one (wrapped text).
  wrap_text: 'M200-760h560v80H200v-80Zm0 200h560v80H200v-80Zm0 200h320v80H200v-80Z',
  // Likewise drawn for this project: three sliders (the settings button).
  settings:
    'M160-760h280v80H160v-80Zm360 0h280v80H520v-80ZM440-800h80v160h-80v-160ZM160-520h400v80H160v-80Zm480 0h160v80H640v-80ZM560-560h80v160h-80v-160ZM160-280h120v80H160v-80Zm200 0h440v80H360v-80ZM280-320h80v160h-80v-160Z',
  stripes:
    'M200-800h560v640H200v-640Zm60 60v520h440v-520H260Zm0 130h440v130H260v-130Zm0 260h440v130H260v-130Z',
};

/** @param {string} path */
const svg = (path) =>
  `<svg viewBox="0 -960 960 960" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`;

/** The built-in icons as inline SVG strings. */
export const ICONS = /** @type {Record<IconName, string>} */ (
  Object.fromEntries(Object.entries(PATHS).map(([name, path]) => [name, svg(path)]))
);

/**
 * Built-in icons overlaid with the caller's SVG strings. Overrides are trusted
 * markup (never user data); unknown names and non-strings are ignored.
 *
 * @param {Partial<Record<IconName, string>>} [overrides]
 * @returns {Record<IconName, string>}
 */
export function resolveIcons(overrides) {
  const icons = { ...ICONS };
  for (const name of /** @type {IconName[]} */ (Object.keys(ICONS))) {
    const custom = overrides?.[name];
    if (typeof custom === 'string') icons[name] = custom;
  }
  return icons;
}

/**
 * A decorative icon: hidden from assistive technology, tagged with its name.
 * Pure string building from constants; no user data goes in here.
 *
 * @param {Record<IconName, string>} icons
 * @param {IconName} name
 * @param {string} [className] Extra class, e.g. 'spg-sort-icon'.
 * @returns {string}
 */
export function renderIcon(icons, name, className = '') {
  return `<span class="spg-icon${className ? ` ${className}` : ''}" data-icon="${name}" aria-hidden="true">${icons[name]}</span>`;
}
