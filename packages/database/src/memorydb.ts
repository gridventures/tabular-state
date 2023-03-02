/* eslint-disable class-methods-use-this */
import type { DatabaseId, Database, DatabaseItem, DatabaseOptions } from './types';
import type { StoreInstance, PluginStore } from '@tabular-state/store';

import { mountDatabasePlugin } from './databasePlugin';

export class MemoryDbAdapter implements Database {
  namespace = 'default';

  private data: Record<string, Map<string, DatabaseItem>> = {};

  private autoPersistTables: DatabaseOptions['autoPersistTables'] | undefined;

  private checkAutoPersistTables: DatabaseOptions['checkAutoPersistTables'] | undefined;

  private onRevalidate: DatabaseOptions['onRevalidate'] | undefined;

  private storeInstance: StoreInstance<any> | undefined;

  constructor(options?: DatabaseOptions) {
    this.autoPersistTables = options?.autoPersistTables;
    this.checkAutoPersistTables = options?.checkAutoPersistTables;
    this.onRevalidate = options?.onRevalidate;
    this.setNamespace(options?.namespace || 'default');
  }

  public setNamespace(namespace: string) {
    const oldNs = this.namespace;
    this.namespace = namespace;
    if (!this.data[namespace]) {
      this.data[namespace] = new Map();
    }
    if (oldNs !== namespace && this.storeInstance) {
      this.storeInstance.clear();
      this.revalidate();
    }
  }

  private get db() {
    return this.data[this.namespace];
  }

  private buildKey(tableName: string, itemId: DatabaseId) {
    return `${tableName}/-/${itemId}`;
  }

  private getTableAndIdByKey(key: IDBValidKey) {
    const [tableName, itemId] = key.toString().split('/-/');
    return [tableName, itemId] as const;
  }

  private getAllKeys(tableName: string) {
    return new Promise<string[]>((res) => {
      const allKeys = Array.from(this.db.keys());
      const tableKeys = allKeys.filter((key) => key.toString().includes(`${tableName}/`));
      res(tableKeys);
    });
  }

  public async setItem(tableName: string, itemId: DatabaseId, value: DatabaseItem) {
    // await set(this.buildKey(tableName, itemId), value, this.idb);
    return new Promise<void>((res) => {
      this.db.set(this.buildKey(tableName, itemId), value);
      res();
    });
  }

  public setItems(tableName: string, items: [itemId: DatabaseId, value: DatabaseItem][]) {
    return new Promise<void>((res) => {
      items.forEach(([itemId, value]) => {
        this.db.set(this.buildKey(tableName, itemId), value);
      });
      res();
    });
  }

  public delItem(tableName: string, itemId: DatabaseId) {
    return new Promise<void>((res) => {
      this.db.delete(this.buildKey(tableName, itemId));
      res();
    });
  }

  public delItems(tableName: string, itemIds?: DatabaseId[]) {
    return new Promise<void>((res) => {
      if (itemIds) {
        itemIds.forEach((itemId) => {
          this.db.delete(this.buildKey(tableName, itemId));
        });
        res();
        return;
      }
      this.getAllKeys(tableName).then((tableKeys) => {
        tableKeys.forEach((key) => {
          this.db.delete(key);
        });
        res();
      });
    });
  }

  public getItem(tableName: string, itemId: DatabaseId) {
    return new Promise<DatabaseItem | undefined>((res) => {
      const item = this.db.get(this.buildKey(tableName, itemId));
      res(item);
    });
  }

  public async getItems(tableName: string, itemIds?: DatabaseId[]) {
    return new Promise<DatabaseItem[]>((res) => {
      if (itemIds) {
        const items = itemIds
          .map((itemId) => this.db.get(this.buildKey(tableName, itemId)))
          .filter((v) => v !== undefined);
        res(items as DatabaseItem[]);
      }
    });
  }

  public async getAllItems() {
    return new Promise<Record<string, any[]>>((res) => {
      const items = Array.from(this.db.entries());
      const allItems = items.reduce<Record<string, any[]>>((acc, [key, value]) => {
        const [tableName] = this.getTableAndIdByKey(key);
        if (!acc[tableName]) {
          acc[tableName] = [];
        }
        acc[tableName].push(value);
        return acc;
      }, {});
      res(allItems);
    });
  }

  public async clear() {
    return new Promise<void>((res) => {
      this.db.clear();
      res();
    });
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

export const createMemoryDbAdapter = (options?: DatabaseOptions): Database => {
  return new MemoryDbAdapter(options);
};
