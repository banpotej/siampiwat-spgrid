// @ts-check

/**
 * Minimal typed-by-name event emitter. Pure: no DOM access.
 *
 * @template {string} E
 * @param {readonly E[]} events The only event names `on` accepts.
 */
export function createEmitter(events) {
  /** @type {Map<E, Set<(payload: any) => void>>} */
  const listeners = new Map(events.map((name) => [name, new Set()]));

  return {
    /**
     * @param {E} event
     * @param {(payload: any) => void} fn
     * @returns {() => void} Unsubscribe.
     * @throws {RangeError} unknown event name
     */
    on(event, fn) {
      const set = listeners.get(event);
      if (!set) throw new RangeError(`unknown event "${event}"`);
      set.add(fn);
      return () => {
        set.delete(fn);
      };
    },

    /**
     * @param {E} event
     * @param {unknown} payload
     */
    emit(event, payload) {
      for (const fn of [...(listeners.get(event) ?? [])]) fn(payload);
    },

    clear() {
      for (const set of listeners.values()) set.clear();
    },
  };
}
