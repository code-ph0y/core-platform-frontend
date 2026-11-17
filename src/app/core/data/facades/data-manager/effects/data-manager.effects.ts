import { inject, Injectable } from '@angular/core';

import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';

import {
  ROUTER_NAVIGATION
} from '@ngrx/router-store';

import {
  catchError,
  map,
  mergeMap,
  switchMap,
  takeUntil
} from 'rxjs/operators';

import {
  defer,
  forkJoin,
  from,
  merge,
  Observable,
  of
} from 'rxjs';

import {
  preloadDataFromPageDefinition,
  loadData,
  loadDataBatch,
  loadDataFailure,
  loadDataSuccess,
  saveData,
  saveDataFailure,
  saveDataSuccess,
  deleteData,
  deleteDataFailure,
  deleteDataSuccess,
  clearDataManager
} from '../actions/data-manager.actions';

import {
  clearPageDefinition
} from '../../container-manager/actions/container-manager.actions';

import {
  loadApplicationRoutes,
  clearApplicationRoutes
} from '../../router/actions/router.actions';

import {
  DataService
} from '../services/data.service';

import type {
  QueryFilter,
  QueryValue,
  ResourceQuery
} from '../services/data.service';

import {
  resolveRouteBindings
} from '../route-bindings';

import type {
  ContainerSpec,
  LoadDataBatchParams,
  LoadDataParams,
  Dict
} from '../data-manager.types';

@Injectable()
export class DataManagerEffects {
  private readonly actions$ = inject(Actions);

  private readonly dataService =
    inject(DataService);

  /**
   * Invalidate data when navigation,
   * page identity or authorization
   * context changes.
   */
  private readonly pageInvalidated$ =
    this.actions$.pipe(
      ofType(
        ROUTER_NAVIGATION,
        clearPageDefinition,
        loadApplicationRoutes,
        clearApplicationRoutes
      )
    );

  /**
   * Explicit Data Manager reset.
   */
  private readonly clear$ =
    this.actions$.pipe(
      ofType(clearDataManager)
    );

  /**
   * Cancel pending responses whenever
   * page or data context is invalidated.
   */
  private readonly cancelDataRequests$ = merge(
    this.pageInvalidated$,
    this.clear$
  );

  constructor() {
    console.debug(
      '[DataManagerEffects] init'
    );
  }

  /**
   * Clear existing data whenever the
   * page or authorization context changes.
   */
  readonly clearOnPageInvalidation$ =
    createEffect(() =>
      this.pageInvalidated$.pipe(
        map(() => clearDataManager())
      )
    );

  /**
   * Extract metadata-defined page loads
   * and resolve route parameter bindings.
   *
   * Example:
   *
   * Page:
   *   bindVars: { id: '$route.id' }
   *
   * Route:
   *   routeParams: { id: '123' }
   *
   * Request:
   *   bindVars: { id: '123' }
   *
   * Missing or invalid route parameters
   * become per-container failure actions.
   *
   * Other valid requests may still load.
   */
  readonly preloadFromPageDefinition$ =
    createEffect(() =>
      this.actions$.pipe(
        ofType(preloadDataFromPageDefinition),

        mergeMap(({
                    pageDefinition,
                    routeParams
                  }) => {
          const declarations =
            collectLoads(pageDefinition);

          const requests:
            LoadDataBatchParams['requests'] = [];

          const failures: Array<
            ReturnType<typeof loadDataFailure>
          > = [];

          for (const declaration of declarations) {
            try {
              const bindVars =
                resolveRouteBindings(
                  declaration.bindVars,
                  routeParams ?? {}
                );

              requests.push({
                containerId: declaration.containerId,
                queryId: declaration.queryId,
                bindVars,
                ...(declaration.query !== undefined
                  ? { query: declaration.query }
                  : {})
              });
            } catch (error: unknown) {
              failures.push(
                loadDataFailure({
                  containerId:
                  declaration.containerId,

                  error:
                    error instanceof Error
                      ? error.message
                      : 'Invalid route parameter binding'
                })
              );
            }
          }

          /**
           * Emit failures individually.
           *
           * Emit a batch only if there
           * are valid requests to execute.
           *
           * An empty page produces no
           * unnecessary placeholder action.
           */
          const actions: Array<
            ReturnType<typeof loadDataFailure> |
            ReturnType<typeof loadDataBatch>
          > = [...failures];

          if (requests.length > 0) {
            actions.push(
              loadDataBatch({ requests })
            );
          }

          return from(actions);
        })
      )
    );

