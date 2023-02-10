import type { DefaultTable, SetDatabaseOptions, Store, StoreOptions } from './types';
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

  function hasTable<TableName extends TableNames>(name: TableName) {
    return !!tables[name];
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

  function getTable<TableName extends TableNames>(name: TableName) {
    return $getOrSetTable(name) as ObservableObject<{
      [k: string | number]: Tables[TableName]['item'];
    }>;
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
    const row = $getRawRow(tableName, rowId) as ObservableObject<Tables[TableName]['item']>;
    if (!silent) {
      try {
        options?.onGetRow?.(tableName, rowId, row.peek());
      } catch (e) {
        // ignore
      }
    }
    return row;
  }

  function setRow<TableName extends TableNames>(
    tableName: TableName,
    rowId: Tables[TableName]['idField'],
    rowValue: Tables[TableName]['item'],
  ) {
    const row = $getRawRow(tableName, rowId);
    row.set(rowValue);
  }

  function delRow<TableName extends TableNames>(
    tableName: TableName,
    rowId: Tables[TableName]['idField'],
  ) {
    const row = $getRawRow(tableName, rowId);
    row.delete();
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
    const row = $getRawRow(tableName, rowId);
    const cell = row[cellKey];
    if (!silent) {
      try {
        options?.onGetCell?.(tableName, rowId, cellKey, cell.peek());
      } catch (e) {
        // ignore
      }
    }
    return cell as ObservableObject<Tables[TableName]['item'][CellKey]>;
  }

  function setCell<TableName extends TableNames, CellKey extends keyof Tables[TableName]['item']>(
    tableName: TableName,
    rowId: Tables[TableName]['idField'],
    cellKey: CellKey,
    cellValue: Tables[TableName]['item'][CellKey],
  ) {
    const cell = getCell(tableName, rowId, cellKey);
    cell.set(cellValue);
  }

  function delCell<TableName extends TableNames, CellKey extends keyof Tables[TableName]['item']>(
    tableName: TableName,
    rowId: Tables[TableName]['idField'],
    cellKey: CellKey,
  ) {
    const row = $getRawRow(tableName, rowId);
    row[cellKey].delete();
  }

  function queryRows<TableName extends TableNames>(
    tableName: TableName,
    params: QueryParams<Tables[TableName]['item']>,
    silent = false,
  ) {
    const table = getTable(tableName);
    const [query, queryFn, queryMeta] = observableQuery(table, params, {
      onNext: (nextPage) => {
        if (silent) return;
        try {
          options?.onQueryRows?.(
            tableName,
            {
              ...params,
              skip: (params.skip || 0) + (nextPage - 1) * queryMeta.pageSize.peek(),
            },
            query.peek(),
          );
        } catch (e) {
          // ignore
        }
      },
      onParamsChange: (newParams) => {
        if (silent) return;
        try {
          options?.onQueryRows?.(tableName, newParams, query.peek());
        } catch (e) {
          // ignore
        }
      },
    });
    try {
      options?.onQueryRows?.(tableName, params, query.peek());
    } catch (e) {
      // ignore
    }
    return [query, queryFn, queryMeta] as const;
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

  return {
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
  };
}
