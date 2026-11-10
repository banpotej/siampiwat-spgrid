// @ts-check
import { computeView } from '../core/view.js';

/**
 * How many rows a grid would show with `conditions` as its advanced filter (the search and the column filters stay), before
 * paging. Pure: the grid is not changed.
 *
 * @param {import('../types.js').GridState} state
 * @param {{ locale?: string, hidden?: string[] }} options As for `computeView`.
 * @param {import('../types.js').GridState['conditions']} conditions
 * @returns {{ shown: number, total: number }} `total`: every row, before any filter.
 * @throws {RangeError} `conditions` names an unknown column, or an operator the column does not take
 */
export function previewCount(state, options, conditions) {
  const { total } = computeView({ ...state, conditions, pageSize: null }, options);
  return { shown: total, total: state.rows.length };
}
