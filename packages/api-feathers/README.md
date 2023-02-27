# Feathers Client Adapter

This package provides a simple [Feathers](https://feathersjs.com/) client adapter for [@tabular-state/store](../store/README.md).

## Installation

```bash
npm install @tabular-state/api-feathers
```

```bash
pnpm install @tabular-state/api-feathers
```

```bash
yarn add @tabular-state/api-feathers
```

## Usage

```ts
import { createFeathersClientAdapter, toFeathersQuery } from '@tabular-state/api-feathers';

const feathersClient = feathers();
// ... configure feathers client

// you do not need to handle response values from feathersClient!
// response values are handled by hooks inside createFeathersClientAdapter

const store = createStore<Tables>();

store.plugin({
  mount: () => {
    const disposeGetRow = store.hook('before', 'getRow', (ctx) => {
      const { table, rowId } = ctx.params;
      feathersClient
        .service(table)
        .get(rowId)
        .catch((error) => {
          // handle error
        });
    });

    const disposeQueryRows = store.hook('before', 'queryRows', (ctx) => {
      const { table, query } = ctx.params;
      const feathersQuery = toFeathersQuery(query);
      feathersClient
        .service(table)
        .find({
          query: feathersQuery,
        })
        .catch((error) => {
          // handle error
        });
    });

    return () => {
      disposeGetRow();
      disposeQueryRows();
    };
  },
});

feathers.configure(
  createFeathersClientAdapter({
    store,
    services: {
      users: {
        events: ['created', 'updated', 'patched', 'removed'], // listen to socket events if socket.io-client is used
        idField: 'id',
        tableName: 'users',
      },
    },
    dynamicServices(path) {
      const regex = /^(\/?)custom-service\/(?<uuid>[a-zA-Z0-9-]*)\/sub-custom-service(\/?)$/d;
      const isCustomService = regex.exec(path);
      if (isCustomService && isCustomService.groups) {
        const { uuid } = isCustomService.groups;
        return {
          idField: 'id',
          tableName: `custom-service/${uuid}/sub-custom-service`,
        };
      }
      return null;
    },
  }),
);
```

## Explanation

This package provides a simple [Feathers](https://feathersjs.com/) client adapter for [@tabular-state/store](../store/README.md) by using hooks and socket events.

It uses the hooks `after.find`, `after.get`, `after.create`, `after.update`, `after.patch` and `after.remove` to update the store.
