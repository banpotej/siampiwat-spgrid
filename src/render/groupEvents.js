// @ts-check

/**
 * Bind the group headers of the persistent table host: a click on a header's button (or Enter / Space on it, which
 * the browser turns into a click) reports the group's id.
 *
 * @param {HTMLElement} host
 * @param {(id: string) => void} onToggle
 * @returns {() => void} Unbind.
 */
export function bindGroupToggle(host, onToggle) {
  /** @param {MouseEvent} e */
  const onClick = (e) => {
    const target = e.target instanceof Element ? e.target : null;
    const row = target?.closest('.spg-group-toggle')?.closest('tr.spg-group-row');
    if (row instanceof HTMLElement && host.contains(row)) onToggle(row.dataset.groupId ?? '');
  };
  host.addEventListener('click', onClick);
  return () => host.removeEventListener('click', onClick);
}
