// @ts-check

/**
 * Bind one delegated "input" listener to the static toolbar and debounce it:
 * `onSearch` gets the input's value once typing has paused for `debounce` ms.
 * The returned function removes the listener and cancels a pending call.
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
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      onSearch(input.value);
    }, debounce);
  };

  toolbar.addEventListener('input', onInput);
  return () => {
    clearTimeout(timer);
    timer = undefined;
    toolbar.removeEventListener('input', onInput);
  };
}
