// @ts-check

/**
 * @template {object} S
 * @typedef {(state: S, prev: S) => void} Listener
 */

/**
 * @template {object} S
 * @typedef {object} State
 * @property {() => S} get Current immutable snapshot.
 * @property {(partial: Partial<S>) => void} set Shallow-merge `partial`; notifies once if any value changed.
 * @property {(fn: Listener<S>) => () => void} subscribe Returns an unsubscribe function.
 */

/**
 * Create a minimal observable state store. Pure: no DOM access.
 *
 * @template {object} S
 * @param {S} initial
 * @returns {State<S>}
 */
export function createState(initial) {
  let state = { ...initial };
  /** @type {Set<Listener<S>>} */
  const listeners = new Set();

  return {
    get: () => state,

    set(partial) {
      const changed = Object.keys(partial).some(
        (key) =>
          !Object.is(state[/** @type {keyof S} */ (key)], partial[/** @type {keyof S} */ (key)]),
      );
      if (!changed) return;
      const prev = state;
      state = { ...prev, ...partial };
      for (const fn of [...listeners]) fn(state, prev);
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
  };
}
