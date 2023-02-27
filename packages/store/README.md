# @tabular-state/store

Tabular-State is a simple and reactive state mangement solution based on tables, rows and cells.
Under the hood it uses observables from [@legendapp/state](https://npmjs.com/package/@legendapp/state) which is a super fast and powerful state manager for JavaScript apps.

Tabular-State brings also the possibility to [query](#querying) and [persist state](../database/).

> **Warning**
> Tabular-State is in early stage and **not yet ready** for production

## Install

```bash
npm install @tabular-state/store
```

```bash
pnpm install @tabular-state/store
```

```bash
yarn add @tabular-state/store
```

## Basic Usage

```ts
import { createStore } from '@tabular-state/store';

type Tables = {
  users: {
    idField: number; // could be string or number
    item: {
      id: string;
      name: string;
      age: number;
    };
  };
  posts: {
    idField: string;
    item: {
      id: string;
      title: string;
      content: string;
      authorId: string;
      createdAt: string;
    };
  };
};

const store = createStore<Tables>();
```

## Set and Get Tables

```ts
import { ObservableObject } from '@legendapp/state';

// write
store.setTable('users');

// read
/**
 * @returns {ObservableObject<Tables['users']>}
 */
const users = store.getTable('users');
console.log(users.peek());
console.log(users.get());
```

## Set and Get Rows

> **Note**
> Rows are managed by the store and are not directly accessible. You can only get a row by its id.

For reactivity have a look into [Legend-State Docs](https://www.legendapp.com/open-source/state/reactivity/).

```ts
import { ObservableObject } from '@legendapp/state';

// write
setRow('users', 1, {
  id: 1,
  name: 'John Doe',
  age: 42,
});

// read
/**
 * @returns {ObservableObject<Tables['users']['item']>}
 */
const user = store.getRow('users', 1);
console.log(user.peek());
console.log(user.get());
```

## Set and Get Cells

> **Note**
> Cells are managed by the store and are not directly accessible. You can only get a cell by its key.

For reactivity have a look into [Legend-State Docs](https://www.legendapp.com/open-source/state/reactivity/).

```ts
import { ObservableObject } from '@legendapp/state';

// read
/**
 * @returns {ObservableObject<Tables['users']['item']['age']>}
 */
const userAge = store.getCell('users', 1, 'age');
console.log(userAge.peek()); // 42
console.log(userAge.get()); // 42

// write
setCell('users', 1, 'age', 43);
console.log(userAge.peek()); // 43
```

## Querying

Querying is based on [sift](https://www.npmjs.com/package/sift) which is a mongo-query like implementation for JavaScript.

```ts
const [results, queryFn, queryMeta] = store.queryRows('posts', {
  query: { authorId: user.peek().id },
  limit: 5,
  skip: 0,
  sort: { createdAt: 1 }, // 1 = asc, -1 = desc
  select: ['id', 'title', 'createdAt'],
  style: 'paginated', // paginated | infinite
});

// read
console.log(results.peek()); // [{ id: '1', title: 'Hello World', createdAt: '2021-01-01' }]
console.log(results.get());
```

### Query Pagination

Property `style` defines in which form the pagination works.

```ts
/**
 * paginated: The query will return the items from the current
 * infinite: The query will get bigger on every page change.
 * @default infinite
 */
type PaginationStyle = 'paginated' | 'infinite';

type QueryFn = {
  // if possible will open/load next page
  next(): void;
  // if possible will open previous page or unload items from the current page
  prev(): void;
};

queryFn.next();
queryFn.prev();
```

### Query Meta

```ts
type QueryMeta = {
  // current page
  page: Observable<number>;
  // number of items per page
  pageSize: ObservableComputed<number>;
  // total number of items
  total: Observable<number>;
  // if there is a next page
  canShowMore: ObservableComputed<boolean>;
};

// read
console.log(queryMeta.page.peek());
console.log(queryMeta.page.get());

console.log(queryMeta.pageSize.peek());
console.log(queryMeta.pageSize.get());

console.log(queryMeta.total.peek());
console.log(queryMeta.total.get());

console.log(queryMeta.canShowMore.peek());
console.log(queryMeta.canShowMore.get());
```

## Mount hooks to listen to reads

You can listen to all reads by using hooks (before, after, error) on the methods `getTable`, `getRow`, `getCell` and `queryRows`.

```ts
const store = createStore();

const dispose = store.hook('before', 'getRow', (ctx) => {
  // ctx.method = 'getRow'
  // ctx.params.table = the table on which the method was called
  // ctx.params.rowId = the id of the row
});

dispose(); // remove hook

store.hook('before', 'getTable', (ctx) => {
  // ctx.method = 'getRow'
  // ctx.params.table = the table on which the method was called
});

store.hook('before', 'getCell', (ctx) => {
  // ctx.method = 'getRow'
  // ctx.params.table = the table on which the method was called
  // ctx.params.rowId = the id of the row
  // ctx.params.cellKey = the key of the cell
});

store.hook('before', 'queryRows', (ctx) => {
  // ctx.method = 'queryRows'
  // ctx.params.table = the table on which the method was called
  // ctx.params.query = the query object
});
```
