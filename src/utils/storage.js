// @ts-check

/**
 * @param {string} key
 * @returns {unknown} The JSON value saved under `key`, or undefined when there is none, it is not valid JSON
 *   or `localStorage` is unavailable (private mode, blocked site data).
 */
export function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

/**
 * @param {string} key
 * @param {unknown} value
 */
export function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode or a full quota: the choice just is not remembered.
  }
}
