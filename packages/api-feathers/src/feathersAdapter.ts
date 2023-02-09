import type { Application } from '@feathersjs/feathers';
import type { Store } from '@tabular-state/store';

import { hooks } from './hooks';

export type FeathersTabularStateAdapterService = {
  idField: string;
  tableName?: string;
  events?: ('created' | 'updated' | 'patched' | 'removed')[];
  optimistic?: boolean;
};

export interface FeathersClientAdapter<S> {
  store: S;
  services: Record<string, FeathersTabularStateAdapterService>;
  dynamicServices?: (
    path: string,
  ) =>
    | (Omit<FeathersTabularStateAdapterService, 'tableName' | 'events'> & { tableName: string })
    | null;
}

export function createFeathersClientAdapter<S extends Store<any>>(
  options: FeathersClientAdapter<S>,
) {
  const { services, store } = options;

  return (app: Application) => {
    Object.entries(services).forEach(([path, service]) => {
      const { idField, tableName, events } = service;
      const feathersService = app.service(path);

      // listen to events if possible
      if (events && events.length > 0 && !!feathersService.on) {
        events.forEach((event) => {
          feathersService.on(event, (data) => {
            if (!data) return;
            const id = data[idField];
            if (!id) return;
            if (['created', 'updated', 'patched'].includes(event)) {
              store.setRow(tableName || path, id, data);
            } else if (event === 'removed') {
              store.delRow(tableName || path, id);
            }
          });
        });
      }
    });

    app.hooks({
      before: {
        // TODO: implement optimistic updates
        // patch: [hooks.optimisticSetItems(options)],
        // update: [hooks.optimisticSetItems(options)],
        // remove: [hooks.optimisticDelItems(options)],
      },
      after: {
        find: [hooks.setItems(options)],
        get: [hooks.setItems(options)],
        patch: [hooks.setItems(options)],
        update: [hooks.setItems(options)],
        remove: [hooks.delItems(options)],
      },
      error: {
        // patch: [hooks.rollbackOptimisticSetItems(options)],
        // update: [hooks.rollbackOptimisticSetItems(options)],
        // remove: [hooks.rollbackOptimisticDelItems(options)],
      },
    });
  };
}
