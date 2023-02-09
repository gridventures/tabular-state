export type DatabaseId = string | number;
export type DatabaseItem = Record<string, unknown>;

export interface Database {
  namespace: string;
  setNamespace: (next: string) => void;
  setItem: (tableName: string, itemId: DatabaseId, value: DatabaseItem) => Promise<void>;
  setItems: (
    tableName: string,
    items: [itemId: DatabaseId, value: DatabaseItem][],
  ) => Promise<void>;
  delItem: (tableName: string, itemId: DatabaseId) => Promise<void>;
  delItems: (tableName: string, itemIds?: DatabaseId[]) => Promise<void>;
  getItem: (tableName: string, itemId: DatabaseId) => Promise<DatabaseItem>;
  getItems: (tableName: string, itemIds?: DatabaseId[]) => Promise<DatabaseItem[]>;
  getAllItems: () => Promise<Record<string, DatabaseItem[]>>;
  clear: () => Promise<void>;
}

export interface DatabaseEvents {
  onSetItem?: (tableName: string, itemId: DatabaseId, value: DatabaseItem) => void;
  onDelItem?: (tableName: string, itemId: DatabaseId) => void;
}
