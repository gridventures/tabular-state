import type { Sort } from './sort';
import type { Observable, ObservableComputed, ObservableObject } from '@legendapp/state';
import type { BasicValueQuery } from 'sift';
type PickOperators = '$in' | '$nin' | '$lt' | '$lte' | '$gt' | '$gte' | '$ne' | '$eq' | '$where';
export type Query<TItemSchema> = {
    [k in keyof TItemSchema]?: TItemSchema[k] | Pick<BasicValueQuery<TItemSchema[k]>, PickOperators>;
} | {
    $where?: BasicValueQuery<TItemSchema>['$where'];
};
type CombineQuery<Value> = {
    $or?: Query<Value>[];
    $and?: Query<Value>[];
};
export type QueryParams<ItemType> = {
    query?: Query<ItemType> | CombineQuery<ItemType>;
    limit?: number;
    skip?: number;
    sort?: Sort<ItemType>;
    style?: 'paginated' | 'infinite';
    select?: (keyof ItemType)[];
};
export type QueryFn = {
    next: () => void;
    prev: () => void;
};
export type QueryMeta = {
    page: Observable<number>;
    pageSize: ObservableComputed<number>;
    total: Observable<number>;
    canShowMore: ObservableComputed<boolean>;
};
export type ObservableQueryResult<T> = ObservableComputed<T> & QueryFn;
export declare function observableQuery<TItem extends Record<string, any>, T extends Record<string | number, TItem>>(tableObservable: ObservableObject<T>, params: QueryParams<TItem>, options?: {
    onNext?: (nextPage: number) => void;
    onPrev?: (prevPage: number) => void;
}): [ObservableComputed<TItem[]>, QueryFn, QueryMeta];
export {};