  /**
   * Load either a legacy named query or a
   * Query V1 resource definition.
   *
   * Query V1 uses the same route-resolved
   * bindVars, but submits a validated resource
   * query to POST /api/query.
   *
   * defer converts template failures into
   * observable errors so the effects can
   * emit per-container failure actions.
   */
  private executeLoad(
    request: Pick<
      LoadDataParams,
      'queryId' | 'bindVars' | 'query'
    >
  ): Observable<any> {
    return defer(() => {
      if (request.query === undefined) {
        return this.dataService.getQuery(
          request.queryId,
          request.bindVars
        );
      }

      const query = resolveQueryBindings(
        request.query,
        request.bindVars
      );

      return this.dataService.executeQueryV1({
        version: 1,
        queries: {
          [request.queryId]: query
        }
      }).pipe(
        map(response => {
          const result =
            response.results[request.queryId];

          if (!result) {
            throw new Error(
              `Query V1 response missing '${request.queryId}'`
            );
          }

          return result;
        })
      );
    });
  }

  /**
   * Load an individual query.
   * Independent requests may run concurrently.
   */
  readonly load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadData),

      mergeMap(({
                  containerId,
                  queryId,
                  bindVars,
                  query
                }) =>
        this.executeLoad({
          queryId,
          bindVars,
          query
        }).pipe(
          map(data =>
            loadDataSuccess({
              containerId,
              data
            })
          ),

          catchError(error =>
            of(
              loadDataFailure({
                containerId,
                error:
                  error?.message ||
                  'Load failed'
              })
            )
          ),

          takeUntil(
            this.cancelDataRequests$
          )
        )
      )
    )
  );

  /**
   * Execute metadata-defined loads as a batch.
   * A newer batch supersedes the previous batch.
   */
  readonly loadBatch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadDataBatch),

      switchMap(({ requests }) => {
        if (!requests?.length) {
          return of({
            type: '[Data] Noop Batch (Empty)'
          } as any);
        }

        const calls = requests.map(({
                                      containerId,
                                      queryId,
                                      bindVars,
                                      query
                                    }) =>
          this.executeLoad({
            queryId,
            bindVars,
            query
          }).pipe(
            map(data =>
              loadDataSuccess({
                containerId,
                data
              })
            ),

            catchError(error =>
              of(
                loadDataFailure({
                  containerId,
                  error:
                    error?.message ||
                    'Load failed'
                })
              )
            )
          )
        );

        const safeCalls =
          calls.filter(Boolean);

        if (!safeCalls.length) {
          return of({
            type: '[Data] Noop Batch (No Safe Calls)'
          } as any);
        }

        return forkJoin(safeCalls).pipe(
          takeUntil(
            this.cancelDataRequests$
          )
        );
      }),

      // Dispatch each success/failure action separately.
      mergeMap(actions =>
        Array.isArray(actions)
          ? actions
          : [actions]
      )
    )
  );

  /**
   * Save data.
   *
   * Preserve concurrent save behaviour
   * and cancel stale client responses.
   *
   * Cancelling observation does not
   * undo a server-side mutation.
   */
  readonly save$ = createEffect(() =>
    this.actions$.pipe(
      ofType(saveData),

      mergeMap(({
                  containerId,
                  endpoint,
                  data,
                  method = 'POST'
                }) =>
        this.dataService
          .save(
            endpoint,
            data,
            method
          )
          .pipe(
            map(response =>
              saveDataSuccess({
                containerId,
                data: response
              })
            ),

            catchError(error =>
              of(
                saveDataFailure({
                  containerId,
                  error:
                    error?.message ||
                    'Save failed'
                })
              )
            ),

            takeUntil(
              this.cancelDataRequests$
            )
          )
      )
    )
  );

  /**
   * Delete data.
   *
   * Preserve the existing delete contract
   * and cancel stale client responses.
   */
  readonly delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteData),

      mergeMap(({
                  containerId,
                  endpoint
                }) =>
        this.dataService
          .remove(
            endpoint || ''
          )
          .pipe(
            map(response =>
              deleteDataSuccess({
                containerId,
                data: response
              })
            ),

            catchError(error =>
              of(
                deleteDataFailure({
                  containerId,
                  error:
                    error?.message ||
                    'Delete failed'
                })
              )
            ),

            takeUntil(
              this.cancelDataRequests$
            )
          )
      )
    )
  );
}

