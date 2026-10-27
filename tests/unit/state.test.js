import { describe, expect, it, vi } from 'vitest';
import { createState } from '../../src/core/state.js';

describe('createState', () => {
  it('returns { get, set, subscribe }', () => {
    const state = createState({ a: 1 });
    expect(typeof state.get).toBe('function');
    expect(typeof state.set).toBe('function');
    expect(typeof state.subscribe).toBe('function');
  });

  it('get returns the initial state', () => {
    expect(createState({ a: 1, b: 'x' }).get()).toEqual({ a: 1, b: 'x' });
  });

  it('does not share the initial object', () => {
    const initial = { a: 1 };
    const state = createState(initial);
    initial.a = 2;
    expect(state.get().a).toBe(1);
  });

  it('set merges a partial into the state', () => {
    const state = createState({ a: 1, b: 2 });
    state.set({ b: 3 });
    expect(state.get()).toEqual({ a: 1, b: 3 });
  });

  it('set replaces the snapshot instead of mutating it', () => {
    const state = createState({ a: 1 });
    const before = state.get();
    state.set({ a: 2 });
    expect(before.a).toBe(1);
    expect(state.get()).not.toBe(before);
  });

  it('notifies subscribers once per set with the new and previous state', () => {
    const state = createState({ a: 1, b: 1 });
    const fn = vi.fn();
    state.subscribe(fn);
    state.set({ a: 2, b: 2 });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith({ a: 2, b: 2 }, { a: 1, b: 1 });
  });

  it('does not notify when nothing changed', () => {
    const state = createState({ a: 1 });
    const fn = vi.fn();
    state.subscribe(fn);
    state.set({ a: 1 });
    state.set({});
    expect(fn).not.toHaveBeenCalled();
  });

  it('keeps the same snapshot when nothing changed', () => {
    const state = createState({ a: 1 });
    const before = state.get();
    state.set({ a: 1 });
    expect(state.get()).toBe(before);
  });

  it('compares values with Object.is', () => {
    const state = createState({ n: NaN, rows: [] });
    const fn = vi.fn();
    state.subscribe(fn);
    state.set({ n: NaN });
    expect(fn).not.toHaveBeenCalled();
    state.set({ rows: [] });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('notifies every subscriber', () => {
    const state = createState({ a: 1 });
    const one = vi.fn();
    const two = vi.fn();
    state.subscribe(one);
    state.subscribe(two);
    state.set({ a: 2 });
    expect(one).toHaveBeenCalledTimes(1);
    expect(two).toHaveBeenCalledTimes(1);
  });

  it('passes the same new and previous state to every subscriber', () => {
    const state = createState({ a: 1 });
    const one = vi.fn();
    const two = vi.fn();
    state.subscribe(one);
    state.subscribe(two);
    state.set({ a: 2 });
    expect(one).toHaveBeenCalledWith({ a: 2 }, { a: 1 });
    expect(two).toHaveBeenCalledWith({ a: 2 }, { a: 1 });
  });

  it('subscribe returns an unsubscribe function', () => {
    const state = createState({ a: 1 });
    const fn = vi.fn();
    const unsubscribe = state.subscribe(fn);
    state.set({ a: 2 });
    unsubscribe();
    state.set({ a: 3 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('unsubscribe is idempotent and leaves other subscribers alone', () => {
    const state = createState({ a: 1 });
    const one = vi.fn();
    const two = vi.fn();
    const unsubscribe = state.subscribe(one);
    state.subscribe(two);
    unsubscribe();
    unsubscribe();
    state.set({ a: 2 });
    expect(one).not.toHaveBeenCalled();
    expect(two).toHaveBeenCalledTimes(1);
  });

  it('a subscriber unsubscribing during notify does not skip others', () => {
    const state = createState({ a: 1 });
    const second = vi.fn();
    const unsubscribe = state.subscribe(() => unsubscribe());
    state.subscribe(second);
    state.set({ a: 2 });
    expect(second).toHaveBeenCalledTimes(1);
  });
});
