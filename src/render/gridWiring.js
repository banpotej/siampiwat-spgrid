// @ts-check
import { normalizeSelectable } from '../core/selection.js';
import { createState } from '../core/state.js';
import { bindClearFilters } from './clearFilters.js';
import { ColumnOrder } from './columnOrder.js';
import { FilterControl } from './filterControl.js';
import { bindGridControls, exportHost } from './gridControls.js';
import { watchState } from './gridEvents.js';
import { initialState, initialView, mountParts } from './gridSetup.js';
import { HiddenColumns } from './hiddenColumns.js';
import { bindSelectionBar } from './selectionBar.js';
import { SelectionControl } from './selectionControl.js';

/**
 * Build everything one grid is made of and connect the parts to each other and to the grid's public methods; the
 * `SPGrid` constructor keeps the results. Nothing is drawn yet.
 *
 * @param {import('../SPGrid.js').SPGrid} grid
 * @param {HTMLElement} container
 * @param {import('../types.js').SPGridOptions} options Already checked by `assertOptions`.
 * @param {{ paging: () => import('../types.js').PageResult | null, visible: () => import('../types.js').Row[] }} shown
 *   What the grid last drew: the page, and the rows on it.
 * @param {ReturnType<typeof import('./gridEvents.js').createGridEvents>} events The grid's emitter (`grid.on` needs it while the controls bind).
 */
export function wireGrid(grid, container, options, shown, events) {
  /** @type {import('../core/state.js').State<import('../types.js').GridState>} */
  let state;
  const order = new ColumnOrder(options, (keys) => {
    state.set({ columns: order.columns() });
    events.emit('columnOrderChange', keys);
  });
  const initial = initialView(options);
  const { labels, shell, renderer } = mountParts(container, options, (calendar) =>
    events.emit('calendarChange', calendar),
  );
  const hidden = new HiddenColumns(options, shell, (keys) => {
    if (keys.includes(grid.getSearchColumn() ?? '')) grid.setSearchColumn(null);
    grid.render();
    events.emit('columnsChange', keys);
  });
  const mode = normalizeSelectable(options.selectable);
  const exporter = exportHost(() => state.get(), options, hidden);
  const unbindControls = bindGridControls(grid, shell, options, labels, {
    applyFilter: (next) => filter.apply(next),
    ...exporter,
    visible: shown.visible,
    selection: mode ? { change: (rows, on) => selection.change(rows, on) } : undefined,
    emit: (event, payload) => events.emit(event, payload),
  });
  state = createState(initialState(options, order.columns(), initial));
  const filter = new FilterControl(shell, state);
  // A filter restored from `advancedFilterStorageKey` is already on: the button shows it (no `filterChange` fired for it).
  shell.advancedButton?.toggleAttribute('data-active', filter.getConditions() !== null);
  const selection = new SelectionControl(state, mode, options.rowKey);
  const unsubscribe = watchState(state, events, grid, shown.paging);
  // The parts of the shell that follow the state: the selection bar and the clear-filters button. They update after the
  // grid has drawn (this listener comes after `watchState`'s), so they see the rows now shown.
  const followers = [
    shell.selectionBar &&
      bindSelectionBar(shell.selectionBar, {
        actions: options.selectionActions ?? [],
        labels,
        rowKey: options.rowKey,
        selection,
        state: () => state.get(),
        visible: shown.visible,
        emit: (payload) => events.emit('selectionAction', payload),
      }),
    shell.clearFiltersButton && bindClearFilters(shell.clearFiltersButton, filter),
  ].filter((part) => part != null);
  const unfollow = state.subscribe(() => followers.forEach((part) => part.update()));
  const view = /** @type {import('./viewToggles.js').ViewSettingsControl} */ (shell.view);
  return {
    state,
    renderer,
    filter,
    hidden,
    order,
    selection,
    view,
    exporter,
    /** Back to the starting view (the `resetView()` method). */
    reset() {
      grid.setFilter(null);
      grid.setSearchColumn(null);
      state.set({ ...initial, conditions: null, page: 1 });
      hidden.reset();
      order.reset();
    },
    destroy() {
      unbindControls();
      unsubscribe();
      unfollow();
      followers.forEach((part) => part.unbind());
      renderer.destroy();
      events.clear();
      container.innerHTML = '';
    },
  };
}
