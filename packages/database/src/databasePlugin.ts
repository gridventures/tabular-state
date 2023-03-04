import type { Database, DatabaseId } from './types';
import type { PluginStore } from '@tabular-state/store';

export function mountDatabasePlugin(
  store: PluginStore,
  database: Omit<Database, 'mount'>,
  persistence: {
    autoPersistTables: [tableName: string, idField: string][] | undefined;
    checkAutoPersistTables: ((table: string) => string | undefined) | undefined;
  },
) {
  const disposeHook = store.hook('after', 'delTable', (ctx) => {
    database.delItems(ctx.params.table);
  });

  const disposeListener = store.tables.onChange((s, m, l) => {
    if (!persistence.autoPersistTables && !persistence.checkAutoPersistTables) return;
    l.forEach(({ path, valueAtPath, prevAtPath }) => {
      const [tableName, rowId, cell] = path as [string, DatabaseId | undefined, string | undefined];
      if (
        !persistence.autoPersistTables?.some(([t]) => t === tableName) &&
        !persistence.checkAutoPersistTables?.(tableName)
      ) {
        return;
      }
      if (rowId === undefined) {
        return;
      }
      if (cell) {
        // cell was changed
        const rowValue = store.getRow(tableName, rowId, true).peek();
        database.setItem(tableName, rowId, rowValue);
        return;
      }
      if (valueAtPath === undefined && prevAtPath !== undefined) {
        // row was deleted
        database.delItem(tableName, rowId);
        return;
      }
      if (valueAtPath !== undefined) {
        // row was added or changed
        const rowValue = store.getRow(tableName, rowId, true).peek();
        database.setItem(tableName, rowId, rowValue);
      }
    });
  });

  return () => {
    disposeHook();
    disposeListener();
  };
}
