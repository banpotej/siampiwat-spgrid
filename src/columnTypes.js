// @ts-check

/** @typedef {import('./types.js').Row} Row */
/** @typedef {import('./types.js').ActionDef} ActionDef */
/** @typedef {import('./types.js').IconName} IconName */

/**
 * @typedef {object} Column
 * @property {string} key Property of the row to display.
 * @property {string} [label] Header text; defaults to `key`.
 * @property {boolean} [sortable] Header click / Enter / Space cycles asc -> desc -> none.
 * @property {'left' | 'center' | 'right'} [align] Text alignment of the header and cells; default 'left'.
 * @property {string} [width] Any CSS width, e.g. '80px'; ignored if it contains anything but a plain length.
 * @property {string} [ariaLabel] `aria-label` of the header cell; give it to columns without a label.
 * @property {(value: unknown, row: Row) => string} [render] Cell HTML. NOT escaped: the caller must escape
 *   every piece of user data it interpolates (use `escapeHtml`). Default: the escaped value.
 * @property {'text' | 'badge' | 'date' | 'boolean' | 'number'} [type] How the cell looks (default 'text', as is):
 *   `badge` = a coloured pill (see `badges`); `date` = a Date, ISO string or timestamp formatted for the grid's
 *   locale with a calendar icon; `boolean` = a check / cross chip; `number` = formatted, right-aligned figures.
 *   Blank values show a muted dash. Ignored when `render` is set. Sorting, search and export use the raw value.
 * @property {Intl.NumberFormatOptions | Intl.DateTimeFormatOptions} [format] Options for `number` (e.g.
 *   `{ style: 'currency', currency: 'THB' }`) and `date` (default `{ dateStyle: 'medium' }`).
 * @property {(string | { value: string, label?: string })[]} [options] Makes this an enum column: the values it can take
 *   (a `badge` column's `badges` keys count too). With `searchColumnSelect`, choosing it as the search column swaps the text box
 *   for a select of these values (labels escaped) and the search matches the whole cell, not a substring. Default none.
 * @property {Record<string, { tone?: 'success' | 'danger' | 'warning' | 'info' | 'neutral', icon?: IconName,
 *   label?: string }>} [badges] For `badge`: look per value (keyed by the raw value); others are neutral.
 * @property {ActionDef[]} [actions] Makes this an action column: one button per action in each row. `key` is
 *   then only an identifier; the column is never sortable, searched or filtered.
 */

export {};
