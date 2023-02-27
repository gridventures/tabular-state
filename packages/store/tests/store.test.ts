/* eslint-disable class-methods-use-this */
import type { HookWhat } from '../src';

import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';

import { createMemoryDbAdapter } from '../../database/src/memorydb'; // eslint-disable-line import/no-relative-packages
import { createStore } from '../src';

type Tables = {
  users: {
    idField: number; // could be string or number
    item: {
      id: number;
      name: string;
      age: number;
    };
  };
  posts: {
    idField: number;
    item: {
      id: number;
      title: string;
      content: string;
      authorId: string;
      createdAt: string;
    };
  };
};

const store = createStore<Tables>();

describe('createStore', () => {
  beforeEach(() => {
    store.setTable('users');
    store.setTable('posts');
  });

  it('should return store instance', () => {
    const store = createStore<Tables>();
    expect(store).toBeDefined();
  });

  it('should have users and posts table', () => {
    expect(store.hasTable('users')).toBe(true);
    expect(store.hasTable('posts')).toBe(true);
  });

  it('should get table', () => {
    const users = store.getTable('users');
    expect(users).toBeDefined();
  });

  it('should set and get row', () => {
    store.setRow('users', 1, {
      id: 1,
      name: 'John',
      age: 20,
    });
    const row = store.getRow('users', 1).peek();
    expect(row?.id).toBe(1);
    expect(store.hasRow('users', 1)).toBe(true);
  });

  it('should delete row', () => {
    store.setRow('users', 1, {
      id: 1,
      name: 'John',
      age: 20,
    });
    store.delRow('users', 1);
    const row = store.getRow('users', 1).peek();
    expect(row).toBeUndefined();
  });

  it('should get and set cell', () => {
    store.setRow('users', 1, {
      id: 1,
      name: 'John',
      age: 20,
    });
    const name = store.getCell('users', 1, 'name').peek();
    expect(name).toBe('John');
    store.setCell('users', 1, 'name', 'Jane');
    const name2 = store.getCell('users', 1, 'name').peek();
    expect(name2).toBe('Jane');
  });

  it('should delete cell', () => {
    store.setRow('users', 1, {
      id: 1,
      name: 'John',
      age: 20,
    });
    store.delCell('users', 1, 'name');
    const name = store.getCell('users', 1, 'name').peek();
    expect(name).toBeUndefined();
  });

  it('should delete table', () => {
    store.delTable('users');
    expect(store.hasTable('users')).toBe(false);
  });

  it('should run hooks', () => {
    const calledHooks = {
      beforeAll: false,
      afterAll: false,
      before: {
        getCell: false,
        setCell: false,
        delCell: false,
        getRow: false,
        setRow: false,
        delRow: false,
        getTable: false,
        queryRows: false,
      },
      after: {
        getCell: false,
        setCell: false,
        delCell: false,
        getRow: false,
        setRow: false,
        delRow: false,
        getTable: false,
        queryRows: false,
      },
    };

    const hookMethods = [
      ['before', Object.keys(calledHooks.before) as HookWhat[]] as const,
      ['after', Object.keys(calledHooks.after) as HookWhat[]] as const,
    ];

    hookMethods.forEach(([when, what]) => {
      what.forEach((method) => {
        const dispose = store.hook(when, method, (ctx) => {
          expect(ctx.method).toBe(method);
          expect(ctx.params.table).toBe('users');
          calledHooks[when][method] = true;
          dispose();
        });
      });
    });

    const disposeBefore = store.hook('before', () => {
      calledHooks.beforeAll = true;
      disposeBefore();
    });

    const disposeAfter = store.hook('after', () => {
      calledHooks.afterAll = true;
      disposeAfter();
    });

    store.setRow('users', 1, {
      id: 1,
      name: 'John',
      age: 20,
    });
    store.getTable('users');
    store.getCell('users', 1, 'name');
    store.setCell('users', 1, 'name', 'Jane');
    store.delCell('users', 1, 'name');
    store.getRow('users', 1);
    store.queryRows('users', {
      query: {
        name: 'John',
      },
      sort: {
        age: 1,
      },
    });
    store.delRow('users', 1);

    expect(calledHooks.beforeAll).toBe(true);
    expect(calledHooks.afterAll).toBe(true);
    expect(Object.values(calledHooks.before).every((v) => v === true)).toBe(true);
    expect(Object.values(calledHooks.after).every((v) => v === true)).toBe(true);
  });

  it('should not rerun deleted hook', () => {
    let hookBeforeCalled = 0;
    const dispose = store.hook('before', 'getCell', () => {
      hookBeforeCalled += 1;
    });
    store.getCell('users', 1, 'name');
    dispose();
    store.getCell('users', 1, 'name');
    expect(hookBeforeCalled).toBe(1);
  });

  it('should run error hook', async () => {
    return new Promise<void>((res) => {
      let hookErrorCalled = false;
      const dispose1 = store.hook('before', 'getCell', () => {
        return new Promise((res, rej) => {
          rej(new Error('test'));
          dispose1();
        });
      });
      const dispose2 = store.hook('error', () => {
        hookErrorCalled = true;
        dispose2();
        expect(hookErrorCalled).toBe(true);
        res();
      });
      store.getCell('users', 6, 'name');
    });
  });

  it('silent call should not run hooks', () => {
    let hookBeforeCalled = false;
    store.hook('before', 'getCell', () => {
      hookBeforeCalled = true;
    });
    store.getCell('users', 1, 'name', true);
    expect(hookBeforeCalled).toBe(false);
  });

  it('query rows', () => {
    const users = [
      {
        id: 1,
        name: 'John',
        age: 20,
      },
      {
        id: 2,
        name: 'Jane',
        age: 20,
      },
      {
        id: 3,
        name: 'Michael',
        age: 30,
      },
      {
        id: 4,
        name: 'Janette',
        age: 30,
      },
    ];
    users.forEach((user) => {
      store.setRow('users', user.id, user);
    });

    const [rows] = store.queryRows('users', {
      query: {
        name: 'John',
      },
    });
    expect(rows.peek().length).toBe(1);

    const [rows2] = store.queryRows('users', {
      query: {
        age: {
          $gt: 20,
        },
      },
    });
    expect(rows2.peek().length).toBe(2);

    const [paginated, fn, meta] = store.queryRows('users', {
      query: {
        age: {
          $gte: 20,
        },
      },
      sort: {
        age: 1,
      },
      limit: 2,
    });

    expect(paginated.peek().length).toBe(2);
    expect(meta.total.peek()).toBe(2);
    expect(meta.canShowMore.peek()).toBe(true);
    expect(meta.totalRowsAvailable.peek()).toBe(4);
    fn.next();
    expect(paginated.peek().length).toBe(4);
    fn.prev();
    expect(paginated.peek().length).toBe(2);
    fn.setParams({
      query: {
        age: {
          $gte: 21,
        },
      },
    });
    expect(paginated.peek().length).toBe(2);
    expect(meta.canShowMore.peek()).toBe(false);
    expect(meta.totalRowsAvailable.peek()).toBe(2);
  });

  it('should implement database plugin', async () => {
    const db = createMemoryDbAdapter({
      autoPersistTables: [['users', 'id']],
    });
    store.plugin(db);

    store.setRow('users', 1, {
      id: 1,
      name: 'John',
      age: 20,
    });

    let dbItem = await db.getItem('users', 1);
    expect(dbItem?.id).toBe(1);

    store.setCell('users', 1, 'name', 'Jane');
    dbItem = await db.getItem('users', 1);
    expect(dbItem?.name).toBe('Jane');

    store.delCell('users', 1, 'name');
    dbItem = await db.getItem('users', 1);
    expect(dbItem?.name).toBeUndefined();

    store.delRow('users', 1);
    dbItem = await db.getItem('users', 1);
    expect(dbItem).toBeUndefined();
  });

  it('cleans plugins from store', async () => {
    const db = createMemoryDbAdapter({
      autoPersistTables: [['users', 'id']],
    });
    store.plugin(db);
    store.setRow('users', 1, {
      id: 1,
      name: 'John',
      age: 20,
    });
    let dbItem = await db.getItem('users', 1);
    expect(dbItem?.id).toBe(1);
    // db plugin is removed here
    store.cleanup();
    // next change should not be persisted
    store.setCell('users', 1, 'name', 'Jane');
    dbItem = await db.getItem('users', 1);
    expect(dbItem?.name).toBe('John');
  });

  it('clears store', () => {
    store.setRow('users', 1, {
      id: 1,
      name: 'John',
      age: 20,
    });
    let row = store.getRow('users', 1).peek();
    expect(row?.id).toBe(1);
    store.clear();
    row = store.getRow('users', 1).peek();
    expect(row).toBeUndefined();
  });

  afterEach(() => {
    store.delTable('users');
    store.delTable('posts');
  });

  afterAll(() => {
    store.cleanup();
  });
});
