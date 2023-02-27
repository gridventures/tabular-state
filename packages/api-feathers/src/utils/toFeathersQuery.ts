import type { Query as FeathersQuery } from '@feathersjs/feathers/lib';
import type { QueryParams } from '@tabular-state/store';

const IGNORED_OPERATORS = ['$where'];

function convertBasicQueryValue<TItem = Record<string, any>>(query: QueryParams<TItem>['query']) {
  const feathersQuery: FeathersQuery = {};

  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        Object.entries(v).forEach(([k2, v2]) => {
          if (IGNORED_OPERATORS.includes(k2)) return;
          if (k2 === '$eq') {
            Object.assign(feathersQuery, {
              [k]: v2,
            });
            return;
          }
          Object.assign(feathersQuery, {
            [k]: {
              [k2]: v2,
            },
          });
        });
      } else if (['$or', '$and'].includes(k)) {
        const val = v
          .map(convertBasicQueryValue)
          .filter((mapped: any) => Object.keys(mapped).length > 0);
        Object.assign(feathersQuery, {
          [k]: val,
        });
      } else if (!IGNORED_OPERATORS.includes(k)) {
        Object.assign(feathersQuery, {
          [k]: v,
        });
      }
    });
  }

  return feathersQuery;
}

export function toFeathersQuery<TItem = Record<string, any>>(
  queryParams: QueryParams<TItem>,
): FeathersQuery {
  const { query, limit, skip, sort, select } = queryParams;

  const feathersQuery: FeathersQuery = {};

  if (typeof limit === 'number') {
    Object.assign(feathersQuery, {
      $limit: limit,
    });
  }

  if (typeof skip === 'number') {
    Object.assign(feathersQuery, {
      $skip: skip,
    });
  }

  if (sort) {
    Object.assign(feathersQuery, {
      $sort: sort,
    });
  }

  if (select) {
    Object.assign(feathersQuery, {
      $select: select,
    });
  }

  Object.assign(feathersQuery, convertBasicQueryValue(query));

  return feathersQuery;
}
