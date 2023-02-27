import type {
  DefaultTable,
  HookArgs,
  HookCallback,
  HookReturn,
  HooksContext,
  HookWhat,
  HookWhen,
  SetDatabaseOptions,
  Store,
  StoreOptions,
} from './types';
import type { QueryParams } from './utils/queryObservable';
import type { ObservableListenerDispose, ObservableObject } from '@legendapp/state';
import type { Database } from '@tabular-state/database/src/types/index';

import { observable } from '@legendapp/state';

import { observableQuery } from './utils/queryObservable';

export type AnyObject = object;

export function createStore<
  Tables extends Record<string, DefaultTable> = Record<string, DefaultTable>,
>(options?: StoreOptions<Tables>): Store<Tables> {
  type TableNames = keyof Tables & string;

  let database: Database | undefined;
  let persistentTables: string[] = [];
  let dynamicPersistentTables: ((tableName: TableNames) => string | false) | undefined;
  const tables = observable<Record<string, Record<DefaultTable['idField'], DefaultTable['item']>>>(
    {},
  );

  const hooks: {
    [k: string]: [HookWhen, HookWhat | undefined, HookCallback<Tables, TableNames>];
  } = {};

  function hook(...args: HookArgs<Tables, TableNames>): HookReturn {
    const id = `_${Math.random().toString(36).slice(2)}`;

    if (args.length === 2) {
      const [when, cb] = args;
      hooks[id] = [when, undefined, cb];
    } else {
      const [when, what, cb] = args;
      hooks[id] = [when, what, cb];
    }

    return () => {
      delete hooks[id];
    };
  }

  function findHooks(when: HookWhen, what?: HookWhat) {
    return Object.values(hooks)
      .filter(([hookWhen, hookWhat]) => {
        return hookWhen === when && (hookWhat === undefined || hookWhat === what);
      })
      .map(([, , hookCb]) => hookCb);
  }

  function runHooks(
    when: HookWhen,
    what: HookWhat | undefined,
    context: HooksContext<Tables, TableNames>,
  ) {
    const hooksToCall = findHooks(when, what);
    if (!hooksToCall.length) return Promise.resolve([]);
    return Promise.all(hooksToCall.map((cb) => cb(context))).catch((e) => {
      runHooks('error', what, { ...context, error: e });
    });
  }

  function runWithHooks<T = any>(
    withHooks: boolean,
    what: HookWhat,
    fn: () => T,
    params: HooksContext<Tables, TableNames>['params'],
  ): T {
    if (!withHooks) return fn();
    const ctx = { method: what, params };
    runHooks('before', what, ctx);
    const res = fn();
    runHooks('after', what, ctx);
    return res;
  }

  function hasTable<TableName extends TableNames>(name: TableName) {
    return !!tables[name].peek();
  }

  function setTable<TableName extends TableNames>(name: TableName) {
    if (hasTable(name)) return;
    tables.assign({
      [name]: {},
    });
  }

  function delTable<TableName extends TableNames>(name: TableName) {
    tables[name].delete();
  }

  function $getOrSetTable<TableName extends TableNames>(name: TableName) {
    setTable(name);
    const table = tables[name];
    return table;
  }

  function getTable<TableName extends TableNames>(name: TableName, silent = false) {
    function getTableFn() {
      return $getOrSetTable(name) as ObservableObject<{
        [k: string | number]: Tables[TableName]['item'];
      }>;
    }
    return runWithHooks(!silent, 'getTable', getTableFn, {
      table: name,
    });
  }

  function $getRawRow<TableName extends TableNames>(
    tableName: TableName,
    id: Tables[TableName]['idField'],
  ) {
    const table = $getOrSetTable(tableName);
    const row = table[id];
    return row;
  }

  function getRow<TableName extends TableNames>(
    tableName: TableName,
    rowId: Tables[TableName]['idField'],
    silent = false,
  ) {
    function getRowFn() {
      const row = $getRawRow(tableName, rowId);
      return row as ObservableObject<Tables[TableName]['item'] | undefined>;
    }
    return runWithHooks(!silent, 'getRow', getRowFn, {
      table: tableName,
      rowId,
    });
  }

  function setRow<TableName extends TableNames>(
    tableName: TableName,
    rowId: Tables[TableName]['idField'],
    rowValue: Tables[TableName]['item'],
    silent = false,
  ) {
    function setRowFn() {
      const row = $getRawRow(tableName, rowId);
      row.set(rowValue);
    }
    return runWithHooks(!silent, 'setRow', setRowFn, {
      table: tableName,
      rowId,
    });
  }

  function delRow<TableName extends TableNames>(
    tableName: TableName,
    rowId: Tables[TableName]['idField'],
    silent = false,
  ) {
    function delRowFn() {
      const row = $getRawRow(tableName, rowId);
      row.delete();
    }
    return runWithHooks(!silent, 'delRow', delRowFn, {
      table: tableName,
      rowId,
    });
  }

  function hasRow<TableName extends TableNames>(
    tableName: TableName,
    rowId: Tables[TableName]['idField'],
  ) {
    const table = $getOrSetTable(tableName);
    return !!table[rowId];
  }

  function getCell<TableName extends TableNames, CellKey extends keyof Tables[TableName]['item']>(
    tableName: TableName,
    rowId: Tables[TableName]['idField'],
    cellKey: CellKey,
    silent = false,
  ) {
    function getCellFn() {
      const row = $getRawRow(tableName, rowId);
      const cell = row[cellKey];
      return cell as ObservableObject<Tables[TableName]['item'][CellKey]>;
    }
    return runWithHooks(!silent, 'getCell', getCellFn, {
      table: tableName,
      rowId,
      cellKey,
    });
  }

  function setCell<TableName extends TableNames, CellKey extends keyof Tables[TableName]['item']>(
    tableName: TableName,
    rowId: Tables[TableName]['idField'],
    cellKey: CellKey,
    cellValue: Tables[TableName]['item'][CellKey],
    silent = false,
  ) {
    function setCellFn() {
      const cell = getCell(tableName, rowId, cellKey, true);
      cell.set(cellValue);
    }
    return runWithHooks(!silent, 'setCell', setCellFn, {
      table: tableName,
      rowId,
      cellKey,
    });
  }

  function delCell<TableName extends TableNames, CellKey extends keyof Tables[TableName]['item']>(
    tableName: TableName,
    rowId: Tables[TableName]['idField'],
    cellKey: CellKey,
    silent = false,
  ) {
    function delCellFn() {
      const row = $getRawRow(tableName, rowId);
      row[cellKey].delete();
    }
    return runWithHooks(!silent, 'delCell', delCellFn, {
      table: tableName,
      rowId,
      cellKey,
    });
  }

  function queryRows<TableName extends TableNames>(
    tableName: TableName,
    params: QueryParams<Tables[TableName]['item']>,
    silent = false,
  ) {
    const table = getTable(tableName);
    function queryRowsFn() {
      const [query, queryFn, queryMeta] = observableQuery(table, params, {
        onNext: (nextPage) => {
          if (silent) return;
          runHooks('before', 'queryRows', {
            method: 'queryRows',
            params: {
              table: tableName,
              query: {
                ...params,
                skip: (params.skip || 0) + (nextPage - 1) * queryMeta.pageSize.peek(),
              },
            },
          });
        },
        onParamsChange: (newParams) => {
          if (silent) return;
          runHooks('before', 'queryRows', {
            method: 'queryRows',
            params: {
              table: tableName,
              query: newParams,
            },
          });
        },
      });
      return [query, queryFn, queryMeta] as const;
    }
    return runWithHooks(!silent, 'queryRows', queryRowsFn, {
      table: tableName,
      query: params,
    });
  }

  let dispose: ObservableListenerDispose | undefined;
  function mountListener() {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    dispose = tables.onChange((_v, _g, changes) => {
      changes.forEach((change) => {
        const [tableName, rowId] = change.path;
        const persist =
          persistentTables.includes(tableName as string) ||
          dynamicPersistentTables?.(tableName as string);
        if (persist && rowId && database) {
          database.setItem(
            tableName as string,
            rowId,
            $getRawRow(tableName as string, rowId).peek(),
          );
        }
      });
    });
  }

  function cleanupListener() {
    dispose?.();
  }

  async function setDatabase(databaseOptions: SetDatabaseOptions<Tables>) {
    const isUpdated = !!database;
    database = databaseOptions.database;

    const idFields = Object.fromEntries(databaseOptions.persistentTables);
    persistentTables = databaseOptions.persistentTables?.map(([n]) => n) || undefined;
    dynamicPersistentTables = databaseOptions.dynamicPersistentTables;

    if (isUpdated || !database) {
      cleanupListener();
    }
    if (isUpdated) {
      Object.keys(tables.peek()).forEach((tableName) => {
        delTable(tableName);
      });
    }
    if (database && persistentTables) {
      const allRows = await database.getAllItems();
      Object.entries(allRows).forEach(([tableName, rows]) => {
        const idField =
          idFields[tableName] || databaseOptions.dynamicPersistentTables?.(tableName) || 'id';
        rows.forEach((item) => {
          setRow(tableName, item[idField] as string | number, item);
        });
        try {
          options?.onRevalidate?.(
            tableName,
            rows.map((i) => i[idField] as string | number),
          );
        } catch (e) {
          // ignore
        }
      });
      mountListener();
    }
    databaseOptions.onReady?.();
  }

  function cleanup() {
    tables.set({});
    Object.keys(hooks).forEach((key) => {
      delete hooks[key];
    });
  }

  return {
    hook,
    getTable,
    setTable,
    delTable,
    hasTable,
    setRow,
    delRow,
    hasRow,
    getRow,
    queryRows,
    setCell,
    getCell,
    delCell,
    setDatabase,
    cleanup,
  };
}
