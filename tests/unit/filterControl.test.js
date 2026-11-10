import { describe, expect, it } from 'vitest';
import { createState } from '../../src/core/state.js';
import { FilterControl } from '../../src/render/filterControl.js';
import { initialState, initialView, mountParts } from '../../src/render/gridSetup.js';

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
];
const rows = [{ id: 1, name: 'Ada', role: 'Engineer' }];

const make = () => {
  const options = { columns, rows, searchable: true, searchColumnSelect: true };
  const { shell } = mountParts(document.createElement('div'), options);
  const state = createState(initialState(options, columns, initialView(options)));
  return { control: new FilterControl(shell, state), state, shell };
};

describe('FilterControl', () => {
  it('starts with no filter and every column searched', () => {
    const { control } = make();
    expect(control.get()).toBeNull();
    expect(control.getSearchColumn()).toBeNull();
  });

  it('set() stores the filter, mirrors the search into the box and returns to page 1', () => {
    const { control, state, shell } = make();
    state.set({ page: 3 });
    control.set({ search: 'ada' });
    expect(control.get()).toEqual({ search: 'ada' });
    expect(shell.search?.value).toBe('ada');
    expect(state.get().page).toBe(1);
  });

  it('apply() changes the state but leaves the search box alone', () => {
    const { control, shell } = make();
    control.apply({ search: 'ada' });
    expect(control.get()).toEqual({ search: 'ada' });
    expect(shell.search?.value).toBe('');
  });

  it('reports the search column with the search text, and rejects a non-data column', () => {
    const { control } = make();
    control.setSearchColumn('name');
    control.set({ search: 'ada' });
    expect(control.get()).toEqual({ search: 'ada', searchColumn: 'name' });
    expect(() => control.setSearchColumn('nope')).toThrow(RangeError);
  });
});
