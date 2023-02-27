/* eslint-disable class-methods-use-this */
import type { Database } from './types';

type Id = string | number;
type Item = any; // eslint-disable-line @typescript-eslint/no-explicit-any

export class MemoryDatabase implements Database {
  namespace = 'default';

  constructor(namespace = 'default') {
    this.namespace = namespace;
    this.setNamespace(namespace);
  }

  private data: Record<string, Map<string, Item>> = {
    default: new Map<string, Item>(),
  };

  setNamespace(namespace: string) {
    Object.assign(this.data, {
      [namespace]: new Map(),
    });
    this.namespace = namespace;
  }

  private buildKey(tableName: string, itemId: string | number) {
    return `${tableName}/-/${itemId}`;
  }

  setItem(tableName: string, itemId: Id, value: Item) {
    return new Promise<void>((res) => {
      this.data[this.namespace].set(this.buildKey(tableName, itemId), value);
      res();
    });
  }

  setItems(tableName: string, items: [itemId: Id, value: Item][]) {
    return new Promise<void>((res) => {
      items.forEach(([itemId, value]) => {
        this.data[this.namespace].set(this.buildKey(tableName, itemId), value);
      });
      res();
    });
  }

  delItem(tableName: string, itemId: Id) {
    return new Promise<void>((res) => {
      this.data[this.namespace].delete(this.buildKey(tableName, itemId));
      res();
    });
  }

  delItems(tableName: string, itemIds?: Id[]) {
    return new Promise<void>((res) => {
      if (!itemIds) {
        this.data[this.namespace].forEach((v, key) => {
          if (key.startsWith(`${tableName}:`)) {
            this.data[this.namespace].delete(key);
          }
        });
      } else {
        itemIds.forEach((itemId) => {
          this.data[this.namespace].delete(this.buildKey(tableName, itemId));
        });
      }
      res();
    });
  }

  getItem(tableName: string, itemId: Id) {
    return new Promise<Item>((res) => {
      const value = this.data[this.namespace].get(this.buildKey(tableName, itemId));
      res(value);
    });
  }

  getItems(tableName: string, itemIds?: Id[]) {
    return new Promise<Item[]>((res) => {
      if (!itemIds) {
        let values = Array.from(this.data[this.namespace].entries());
        values = values
          .filter(([k]) => {
            return k.startsWith(`${tableName}/`);
          })
          .map(([, v]) => v);
        res(values);
      } else {
        const values = itemIds.map((itemId) => {
          return this.data[this.namespace].get(this.buildKey(tableName, itemId));
        });
        res(values);
      }
    });
  }

  getAllItems() {
    return new Promise<Record<string, Item[]>>((res) => {
      const values = this.data[this.namespace].entries();
      res(Object.fromEntries(values));
    });
  }

  clear() {
    return new Promise<void>((res) => {
      this.data[this.namespace].clear();
      res();
    });
  }
}

export const createMemoryDbAdapter = (namespace?: string): Database => {
  return new MemoryDatabase(namespace);
};
