export type Sort<TItemSchema> = {
  [k in keyof TItemSchema]?: 1 | -1;
};

export function siftSort<T extends Record<string, any>>(sortParams: Sort<T>) {
  const entries = Object.entries(sortParams);

  return (a: T, b: T) => {
    const results = entries.map(([key, sortOpt]) => {
      const root = sortOpt === 1 ? a[key] : b[key];
      const compare = sortOpt === 1 ? b[key] : a[key];
      if (root === undefined || compare === undefined) return 0;
      if (root === null || compare === null) return 0;
      if (typeof root === 'string' && typeof compare === 'string') {
        return root.localeCompare(compare);
      }
      if (typeof root === 'boolean' && typeof compare === 'boolean') {
        const rootBool = root === true ? 1 : 0;
        const compareBool = compare === true ? 1 : 0;
        return rootBool - compareBool;
      }
      if (typeof root.getTime === 'function' && typeof compare.getTime === 'function') {
        // Is Date
        return root.getTime() - compare.getTime();
      }
      if (typeof root === 'number' && typeof compare === 'number') {
        return root - compare;
      }
      return 0;
    });

    return results.reduce((n, curr) => n || curr);
  };
}
