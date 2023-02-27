# @tabular-state/database

A database adapter for [@tabular-state/store](../store/README.md) to persist state in IndexedDB.

> **Warning**
> Persisting state is currently only supported in browsers with indexeddb support.

```ts
import { createStore } from '@tabular-state/store';

const store = createStore<Tables>();
```

## Using IndexedDB

Uses [idb-keyval](https://npmjs.com/package/idb-keyval) under the hood.

```bash
npm install @tabular-state/database idb-keyval
```

```bash
pnpm install @tabular-state/database idb-keyval
```

```bash
yarn add @tabular-state/database idb-keyval
```

```ts
import { createIndexedDbAdapter } from '@tabular-state/database';

const database = ceateIndexedDbAdapter({
  autoPersistTables: [['users', 'id']],
  checkAutoPersistTables(tableName) {
    if (tableName === 'any-dynamic-database') {
      return 'customIdField';
    }
    return false;
  },
  onRevalidate(table, ids) {
    // do something when persisted state has been revalidated
  },
});
// or with specific namespace
const database = ceateIndexedDbAdapter({
  namespace: 'account-1',
  // ...
});

store.plugin(database);
```

## Namespaces

It is possible to implement splitted databases by switching the database namespace. A possible use case is an application where the user can switch between multiple accounts and or workspaces.

```ts
database.setNamespace('account-2');
// this will clear current store and reload persisted state from account-2
```
