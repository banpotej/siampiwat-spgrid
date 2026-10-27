// @ts-check

/** @typedef {import('../types.js').Row} Row */
/** @typedef {import('../types.js').SortDirection} SortDirection */

const DEFAULT_LOCALE = 'th';

/**
 * Dates compare by timestamp, booleans as false < true; everything else is as-is.
 *
 * @param {unknown} v
 * @returns {unknown}
 */
const normalize = (v) => (v instanceof Date ? v.getTime() : typeof v === 'boolean' ? Number(v) : v);

/**
 * null, undefined and NaN (including invalid Dates) count as "no value".
 *
 * @param {unknown} v
 * @returns {boolean}
 */
const isNil = (v) => v === null || v === undefined || (typeof v === 'number' && Number.isNaN(v));

/**
 * Sort rows by one column. Pure: returns a new array, never mutates `rows`.
 * Stable; null/undefined/NaN values sort last in both directions.
 *
 * @param {Row[]} rows
 * @param {{ key: string, direction?: SortDirection | null } | null} [sort]
 * @param {{ locale?: string }} [options] Collator locale for strings; default 'th'.
 * @returns {Row[]}
 */
export function sortRows(rows, sort, options = {}) {
  const out = [...rows];
  if (!sort || !sort.direction) return out;

  const { key, direction } = sort;
  const sign = direction === 'desc' ? -1 : 1;
  const collator = new Intl.Collator(options.locale ?? DEFAULT_LOCALE, { numeric: true });

  /** @type {(a: unknown, b: unknown) => number} */
  const compare = (a, b) => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return collator.compare(String(a), String(b));
  };

  // Array.prototype.sort is stable (ES2019), so ties keep original order.
  return out.sort((ra, rb) => {
    const a = normalize(ra[key]);
    const b = normalize(rb[key]);
    const aNil = isNil(a);
    const bNil = isNil(b);
    if (aNil || bNil) return aNil === bNil ? 0 : aNil ? 1 : -1;
    return sign * compare(a, b);
  });
}

/**
 * Next direction in the header-click cycle: null -> 'asc' -> 'desc' -> null.
 *
 * @param {SortDirection | null | undefined} current
 * @returns {SortDirection | null}
 */
export function nextDirection(current) {
  if (current === 'asc') return 'desc';
  if (current === 'desc') return null;
  return 'asc';
}
