import { DatabaseId, Database, DatabaseItem } from './types';
export declare class IndexedDbAdapter implements Database {
    namespace: string;
    private idb;
    constructor(namespace?: string);
    setNamespace(namespace: string): void;
    private buildKey;
    private getTableAndIdByKey;
    private getAllKeys;
    setItem(tableName: string, itemId: DatabaseId, value: DatabaseItem): Promise<void>;
    setItems(tableName: string, items: [itemId: DatabaseId, value: DatabaseItem][]): Promise<void>;
    delItem(tableName: string, itemId: DatabaseId): Promise<void>;
    delItems(tableName: string, itemIds?: DatabaseId[]): Promise<void>;
    getItem(tableName: string, itemId: DatabaseId): Promise<any>;
    getItems(tableName: string, itemIds?: DatabaseId[]): Promise<any[]>;
    getAllItems(): Promise<Record<string, any[]>>;
}
export declare const createIndexedDbAdapter: (namespace?: string) => Database;
