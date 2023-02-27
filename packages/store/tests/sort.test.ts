import { describe, it, expect } from 'vitest';

import { siftSort } from '../src/utils/sort';

describe('siftSort', () => {
  it('should sort by integer field', () => {
    const items = [
      { id: 2, name: 'John' },
      { id: 1, name: 'Jane' },
      { id: 3, name: 'Michael' },
    ];
    const sorted = items.sort(siftSort({ id: 1 }));
    expect(sorted[0].id).toBe(1);
    const sorted2 = items.sort(siftSort({ id: -1 }));
    expect(sorted2[0].id).toBe(3);
  });

  it('should sort by string field', () => {
    const items = [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
      { id: 3, name: 'Michael' },
    ];
    const sorted = items.sort(siftSort({ name: 1 }));
    expect(sorted[0].name).toBe('Jane');
    const sorted2 = items.sort(siftSort({ name: -1 }));
    expect(sorted2[0].name).toBe('Michael');
  });

  it('should sort by boolean field', () => {
    const items = [
      { id: 1, name: 'John', active: false },
      { id: 2, name: 'Jane', active: true },
      { id: 3, name: 'Michael', active: false },
    ];
    const sorted = items.sort(siftSort({ active: 1 }));
    expect(sorted[0].active).toBe(false);
    const sorted2 = items.sort(siftSort({ active: -1 }));
    expect(sorted2[0].active).toBe(true);
  });

  it('should sort by date field', () => {
    const items = [
      { id: 1, name: 'John', date: new Date('2020-01-01') },
      { id: 2, name: 'Jane', date: new Date('2020-01-02') },
      { id: 3, name: 'Michael', date: new Date('2020-01-03') },
    ];
    const sorted = items.sort(siftSort({ date: 1 }));
    expect(sorted[0].date).toEqual(new Date('2020-01-01'));
    const sorted2 = items.sort(siftSort({ date: -1 }));
    expect(sorted2[0].date).toEqual(new Date('2020-01-03'));
  });

  it('should sort by multiple fields', () => {
    const items = [
      {
        id: 1,
        name: 'John',
        date: new Date('2020-01-01'),
        obj: { count: 3 },
        nullish: null,
        undef: undefined,
      },
      {
        id: 2,
        name: 'Jane',
        date: new Date('2020-01-02'),
        obj: { count: 1 },
        nullish: null,
        undef: undefined,
      },
      { id: 3, name: 'Michael', date: null, obj: { count: 2 }, nullish: null, undef: undefined },
    ];
    const sorted = items.sort(siftSort({ obj: 1, nullish: 1, undef: 1 }));
    expect(sorted[0].date).toEqual(new Date('2020-01-01'));
    const sorted2 = items.sort(siftSort({ obj: -1, nullish: -1, undef: -1 }));
    expect(sorted2[0].date).toEqual(new Date('2020-01-01'));
  });
});
