import type { Sort } from './sort';
import type { Observable, ObservableComputed, ObservableObject } from '@legendapp/state';

import type { BasicValueQuery } from 'sift';

import { computed, observable } from '@legendapp/state';

import sift from 'sift';

import { siftSort } from './sort';

type PickOperators = '$in' | '$nin' | '$lt' | '$lte' | '$gt' | '$gte' | '$ne' | '$eq' | '$where';

export type Query<TItemSchema> =
  | {
      [k in keyof TItemSchema]?:
        | TItemSchema[k]
        | Pick<BasicValueQuery<TItemSchema[k]>, PickOperators>;
    }
  | {
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

export type QueryFn<TItem> = {
  next: () => void;
  prev: () => void;
  setParams: (nextParams: Omit<QueryParams<TItem>, 'select'>) => void;
};

export type Meta = {
  page: number;
  pageSize: number;
  total: number;
  canShowMore: boolean;
};

export type QueryMeta = ObservableComputed<Meta>;

export type ObservableQueryResult<T> = ObservableComputed<T> & QueryFn<T>;

export function observableQuery<
  TItem extends Record<string, any>,
  T extends Record<string | number, TItem>,
>(
  tableObservable: ObservableObject<T>,
  params: QueryParams<TItem>,
  options?: {
    onNext?: (nextPage: number) => void;
    onPrev?: (prevPage: number) => void;
    onParamsChange?: (query: QueryParams<TItem>) => void;
  },
): [ObservableComputed<TItem[]>, QueryFn<TItem>, QueryMeta] {
  const query = observable(params.query || {}) as ObservableObject<
    Query<TItem> | CombineQuery<TItem>
  >;
  const sort = observable(params.sort || {});
  const select = observable(params.select || []);
  const page = observable(1);
  const total = observable(0);
  const totalRows = observable(0);

  const limitHelper = observable(params.limit || 20);
  const skipHelper = observable(params.skip || 0);

  const skip = computed(() => {
    if (params.style === 'paginated') {
      return skipHelper.get() + (page.get() - 1) * (params.limit || 20);
    }
    return skipHelper.get();
  });

  const limit = computed(() => {
    const pageObs = page.get();
    return limitHelper.get() * pageObs;
  });

  const maxPage = computed(() => {
    return Math.ceil(totalRows.get() / limit.get());
  });

  const canShowMore = computed(() => {
    return page.get() < maxPage.get();
  });

  const meta = computed<Meta>(() => {
    return {
      page: page.get(),
      pageSize: limit.get(),
      total: total.get(),
      canShowMore: canShowMore.get(),
    };
  });

  const rows = computed<TItem[]>(() => {
    const table = tableObservable.get();

    let list = Object.values(table || {}).slice();

    const sortObs = sort.get();
    if (Object.keys(sortObs).length) {
      const sortFn = siftSort(sortObs);
      list = list.sort(sortFn);
    }

    const queryObs = query.get();
    if (Object.keys(queryObs).length) {
      const filterFn = sift(queryObs as Query<object>);
      list = list.filter(filterFn);
    }

    const limitObs = limit.get();
    const skipObs = skip.get();

    totalRows.set(list.length - skipHelper.peek());

    const sliceStart = skipObs;
    const sliceEnd = skipObs + limitObs;
    list = list.slice(sliceStart, sliceEnd);

    total.set(list.length);

    const selectObs = select.get();
    if (selectObs.length) {
      list = list.map((row) => {
        return Object.keys(row).reduce((acc, key: keyof TItem) => {
          if (selectObs.includes(key)) {
            acc[key] = row[key];
          }
          return acc;
        }, {} as TItem);
      });
    }

    return list;
  });

  return [
    rows,
    {
      next: () => {
        if (!canShowMore.peek()) return;
        page.set((p) => p + 1);
        options?.onNext?.(page.get() + 1);
      },
      prev: () => {
        if (page.peek() === 1) return;
        page.set((p) => p - 1);
        options?.onPrev?.(page.get() + 1);
      },
      setParams: (nextParams: Omit<QueryParams<TItem>, 'select'>) => {
        let changed = false;
        if (nextParams.limit) {
          limitHelper.set(nextParams.limit);
          changed = true;
        }
        if (nextParams.skip) {
          skipHelper.set(nextParams.skip);
          changed = true;
        }
        if (nextParams.query) {
          query.set(nextParams.query);
          changed = true;
        }
        if (nextParams.sort) {
          sort.set(nextParams.sort);
          changed = true;
        }
        if (changed) {
          options?.onParamsChange?.({
            ...params,
            ...nextParams,
          });
        }
      },
    },
    meta,
  ];
}
