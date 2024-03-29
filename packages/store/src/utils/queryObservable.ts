import type { Sort } from './sort';
import type { ObservableComputed, ObservableObject, ObservableReadable } from '@legendapp/state';
import type { BasicValueQuery } from 'sift';

import { batch, computed, observable, observe, lockObservable } from '@legendapp/state';
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
  totalRowsAvailable: number;
};

export type QueryMeta = ObservableComputed<Meta>;

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
): [ObservableReadable<TItem[]>, QueryFn<TItem>, QueryMeta] {
  const query = observable(params.query || {}) as ObservableObject<
    Query<TItem> | CombineQuery<TItem>
  >;
  const sort = observable(params.sort || {});
  const select = observable(params.select || []);
  const page = observable(1);
  const total = observable(0);
  const totalRowsAvailable = observable(0);

  const limitHelper = observable(params.limit || 20);
  const skipHelper = observable(params.skip || 0);
  const changeHelper = observable(0);

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
    return Math.ceil(totalRowsAvailable.get() / limitHelper.get());
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
      totalRowsAvailable: totalRowsAvailable.get(),
    };
  });

  const rowsStore = observable<TItem[]>([]);
  lockObservable(rowsStore, true);

  const queryItems = () => {
    changeHelper.get();
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

    totalRowsAvailable.set(list.length - skipHelper.peek());

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

    batch(() => {
      lockObservable(rowsStore, false);
      rowsStore.set([]);
      list.forEach((row) => {
        rowsStore.push(row);
      });
      lockObservable(rowsStore, true);
    });
  };

  tableObservable.onChange(() => {
    changeHelper.set((c) => c + 1);
    queryItems();
  });

  observe(() => {
    sort.get();
    select.get();
    query.get();
    limitHelper.get();
    skipHelper.get();
    page.get();
    changeHelper.get();
    queryItems();
  });

  return [
    rowsStore,
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
