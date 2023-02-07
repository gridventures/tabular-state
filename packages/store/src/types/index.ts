import type { Database } from '@tabular-state/database';

import { ObservableComputed, ObservableObject } from '@legendapp/state';

import { QueryFn, QueryMeta, QueryParams } from '../utils/queryObservable';

export type DefaultTable = {
  idField: string | number;
  item: any;
};

export type Store<Tables extends Record<string, DefaultTable>> = {
  hasTable<TableName extends keyof Tables & string>(name: TableName): boolean;
  setTable<TableName extends keyof Tables & string>(name: TableName): void;
  delTable<TableName extends keyof Tables & string>(name: TableName): void;
  getTable<TableName extends keyof Tables & string>(
    name: TableName,
  ): ObservableObject<{
    [k: string | number]: Tables[TableName]['item'];
  }>;
  getRow<TableName extends keyof Tables & string>(
    tableName: TableName,
    rowId: Tables[TableName]['idField'],
  ): ObservableObject<Tables[TableName]['item']>;
  setRow<TableName extends keyof Tables & string>(
    tableName: TableName,
    rowId: Tables[TableName]['idField'],
    rowValue: Tables[TableName]['item'],
  ): void;
  delRow<TableName extends keyof Tables & string>(
    tableName: TableName,
    rowId: Tables[TableName]['idField'],
  ): void;
  hasRow<TableName extends keyof Tables & string>(
    tableName: TableName,
    rowId: Tables[TableName]['idField'],
  ): boolean;
  getCell<TableName extends keyof Tables & string, CellKey extends keyof Tables[TableName]['item']>(
    tableName: TableName,
    rowId: Tables[TableName]['idField'],
    cellName: CellKey,
  ): ObservableObject<Tables[TableName]['item'][CellKey]>;
  setCell<TableName extends keyof Tables & string, CellKey extends keyof Tables[TableName]['item']>(
    tableName: TableName,
    rowId: Tables[TableName]['idField'],
    cellName: CellKey,
    cellValue: Tables[TableName]['item'][CellKey],
  ): void;
  delCell<TableName extends keyof Tables & string, CellKey extends keyof Tables[TableName]['item']>(
    tableName: TableName,
    rowId: Tables[TableName]['idField'],
    cellName: CellKey,
  ): void;
  queryRows<TableName extends keyof Tables & string>(
    tableName: TableName,
    params: QueryParams<Tables[TableName]['item']>,
  ): readonly [ObservableComputed<Tables[TableName]['item'][]>, QueryFn, QueryMeta];
  setDatabase(db: Database): void;
};

export type StoreOptions<Tables extends Record<string, DefaultTable>> = {
  persistentTables?: [tableName: keyof Tables & string, idField: string][];
  onRevalidate?<TableName extends keyof Tables & string>(
    tableName: TableName,
    rowIds: Tables[TableName]['idField'][],
  ): Promise<void> | void;
  onQueryRows?: <TableName extends keyof Tables & string>(
    tableName: TableName,
    query: QueryParams<Tables[TableName]['item']>,
    results: Tables[TableName]['item'][],
  ) => Promise<void> | void;
  onGetRow?: <TableName extends keyof Tables & string>(
    tableName: TableName,
    rowId: Tables[TableName]['idField'],
    rowValue: Tables[TableName]['item'] | undefined,
  ) => Promise<void> | void;
  onGetCell?: <
    TableName extends keyof Tables & string,
    CellKey extends keyof Tables[TableName]['item'],
  >(
    tableName: TableName,
    rowId: Tables[TableName]['idField'],
    cellName: CellKey,
    cellValue: Tables[TableName]['item'][CellKey] | undefined,
  ) => Promise<void> | void;
};
