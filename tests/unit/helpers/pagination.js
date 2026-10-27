import { DataGrid } from '../../../src/index.js';

export const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
];
export const rows = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `User ${i + 1}` }));

/** @param {object} [options] */
export const make = (options = {}) => {
  const el = document.createElement('div');
  const grid = new DataGrid(el, { columns, rows, pageSize: 10, ...options });
  return { el, grid };
};
/** @param {HTMLElement} el */
export const ids = (el) =>
  [...el.querySelectorAll('tbody tr:not(.dg-empty) td:first-child')].map((td) => td.textContent);
/** @param {HTMLElement} el */
export const nav = (el) => /** @type {HTMLElement} */ (el.querySelector('nav'));
/** @param {HTMLElement} el */
export const navText = (el) => [...nav(el).children].map((c) => c.textContent);
/** @param {HTMLElement} el @param {string} selector */
export const btn = (el, selector) =>
  /** @type {HTMLButtonElement} */ (nav(el).querySelector(selector));
/** @param {HTMLElement} el */
export const summary = (el) => el.querySelector('.dg-summary')?.textContent;
/** @param {HTMLElement} el @param {number} col */
export const th = (el, col) => /** @type {HTMLElement} */ (el.querySelectorAll('th')[col]);
