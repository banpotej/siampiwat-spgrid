// @ts-check
import { escapeHtml } from './utils/escape.js';
import './datagrid.css';

/** @typedef {import('./types.js').DataGridOptions} DataGridOptions */
/** @typedef {import('./types.js').Row} Row */

export class DataGrid {
  /** @type {HTMLElement} */
  #container;
  /** @type {DataGridOptions['columns']} */
  #columns;
  /** @type {Row[]} */
  #rows;

  /**
   * @param {HTMLElement} container
   * @param {DataGridOptions} options
   */
  constructor(container, options) {
    if (!(container instanceof HTMLElement)) {
      throw new TypeError('DataGrid: container must be an HTMLElement');
    }
    this.#container = container;
    this.#columns = options.columns;
    this.#rows = options.rows ?? [];
    this.render();
  }

  /** @param {Row[]} rows */
  setRows(rows) {
    this.#rows = rows;
    this.render();
  }

  render() {
    const head = this.#columns
      .map((c) => `<th scope="col">${escapeHtml(c.label ?? c.key)}</th>`)
      .join('');
    const body = this.#rows
      .map((row) => {
        const cells = this.#columns.map((c) => `<td>${escapeHtml(row[c.key])}</td>`).join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');
    this.#container.innerHTML = `<table class="dg-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  }

  destroy() {
    this.#container.innerHTML = '';
  }
}
