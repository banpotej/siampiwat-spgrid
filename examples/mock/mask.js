// Masking for the example data: personal names, vendor names and document numbers are never shown whole.
// The masks have a fixed width, so they do not reveal how long the real value is.

const MASK = '****';
// Words that describe the kind of company, not which company: they stay readable.
const LEGAL_FORMS = new Set(['บริษัท', 'จำกัด', '(มหาชน)', 'ห้างหุ้นส่วนจำกัด']);

/** Splits into what a reader sees as characters, so a Thai vowel or tone mark is never cut off its letter. */
const graphemes = (/** @type {string} */ text) =>
  Array.from(new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(text), (s) => s.segment);

/**
 * Keeps the first letter of each word: 'Nattapong Srisuk' becomes 'N**** S****'. Empty stays empty.
 * @param {string} name
 */
export function maskPerson(name) {
  if (!name) return name;
  return name
    .split(' ')
    .map((word) => graphemes(word)[0] + MASK)
    .join(' ');
}

/**
 * Keeps the legal form and the first two letters of the company name:
 * 'บริษัท พรีมาออฟฟิศ โซลูชั่นส์ จำกัด' becomes 'บริษัท พรี**** จำกัด'.
 * @param {string} name
 */
export function maskVendor(name) {
  if (!name) return name;
  const words = name.split(' ');
  const first = words.findIndex((w) => !LEGAL_FORMS.has(w));
  if (first === -1) return name;
  const last = words.findLastIndex((w) => !LEGAL_FORMS.has(w));
  const visible = graphemes(words[first]).slice(0, 2).join('');
  return [...words.slice(0, first), visible + MASK, ...words.slice(last + 1)].join(' ');
}

/**
 * Hides the digits of the serial at the end of a document number but its last `keep`:
 * '100/PO/C125423' becomes '100/PO/C**5423' (the company code and the document type stay).
 * @template {string | null} T
 * @param {T} value
 * @param {number} [keep]
 * @returns {T}
 */
export function maskNumber(value, keep = 4) {
  if (!value) return value;
  return /** @type {T} */ (
    value.replace(/\d+$/, (run) =>
      run.length <= keep ? run : '*'.repeat(run.length - keep) + run.slice(-keep),
    )
  );
}
