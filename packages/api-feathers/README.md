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

const store = createStore<Tables>({
  onRevalidate(tableName, itemIds) {
    feathersClient
      .service(tableName)
      .find({
        query: {
          id: {
            $in: itemIds,
          },
        },
      })
      .catch((error) => {
        // handle error
      });
  },
  onGetRow: (tableName, itemId) => {
    feathersClient
      .service(tableName)
      .get(itemId)
      .catch((error) => {
        // handle error
      });
  },
  onQueryRows: (tableName, query) => {
    const feathersQuery = toFeathersQuery(query);
    feathersClient
      .service(tableName)
      .find({
        query: feathersQuery,
      })
      .catch((error) => {
        // handle error
      });
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
