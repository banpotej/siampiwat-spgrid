// @ts-check

/** Page to go to for each step button; setPage clamps it into range. @type {Record<string, (page: number) => number>} */
const TARGET = {
  first: () => 1,
  prev: (page) => page - 1,
  next: (page) => page + 1,
  last: () => Infinity,
};

/**
 * Bind the pager's delegated listeners to its (persistent) container: ONE
 * click listener for First/Prev/Next/Last/page buttons, and one change listener for the
 * page size select. Returns a function that removes both.
 *
 * Re-rendering replaces the pager's content, so focus is put back afterwards:
 * on the clicked page button, on the step button while enabled, otherwise on the
 * <nav> itself (so keyboard users are not thrown back to the top of the page).
 *
 * @param {HTMLElement} host
 * @param {{ getPage: () => number, setPage: (page: number) => void, setPageSize: (n: number) => void }} grid
 * @returns {() => void} Unbind.
 */
export function bindPagerEvents(host, { getPage, setPage, setPageSize }) {
  /** @param {string} selector */
  const focus = (selector) => {
    const target = host.querySelector(selector) ?? host.querySelector('nav');
    if (target instanceof HTMLElement) target.focus();
  };

  /** @param {Event} e */
  const onClick = (e) => {
    const button = e.target instanceof Element ? e.target.closest('button') : null;
    if (!button || button.disabled || !host.contains(button)) return;
    const { page, action } = button.dataset;
    if (page !== undefined) {
      setPage(Number(page));
      focus(`button[data-page="${Number(page)}"]`);
    } else if (action && Object.hasOwn(TARGET, action)) {
      setPage(TARGET[action](getPage()));
      focus(`button[data-action="${action}"]:not(:disabled)`);
    }
  };

  /** @param {Event} e */
  const onChange = (e) => {
    if (!(e.target instanceof HTMLSelectElement)) return;
    setPageSize(Number(e.target.value));
    focus('select');
  };

  host.addEventListener('click', onClick);
  host.addEventListener('change', onChange);
  return () => {
    host.removeEventListener('click', onClick);
    host.removeEventListener('change', onChange);
  };
}
