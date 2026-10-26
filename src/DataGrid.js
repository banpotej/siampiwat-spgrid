// @ts-check
import { createState } from './core/state.js';
import { escapeHtml } from './utils/escape.js';
import './datagrid.css';

/** @typedef {import('./types.js').DataGridOptions} DataGridOptions */
/** @typedef {import('./types.js').Row} Row */

export class DataGrid {
  /** @type {HTMLElement} */
  #container;
  /** @type {import('./core/state.js').State<{ columns: DataGridOptions['columns'], rows: Row[] }>} */
  #state;
  /** @type {() => void} */
  #unsubscribe;

  /**
   * @param {HTMLElement} container
   * @param {DataGridOptions} options
   */
  constructor(container, options) {
    if (!(container instanceof HTMLElement)) {
      throw new TypeError('DataGrid: container must be an HTMLElement');
    }
    this.#container = container;
    this.#state = createState({ columns: options.columns, rows: options.rows ?? [] });
    this.#unsubscribe = this.#state.subscribe(() => this.render());
    this.render();
  }

  /** @param {Row[]} rows */
  setRows(rows) {
    this.#state.set({ rows });
  }

  render() {
    const { columns, rows } = this.#state.get();
    const head = columns
      .map((c) => `<th scope="col">${escapeHtml(c.label ?? c.key)}</th>`)
      .join('');
    const body = rows
      .map((row) => {
        const cells = columns.map((c) => `<td>${escapeHtml(row[c.key])}</td>`).join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');
    this.#container.innerHTML = `<table class="dg-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  }

  destroy() {
    this.#unsubscribe();
    this.#container.innerHTML = '';
  }
}
