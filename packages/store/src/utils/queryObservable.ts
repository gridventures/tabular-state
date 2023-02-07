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

export function observableQuery<
  TItem extends Record<string, any>,
  T extends Record<string | number, TItem>,
>(
  tableObservable: ObservableObject<T>,
  params: QueryParams<TItem>,
  options?: {
    onNext?: (nextPage: number) => void;
    onPrev?: (prevPage: number) => void;
  },
): [ObservableComputed<TItem[]>, QueryFn, QueryMeta] {
  const query = observable(params.query || {}) as ObservableObject<Query<TItem>>;
  const sort = observable(params.sort || {});
  const select = observable(params.select || []);
  const page = observable(1);
  const total = observable(0);
  const totalRows = observable(0);

  const skip = computed(() => {
    if (params.style === 'paginated') {
      return (params.skip || 0) + (page.get() - 1) * (params.limit || 20);
    }
    return params.skip || 0;
  });

  const limit = computed(() => {
    const pageObs = page.get();
    return (params.limit || 20) * pageObs;
  });

  const maxPage = computed(() => {
    return Math.ceil(totalRows.get() / limit.get());
  });

  const canShowMore = computed(() => {
    return page.get() < maxPage.get();
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

    totalRows.set(list.length - (params.skip || 0));

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
    },
    {
      page,
      pageSize: limit,
      total,
      canShowMore,
    },
  ];
}
