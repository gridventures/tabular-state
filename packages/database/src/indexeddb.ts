/* eslint-disable class-methods-use-this */
import type { UseStore } from 'idb-keyval';

import {
  entries,
  get,
  delMany,
  getMany,
  keys,
  del,
  createStore,
  set,
  setMany,
  clear,
} from 'idb-keyval';

import { DatabaseId, Database, DatabaseItem } from './types';

export class IndexedDbAdapter implements Database {
  namespace: string;

  private idb: UseStore;

  constructor(namespace = 'default') {
    this.namespace = namespace;
    this.idb = createStore(namespace, 'keyval');
  }

  public setNamespace(namespace: string) {
    this.namespace = namespace;
    this.idb = createStore(namespace, 'keyval');
  }

  private buildKey(tableName: string, itemId: DatabaseId) {
    return `${tableName}/-/${itemId}`;
  }

  private getTableAndIdByKey(key: IDBValidKey) {
    const [tableName, itemId] = key.toString().split('/-/');
    return [tableName, itemId];
  }

  private async getAllKeys(tableName: string) {
    const allKeys = await keys(this.idb);
    const tableKeys = allKeys.filter((key) => key.toString().includes(`${tableName}/`));
    return tableKeys;
  }

  public async setItem(tableName: string, itemId: DatabaseId, value: DatabaseItem) {
    await set(this.buildKey(tableName, itemId), value, this.idb);
  }

  public async setItems(tableName: string, items: [itemId: DatabaseId, value: DatabaseItem][]) {
    await setMany(
      items.map(([itemId, value]) => [this.buildKey(tableName, itemId), value]),
      this.idb,
    );
  }

  public async delItem(tableName: string, itemId: DatabaseId) {
    await del(this.buildKey(tableName, itemId), this.idb);
  }

  public async delItems(tableName: string, itemIds?: DatabaseId[]) {
    if (itemIds) {
      await delMany(
        itemIds.map((itemId) => this.buildKey(tableName, itemId)),
        this.idb,
      );
      return;
    }
    const tableKeys = await this.getAllKeys(tableName);
    await delMany(tableKeys, this.idb);
  }

  public async getItem(tableName: string, itemId: DatabaseId) {
    const items = await get(this.buildKey(tableName, itemId), this.idb);
    return items;
  }

  public async getItems(tableName: string, itemIds?: DatabaseId[]) {
    if (itemIds) {
      const items = await getMany(
        itemIds.map((itemId) => this.buildKey(tableName, itemId)),
        this.idb,
      );
      return items;
    }
    const tableKeys = await this.getAllKeys(tableName);
    const items = await getMany(tableKeys, this.idb);
    return items;
  }

  public async getAllItems() {
    const items = await entries(this.idb);
    const allItems = items.reduce<Record<string, any[]>>((acc, [key, value]) => {
      const [tableName] = this.getTableAndIdByKey(key);
      if (!acc[tableName]) {
        acc[tableName] = [];
      }
      acc[tableName].push(value);
      return acc;
    }, {});
    return allItems;
  }

  public async clear() {
    await clear(this.idb);
  }
}

export const createIndexedDbAdapter = (namespace?: string): Database => {
  return new IndexedDbAdapter(namespace);
};
