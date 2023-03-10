/* eslint-disable class-methods-use-this */
import type { DatabaseId, Database, DatabaseItem, DatabaseOptions } from './types';
import type { PluginStore, StoreInstance } from '@tabular-state/store';
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

import { mountDatabasePlugin } from './databasePlugin';

export class IndexedDbAdapter implements Database {
  namespace: string;

  private idb: UseStore;

  private autoPersistTables: DatabaseOptions['autoPersistTables'] | undefined;

  private checkAutoPersistTables: DatabaseOptions['checkAutoPersistTables'] | undefined;

  private onRevalidate: DatabaseOptions['onRevalidate'] | undefined;

  private storeInstance: StoreInstance<any> | undefined;

  constructor(options?: DatabaseOptions) {
    this.namespace = options?.namespace || 'default';
    this.idb = createStore(this.namespace, 'keyval');
    this.autoPersistTables = options?.autoPersistTables;
    this.checkAutoPersistTables = options?.checkAutoPersistTables;
    this.onRevalidate = options?.onRevalidate;
  }

  public setNamespace(namespace: string) {
    const oldNs = this.namespace;
    this.namespace = namespace;
    this.idb = createStore(namespace, 'keyval');
    if (oldNs !== namespace && this.storeInstance) {
      this.storeInstance.clear();
      this.revalidate();
    }
  }

  private buildKey(tableName: string, itemId: DatabaseId) {
    return `${tableName}/-/${itemId}`;
  }

  private getTableAndIdByKey(key: IDBValidKey) {
    const [tableName, itemId] = key.toString().split('/-/');
    return [tableName, itemId] as const;
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

  private revalidate() {
    this.getAllItems().then((items) => {
      this.storeInstance?.batch(() => {
        Object.entries(items).forEach(([table, rows]) => {
          const autoPersistTables =
            this.autoPersistTables?.find(([t]) => t === table) ||
            this.checkAutoPersistTables?.(table);
          if (!autoPersistTables) return;
          const idField = Array.isArray(autoPersistTables)
            ? autoPersistTables[1]
            : autoPersistTables;
          const ids: DatabaseId[] = [];
          rows.forEach((row) => {
            const itemId = row[idField];
            if (!itemId) return;
            ids.push(itemId);
            this.storeInstance?.setRow(table, itemId, row, true);
          });
          this.onRevalidate?.(table, ids);
        });
      });
    });
  }

  public mount(store: PluginStore<any>) {
    this.storeInstance = store;
    this.revalidate();

    return mountDatabasePlugin(store, this, {
      autoPersistTables: this.autoPersistTables,
      checkAutoPersistTables: this.checkAutoPersistTables,
    });
  }
}

export const createIndexedDbAdapter = (options?: DatabaseOptions): Database => {
  return new IndexedDbAdapter(options);
};