/**
 * Recursively collect data-load
 * declarations from a compiled page.
 *
 * Deduplicate equivalent declarations
 * using Map, which supports arbitrary
 * container IDs safely.
 */
function collectLoads(
  root: ContainerSpec | ContainerSpec[]
): LoadDataBatchParams['requests'] {
  const unique = new Map<
    string,
    LoadDataBatchParams['requests'][number]
  >();

  /**
   * Construct a fallback identity when
   * no explicit container ID exists.
   */
  const deriveId = (
    node: ContainerSpec
  ): string => {
    const type =
      node.container || 'node';

    const attributes: any =
      node.attributes || {};

    const key =
      attributes.key ||
      attributes.alias ||
      attributes.containerId ||
      'value';

    return `${type}:${key}`;
  };

  /**
   * Visit a node and all its children.
   */
  const visit = (
    node: ContainerSpec | null | undefined
  ): void => {
    if (
      !node ||
      typeof node !== 'object'
    ) {
      return;
    }

    const attributes: any =
      node.attributes || {};

    const load = attributes.load;

    if (load?.queryId) {
      const containerId =
        load.containerId ||
        attributes.containerId ||
        deriveId(node);

      const key =
        `${containerId}::${load.queryId}::` +
        JSON.stringify(
          {
            bindVars: load.bindVars || {},
            query: load.query ?? null
          }
        );

      unique.set(key, {
        containerId,
        queryId: load.queryId,
        bindVars: load.bindVars,
        ...(load.query !== undefined
          ? { query: load.query }
          : {})
      });
    }

    if (Array.isArray(node.children)) {
      node.children.forEach(visit);
    }
  };

  if (Array.isArray(root)) {
    root.forEach(visit);
  } else {
    visit(root);
  }

  return Array.from(
    unique.values()
  );
}

/**
 * Only query FILTER VALUES may contain $bind references.
 * Resource, field and operator names are never interpolated.
 * The server validates the final query independently.
 */
function resolveQueryBindings(
  query: ResourceQuery,
  bindVars?: Dict
): ResourceQuery {
  if (!query || typeof query !== 'object') {
    throw new Error('Invalid Query V1 definition');
  }

  if (!query.filter) {
    return { ...query };
  }

  return {
    ...query,
    filter: resolveQueryFilter(query.filter, bindVars)
  };
}

function resolveQueryFilter(
  filter: QueryFilter,
  bindVars?: Dict
): QueryFilter {
  if ('and' in filter) {
    return {
      and: filter.and.map(item =>
        resolveQueryFilter(item, bindVars)
      )
    };
  }

  if ('or' in filter) {
    return {
      or: filter.or.map(item =>
        resolveQueryFilter(item, bindVars)
      )
    };
  }

  return {
    ...filter,
    value: Array.isArray(filter.value)
      ? filter.value.map(value =>
        resolveBoundValue(value, bindVars)
      )
      : resolveBoundValue(filter.value, bindVars)
  };
}

const BIND_REFERENCE =
  /^\$bind\.([A-Za-z_][A-Za-z0-9_]*)$/;

function resolveBoundValue(
  value: QueryValue,
  bindVars?: Dict
): QueryValue {
  if (
    typeof value !== 'string' ||
    !value.startsWith('$bind.')
  ) {
    return value;
  }

  const match = BIND_REFERENCE.exec(value);

  if (!match) {
    throw new Error(
      `Invalid query binding '${value}'`
    );
  }

  const name = match[1];

  if (
    !bindVars ||
    !Object.prototype.hasOwnProperty.call(bindVars, name)
  ) {
    throw new Error(
      `Missing query binding '${name}'`
    );
  }

  const boundValue = bindVars[name];

  if (
    boundValue !== null &&
    typeof boundValue !== 'string' &&
    typeof boundValue !== 'number' &&
    typeof boundValue !== 'boolean'
  ) {
    throw new Error(
      `Invalid query binding value '${name}'`
    );
  }

  return boundValue;
}
