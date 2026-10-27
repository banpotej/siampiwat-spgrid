// @ts-check

/**
 * Show the clear button only while the input has text.
 * @param {HTMLInputElement} input
 */
export function syncClearButton(input) {
  const clear = input.parentElement?.querySelector('.dg-search-clear');
  if (clear instanceof HTMLElement) clear.hidden = input.value === '';
}

/**
 * Bind the toolbar's delegated listeners: "input" is debounced, and `onSearch`
 * gets the input's value once typing has paused for `debounce` ms; a click on
 * the clear button empties the input, searches at once (dropping a pending
 * debounce) and gives focus back to the input. The returned function removes
 * the listeners and cancels a pending call.
 *
 * @param {HTMLElement} toolbar
 * @param {HTMLInputElement} input
 * @param {{ debounce: number, onSearch: (value: string) => void }} opts
 * @returns {() => void} Unbind.
 */
export function bindSearchEvents(toolbar, input, { debounce, onSearch }) {
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer;

  /** @param {Event} e */
  const onInput = (e) => {
    if (e.target !== input) return;
    syncClearButton(input);
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      onSearch(input.value);
    }, debounce);
  };

  /** @param {Event} e */
  const onClick = (e) => {
    const clear = e.target instanceof Element ? e.target.closest('.dg-search-clear') : null;
    if (!clear || !toolbar.contains(clear)) return;
    clearTimeout(timer);
    timer = undefined;
    input.value = '';
    syncClearButton(input);
    onSearch('');
    input.focus();
  };

  toolbar.addEventListener('input', onInput);
  toolbar.addEventListener('click', onClick);
  return () => {
    clearTimeout(timer);
    timer = undefined;
    toolbar.removeEventListener('input', onInput);
    toolbar.removeEventListener('click', onClick);
  };
}
