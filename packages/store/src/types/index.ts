import type {
  ObservableQueryResult,
  QueryFn,
  QueryMeta,
  QueryParams,
} from '../utils/queryObservable';
import type { ObservableObject } from '@legendapp/state';
import type { Database } from '@tabular-state/database';

export type DefaultTable = {
  idField: string | number;
  item: any;
};

export type SetDatabaseOptions<Tables extends Record<string, DefaultTable>> = {
  database: Database | undefined;
  persistentTables: [tableName: keyof Tables & string, idField: string][];
  dynamicPersistentTables?: (tableName: keyof Tables & string) => string | false; // returns idField
  onReady?: () => void;
};

export type HookReturn = () => void;
export type HookWhen = 'before' | 'after' | 'error';
export type HookWhat =
  | 'getTable'
  | 'getRow'
  | 'getCell'
  | 'setRow'
  | 'setCell'
  | 'delRow'
  | 'delCell'
  | 'queryRows';
export type HooksContext<
  Tables extends Record<string, DefaultTable>,
  TableName extends keyof Tables & string,
> = {
  method: HookWhat;
  params: {
    table: TableName;
    rowId?: Tables[TableName]['idField'];
    cellKey?: keyof Tables[TableName]['item'];
    query?: QueryParams<Tables[TableName]['item']>;
  };
  error?: Error;
};
// & (
//   | {
//       method: 'getRow';
//       params: {
//         tableName: TableName;
//         rowId: Tables[TableName]['idField'];
//         cellName?: undefined;
//         query?: undefined;
//       };
//     }
//   | {
//       method: 'getCell';
//       params: {
//         tableName: TableName;
//         rowId: Tables[TableName]['idField'];
//         cellName: keyof Tables[TableName]['item'];
//         query?: undefined;
//       };
//     }
//   | {
//       method: 'getTable';
//       params: {
//         tableName: TableName;
//         rowId?: undefined;
//         cellName?: undefined;
//         query?: undefined;
//       };
//     }
//   | {
//       method: 'queryRows';
//       params: {
//         tableName: TableName;
//         rowId?: undefined;
//         cellName?: undefined;
//         query: QueryFn<Tables[TableName]['item']>;
//       };
//     }
// );
export type HookCallback<
  Tables extends Record<string, DefaultTable>,
  TableNames extends keyof Tables & string,
> = (ctx: HooksContext<Tables, TableNames>) => void | Promise<void>;
export type HookArgs<
  Tables extends Record<string, DefaultTable>,
  TableNames extends keyof Tables & string,
> =
  | [HookWhen, HookWhat, HookCallback<Tables, TableNames>]
  | [HookWhen, HookCallback<Tables, TableNames>];

export type Store<Tables extends Record<string, DefaultTable>> = {
  hook: (...args: HookArgs<Tables, keyof Tables & string>) => HookReturn;
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
    /**
     * @description if callback onGetRow should not be triggered
     * @default false
     */
    silent?: boolean,
  ): ObservableObject<Tables[TableName]['item'] | undefined>;
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
    /**
     * @description if callback onGetCell should not be triggered
     * @default false
     */
    silent?: boolean,
  ): ObservableObject<Tables[TableName]['item'][CellKey] | undefined>;
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
    /**
     * @description if callback onQueryRows should not be triggered
     * @default false
     */
    silent?: boolean,
  ): readonly [
    ObservableQueryResult<Tables[TableName]['item']>,
    QueryFn<Tables[TableName]['item']>,
    QueryMeta,
  ];
  setDatabase(options: SetDatabaseOptions<Tables>): Promise<void>;
  cleanup(): void;
};

export type StoreOptions<Tables extends Record<string, DefaultTable>> = {
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
