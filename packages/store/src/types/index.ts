import type {
  ObservableQueryResult,
  QueryFn,
  QueryMeta,
  QueryParams,
} from '../utils/queryObservable';
import type { ObservableObject } from '@legendapp/state';

export type DefaultTable = {
  idField: string | number;
  item: any;
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
    silent?: boolean,
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
    silent?: boolean,
  ): void;
  delRow<TableName extends keyof Tables & string>(
    tableName: TableName,
    rowId: Tables[TableName]['idField'],
    silent?: boolean,
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
    silent?: boolean,
  ): void;
  delCell<TableName extends keyof Tables & string, CellKey extends keyof Tables[TableName]['item']>(
    tableName: TableName,
    rowId: Tables[TableName]['idField'],
    cellName: CellKey,
    silent?: boolean,
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
  // setDatabase(options: SetDatabaseOptions<Tables>): Promise<void>;
  plugin(plugin: StorePlugin): void; // eslint-disable-line no-use-before-define
  batch(fn: () => void): void;
  cleanup(): void;
  clear(): void;
};

export type StoreInstance<T extends Record<string, DefaultTable> = Record<string, DefaultTable>> =
  Omit<Store<T>, 'plugin'>;

export interface StorePlugin {
  mount<T extends Record<string, DefaultTable> = Record<string, DefaultTable>>(
    store: StoreInstance<T>,
  ): () => void;
}
