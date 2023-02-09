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
import { createFeathersClientAdapter } from '@tabular-state/api-feathers';

const store = createStore<Tables>({});

const feathersClient = feathers();
// ... configure feathers client

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
