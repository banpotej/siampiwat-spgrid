// @ts-check
import { rangeText } from './searchValue.js';

/**
 * Show the clear button only while the input has text; never while the input is replaced by the enum value select
 * (the select has its "All" option for that). The date boxes keep it: it clears them.
 * @param {HTMLInputElement} input
 */
export function syncClearButton(input) {
  const clear = input.parentElement?.querySelector('.spg-search-clear');
  const enumShown = !!input.parentElement?.querySelector('.spg-search-value:not([hidden])');
  if (clear instanceof HTMLElement) clear.hidden = enumShown || input.value === '';
}

/**
 * Offer only the visible columns in the search column select (a hidden column's option is hidden and disabled).
 * @param {HTMLSelectElement | null} select
 * @param {string[]} hidden Keys of the hidden columns.
 */
export function syncSearchColumns(select, hidden) {
  if (!select) return;
  for (const option of select.options) {
    option.hidden = option.disabled = option.value !== '' && hidden.includes(option.value);
  }
}

/**
 * Bind the toolbar's delegated listeners: "input" is debounced, and `onSearch`
 * gets the input's value once typing has paused for `debounce` ms. With `submit`, typing
 * only updates the clear button; `onSearch` runs on Enter or a click on the Search button. A click on
 * the search column select, if any, reports its choice through `onColumn`; a click on
 * the clear button (or, with `submit`, the Clear search button, which also puts the column select back on all columns) empties the input, searches at once (dropping a pending
 * debounce) and gives focus back to the input. The returned function removes
 * the listeners and cancels a pending call.
 *
 * @param {HTMLElement} toolbar
 * @param {HTMLInputElement} input
 * @param {{ debounce: number, submit?: boolean, onSearch: (value: string) => void, onColumn?: (key: string | null) => void,
 *   valueSelect?: HTMLSelectElement | null, dateRange?: HTMLElement | null }} opts `valueSelect`: the enum value select; choosing a
 *   value searches at once and is mirrored into `input`. `dateRange`: the from / to date boxes, mirrored the same way as 'FROM..TO'.
 * @returns {() => void} Unbind.
 */
export function bindSearchEvents(
  toolbar,
  input,
  { debounce, submit = false, onSearch, onColumn, valueSelect = null, dateRange = null },
) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;

  /** @param {Event} e */
  const onInput = (e) => {
    if (e.target !== input) return;
    syncClearButton(input);
    if (submit) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      onSearch(input.value);
    }, debounce);
  };

  /** @param {Event} e */
  const onClick = (e) => {
    if (e.target instanceof Element && e.target.closest('.spg-search-submit')) {
      onSearch(input.value);
      return;
    }
    const clear =
      e.target instanceof Element ? e.target.closest('.spg-search-clear, .spg-search-reset') : null;
    if (!clear || !toolbar.contains(clear)) return;
    clearTimeout(timer);
    timer = undefined;
    input.value = '';
    if (valueSelect) valueSelect.value = '';
    dateRange?.querySelectorAll('input').forEach((box) => (box.value = ''));
    syncClearButton(input);
    onSearch('');
    if (clear.classList.contains('spg-search-reset')) onColumn?.(null);
    const shown = [input, valueSelect, dateRange?.querySelector('input')].find(
      (el) => el && !el.closest('[hidden]') && !el.hidden,
    );
    /** @type {HTMLElement} */ (shown ?? input).focus();
  };

  /** @param {KeyboardEvent} e */
  const onKeyDown = (e) => {
    if (!submit || e.target !== input || e.key !== 'Enter' || e.isComposing) return;
    e.preventDefault();
    onSearch(input.value);
  };

  /** @param {Event} e */
  const onChange = (e) => {
    const select = e.target;
    if (dateRange && select instanceof HTMLInputElement && dateRange.contains(select)) {
      input.value = rangeText(dateRange);
      syncClearButton(input);
      clearTimeout(timer);
      timer = undefined;
      onSearch(input.value);
      return;
    }
    if (select === valueSelect && valueSelect) {
      input.value = valueSelect.value;
      syncClearButton(input);
      clearTimeout(timer);
      timer = undefined;
      onSearch(input.value);
      return;
    }
    if (!(select instanceof HTMLSelectElement) || !select.classList.contains('spg-search-column')) {
      return;
    }
    onColumn?.(select.value === '' ? null : select.value);
  };

  toolbar.addEventListener('input', onInput);
  toolbar.addEventListener('click', onClick);
  toolbar.addEventListener('change', onChange);
  toolbar.addEventListener('keydown', onKeyDown);
  return () => {
    clearTimeout(timer);
    timer = undefined;
    toolbar.removeEventListener('input', onInput);
    toolbar.removeEventListener('click', onClick);
    toolbar.removeEventListener('change', onChange);
    toolbar.removeEventListener('keydown', onKeyDown);
  };
}
