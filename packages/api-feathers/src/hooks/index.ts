import type { FeathersClientAdapter } from '../feathersAdapter';
import type { HookContext } from '@feathersjs/feathers/lib';
import type { Store } from '@tabular-state/store';

export function storeHook<S extends Store<any>>(
  cb: (options: FeathersClientAdapter<S>, ctx: HookContext) => HookContext | Promise<HookContext>,
) {
  return (options: FeathersClientAdapter<S>) => async (ctx: HookContext) => {
    await cb(options, ctx);
  };
}

function initHook<S extends Store<any>>(options: FeathersClientAdapter<S>, ctx: HookContext) {
  const { store, services, dynamicServices } = options;
  const { path, result } = ctx;

  if (!result) return null;
  const service = services[path] || (dynamicServices && dynamicServices(path)) || undefined;
  if (!service) return null;

  const { idField, tableName, optimistic } = service;
  let results: any[] = [];
  if (Array.isArray(result)) {
    results = result;
  } else if (result.data && Array.isArray(result.data)) {
    results = result.data;
  } else {
    results = [result];
  }

  return {
    store,
    ctx,
    idField,
    tableName: tableName || path,
    results,
    optimistic,
  };
}

const setItems = storeHook((o, c) => {
  const data = initHook(o, c);
  if (!data) return c;

  const { store, idField, tableName, results } = data;
  results.forEach((row) => {
    const id = row[idField];
    if (!id) return;
    store.setRow(tableName, id, row, true);
  });

  return c;
});

const delItems = storeHook((o, c) => {
  const data = initHook(o, c);
  if (!data) return c;

  const { store, idField, tableName, results } = data;
  results.forEach((row) => {
    const id = row[idField];
    if (!id) return;
    store.delRow(tableName, id);
  });

  return c;
});

const optimisticSetItems = storeHook((o, c) => {
  const data = initHook(o, c);
  if (!data) return c;

  const { optimistic } = data;

  if (!optimistic) return c;

  return c;
});

const optimisticDelItems = storeHook((o, c) => {
  const data = initHook(o, c);
  if (!data) return c;

  const { optimistic } = data;

  if (!optimistic) return c;

  return c;
});

const rollbackOptimisticSetItems = storeHook((o, c) => {
  const data = initHook(o, c);
  if (!data) return c;

  const { optimistic } = data;

  if (!optimistic) return c;

  return c;
});

const rollbackOptimisticDelItems = storeHook((o, c) => {
  const data = initHook(o, c);
  if (!data) return c;

  const { optimistic } = data;

  if (!optimistic) return c;

  return c;
});

export const hooks = {
  setItems,
  delItems,
  optimisticSetItems,
  optimisticDelItems,
  rollbackOptimisticSetItems,
  rollbackOptimisticDelItems,
};
