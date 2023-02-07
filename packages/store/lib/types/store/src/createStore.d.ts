import type { DefaultTable, Store, StoreOptions } from './types';
export type AnyObject = object;
export declare function createStore<Tables extends Record<string, DefaultTable> = Record<string, DefaultTable>>(options?: StoreOptions<Tables>): Store<Tables>;
