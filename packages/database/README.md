# @tabular-state/database

A database adapter for [@tabular-state/store](../store/README.md) to persist state in IndexedDB.

> **Warning**
> Persisting state is currently only supported in browsers with indexeddb support.

```ts
import { createStore } from '@tabular-state/store';

const store = createStore<Tables>({
  persistentTables: [
    // [TableName, IdField]
    ['users', 'id'],
  ],
  onRevalidate(tableName: 'users', itemIds: number[]) {
    // do something after persisted state has been loaded
  },
});
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

const database = ceateIndexedDbAdapter();
// or with namespace
const database = ceateIndexedDbAdapter('account-1');

store.setDatabase(database, () => {
  // do something after persisted state has been loaded
});
```

## Namespaces

It is possible to implement splitted databases by switching the database namespace. A possible use case is an application where the user can switch between multiple accounts and or workspaces.

```ts
database.setNamespace('account-2');
// needs to replace state with persisted state from other namespace
store.setDatabase(database);
```
