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
 * @param {string} [className] Extra class, e.g. 'dg-sort-icon'.
 * @returns {string}
 */
export function renderIcon(icons, name, className = '') {
  return `<span class="dg-icon${className ? ` ${className}` : ''}" data-icon="${name}" aria-hidden="true">${icons[name]}</span>`;
}
