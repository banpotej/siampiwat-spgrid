// @ts-check

/**
 * The "clear search and filters" button (`clearFiltersButton`): shown only while something filters the rows, and one
 * click drops the search text, the search column, the column filters and the advanced filter (not the sort, the page
 * size or the hidden columns: that is `resetView()`).
 *
 * @param {HTMLButtonElement} button
 * @param {Pick<import('./filterControl.js').FilterControl, 'get' | 'set' | 'setSearchColumn' | 'setConditions'>} filter
 * @returns {{ update: () => void, unbind: () => void }} `update` after every state change; `unbind` on destroy.
 */
export function bindClearFilters(button, filter) {
  const onClick = () => {
    filter.set(null);
    filter.setSearchColumn(null);
    filter.setConditions(null);
  };
  const update = () => {
    button.hidden = filter.get() === null;
  };
  button.addEventListener('click', onClick);
  update();
  return { update, unbind: () => button.removeEventListener('click', onClick) };
}
