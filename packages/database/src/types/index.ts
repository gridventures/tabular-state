import type { StorePlugin } from '@tabular-state/store';

export type DatabaseId = string | number;
export type DatabaseItem = Record<string, unknown>;

export type DatabaseOptions = {
  /**
   * @default default
   */
  namespace?: string;
  autoPersistTables?: [tableName: string, idField: string][];
  /**
   *
   * @returns {string} The idField of the table
   */
  checkAutoPersistTables?: (table: string) => string | undefined;
  onRevalidate?: (tableName: string, itemIds: DatabaseId[]) => void;
};

export interface Database extends StorePlugin {
  namespace: string;
  setNamespace: (next: string) => void;
  setItem: (tableName: string, itemId: DatabaseId, value: DatabaseItem) => Promise<void>;
  setItems: (
    tableName: string,
    items: [itemId: DatabaseId, value: DatabaseItem][],
  ) => Promise<void>;
  delItem: (tableName: string, itemId: DatabaseId) => Promise<void>;
  delItems: (tableName: string, itemIds?: DatabaseId[]) => Promise<void>;
  getItem: (tableName: string, itemId: DatabaseId) => Promise<DatabaseItem | undefined>;
  getItems: (tableName: string, itemIds?: DatabaseId[]) => Promise<DatabaseItem[]>;
  getAllItems: () => Promise<Record<string, DatabaseItem[]>>;
  clear: () => Promise<void>;
}

// export interface DatabaseEvents {
//   onSetItem?: (tableName: string, itemId: DatabaseId, value: DatabaseItem) => void;
//   onDelItem?: (tableName: string, itemId: DatabaseId) => void;
// }
