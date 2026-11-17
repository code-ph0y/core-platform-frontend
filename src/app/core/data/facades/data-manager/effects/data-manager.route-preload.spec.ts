
import { TestBed } from '@angular/core/testing';

import { Actions } from '@ngrx/effects';
import { Action } from '@ngrx/store';

import {
  Observable,
  of,
  Subject,
  Subscription
} from 'rxjs';

import {
  preloadDataFromPageDefinition,
  loadData,
  loadDataBatch,
  loadDataFailure,
  loadDataSuccess
} from '../actions/data-manager.actions';

import {
  clearPageDefinition
} from '../../container-manager/actions/container-manager.actions';

import {
  DataManagerEffects
} from './data-manager.effects';

import {
  DataService
} from '../services/data.service';

import type {
  ContainerSpec
} from '../data-manager.types';

describe('DataManagerEffects — route preloading', () => {
  let actions$: Subject<Action>;
  let effects: DataManagerEffects;

  let subscriptions: Subscription;

  let dataService: {
    getQuery: jest.Mock;
    executeQueryV1: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(() => {
    actions$ = new Subject<Action>();

    subscriptions = new Subscription();

    dataService = {
      getQuery: jest.fn().mockReturnValue(
        of({ id: '123' })
      ),
      executeQueryV1: jest.fn(),
      save: jest.fn(),
      remove: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        DataManagerEffects,

        {
          provide: Actions,
          useFactory: () =>
            new Actions(actions$.asObservable())
        },

        {
          provide: DataService,
          useValue: dataService
        }
      ]
    });

    effects = TestBed.inject(
      DataManagerEffects
    );
  });

  afterEach(() => {
    subscriptions.unsubscribe();
    actions$.complete();
  });

  /**
   * Capture actions emitted by the
   * metadata-preloading effect.
   */
  function capturePreload(): Action[] {
    const emitted: Action[] = [];

    subscriptions.add(
      effects.preloadFromPageDefinition$
        .subscribe(action => {
          emitted.push(action);
        })
    );

    return emitted;
  }

  /**
   * Find batch actions without relying
   * on the order of unrelated actions.
   */
  function batches(
    actions: Action[]
  ): Array<ReturnType<typeof loadDataBatch>> {
    return actions.filter(
      (
        action
      ): action is ReturnType<typeof loadDataBatch> =>
        action.type === loadDataBatch.type
    );
  }

  function failures(
    actions: Action[]
  ): Array<ReturnType<typeof loadDataFailure>> {
    return actions.filter(
      (
        action
      ): action is ReturnType<typeof loadDataFailure> =>
        action.type === loadDataFailure.type
    );
  }

  function page(
    attributes: Record<string, unknown> = {},
    children: ContainerSpec[] = []
  ): ContainerSpec {
    return {
      container: 'page',
      attributes,
      children
    };
  }

  /**
   * Simulate the NgRx handoff from metadata preloading
   * into the batch executor, capturing its results.
   */
  function captureExecutedPreloads(): Action[] {
    const emitted: Action[] = [];

    subscriptions.add(
      effects.loadBatch$.subscribe(action => {
        emitted.push(action);
      })
    );

    subscriptions.add(
      effects.preloadFromPageDefinition$
        .subscribe(action => actions$.next(action))
    );

    return emitted;
  }

  it('resolves a route parameter into a query batch', () => {
    const emitted = capturePreload();

    actions$.next(
      preloadDataFromPageDefinition({
        pageDefinition: page({
          load: {
            containerId: 'customer',
            queryId: 'getCustomer',
            bindVars: {
              id: '$route.id'
            }
          }
        }),

        routeParams: {
          id: '123'
        }
      })
    );

    const results = batches(emitted);

    expect(results).toHaveLength(1);

    expect(results[0].requests).toHaveLength(1);

    expect(
      results[0].requests[0].containerId
    ).toBe('customer');

    expect(
      results[0].requests[0].queryId
    ).toBe('getCustomer');

    expect(
      results[0].requests[0].bindVars?.['id']
    ).toBe('123');
  });

  it('preserves literal query variables', () => {
    const emitted = capturePreload();

    actions$.next(
      preloadDataFromPageDefinition({
        pageDefinition: page({
          load: {
            containerId: 'customer',
            queryId: 'getCustomer',

            bindVars: {
              id: '$route.id',
              limit: 25,
              includeOrders: true,
              status: 'active'
            }
          }
        }),

        routeParams: {
          id: '123'
        }
      })
    );

    const bindVars =
      batches(emitted)[0].requests[0].bindVars;

    expect(bindVars?.['id']).toBe('123');
    expect(bindVars?.['limit']).toBe(25);
    expect(bindVars?.['includeOrders']).toBe(true);
    expect(bindVars?.['status']).toBe('active');
  });

  it('resolves loads from multiple nested containers', () => {
    const emitted = capturePreload();

    const definition = page(
      {},
      [
        {
          container: 'customer-card',
          attributes: {
            load: {
              containerId: 'customer',
              queryId: 'getCustomer',
              bindVars: {
                id: '$route.customerId'
              }
            }
          }
        },

        {
          container: 'order-list',
          attributes: {},
          children: [
            {
              container: 'order-table',
              attributes: {
                load: {
                  containerId: 'orders',
                  queryId: 'getOrders',
                  bindVars: {
                    customerId: '$route.customerId',
                    orderId: '$route.orderId'
                  }
                }
              }
            }
          ]
        }
      ]
    );

    actions$.next(
      preloadDataFromPageDefinition({
        pageDefinition: definition,
        routeParams: {
          customerId: '123',
          orderId: '900'
        }
      })
    );

    const requests =
      batches(emitted)[0].requests;

    expect(requests).toHaveLength(2);

    expect(
      requests.find(
        request => request.containerId === 'customer'
      )?.bindVars?.['id']
    ).toBe('123');

    const orderRequest = requests.find(
      request => request.containerId === 'orders'
    );

    expect(
      orderRequest?.bindVars?.['customerId']
    ).toBe('123');

    expect(
      orderRequest?.bindVars?.['orderId']
    ).toBe('900');
  });

  it('deduplicates identical load declarations', () => {
    const emitted = capturePreload();

    const load = {
      containerId: 'customer',
      queryId: 'getCustomer',
      bindVars: {
        id: '$route.id'
      }
    };

    actions$.next(
      preloadDataFromPageDefinition({
        pageDefinition: page(
          {},
          [
            {
              container: 'customer-card',
              attributes: { load }
            },
            {
              container: 'customer-card',
              attributes: { load }
            }
          ]
        ),

        routeParams: {
          id: '123'
        }
      })
    );

    expect(
      batches(emitted)[0].requests
    ).toHaveLength(1);
  });

  it('emits a failure when a route parameter is missing', () => {
    const emitted = capturePreload();

    actions$.next(
      preloadDataFromPageDefinition({
        pageDefinition: page({
          load: {
            containerId: 'customer',
            queryId: 'getCustomer',
            bindVars: {
              id: '$route.id'
            }
          }
        }),

        routeParams: {}
      })
    );

    expect(batches(emitted)).toHaveLength(0);
    expect(failures(emitted)).toHaveLength(1);

    expect(
      failures(emitted)[0].containerId
    ).toBe('customer');

    expect(
      failures(emitted)[0].error
    ).toContain('Missing route parameter');

    expect(
      dataService.getQuery
    ).not.toHaveBeenCalled();
  });

  it('rejects malformed route references', () => {
    const emitted = capturePreload();

    actions$.next(
      preloadDataFromPageDefinition({
        pageDefinition: page({
          load: {
            containerId: 'customer',
            queryId: 'getCustomer',
            bindVars: {
              id: '$route.customer.id'
            }
          }
        }),

        routeParams: {
          customer: '123'
        }
      })
    );

    expect(batches(emitted)).toHaveLength(0);
    expect(failures(emitted)).toHaveLength(1);

    expect(
      failures(emitted)[0].error
    ).toContain('Invalid route parameter binding');
  });

  it('allows valid loads when another container has an invalid binding', () => {
    const emitted = capturePreload();

    actions$.next(
      preloadDataFromPageDefinition({
        pageDefinition: page(
          {},
          [
            {
              container: 'customer-card',
              attributes: {
                load: {
                  containerId: 'customer',
                  queryId: 'getCustomer',
                  bindVars: {
                    id: '$route.id'
                  }
                }
              }
            },

            {
              container: 'missing-card',
              attributes: {
                load: {
                  containerId: 'missing',
                  queryId: 'getMissing',
                  bindVars: {
                    id: '$route.unknown'
                  }
                }
              }
            }
          ]
        ),

        routeParams: {
          id: '123'
        }
      })
    );

    expect(failures(emitted)).toHaveLength(1);
    expect(batches(emitted)).toHaveLength(1);

    expect(
      failures(emitted)[0].containerId
    ).toBe('missing');

    expect(
      batches(emitted)[0].requests[0].containerId
    ).toBe('customer');

    expect(
      batches(emitted)[0].requests[0].bindVars?.['id']
    ).toBe('123');
  });

  it('does not dispatch a batch for a page without loads', () => {
    const emitted = capturePreload();

    actions$.next(
      preloadDataFromPageDefinition({
        pageDefinition: page(
          {},
          [
            {
              container: 'heading',
              attributes: {
                title: 'Customers'
              }
            }
          ]
        ),

        routeParams: {}
      })
    );

    expect(emitted).toHaveLength(0);
  });

  it('does not mutate the original page definition', () => {
    const emitted = capturePreload();

    const bindVars = Object.freeze({
      id: '$route.id'
    });

    const definition = page({
      load: {
        containerId: 'customer',
        queryId: 'getCustomer',
        bindVars
      }
    });

    actions$.next(
      preloadDataFromPageDefinition({
        pageDefinition: definition,

        routeParams: {
          id: '123'
        }
      })
    );

    expect(bindVars.id).toBe('$route.id');

    expect(
      batches(emitted)[0].requests[0].bindVars?.['id']
    ).toBe('123');

    expect(
      batches(emitted)[0].requests[0].bindVars
    ).not.toBe(bindVars);
  });

  it('passes the resolved ID to DataService.getQuery', () => {
    const emitted: Action[] = [];

    /**
     * Subscribe to the batch executor first.
     */
    subscriptions.add(
      effects.loadBatch$.subscribe(
        action => emitted.push(action)
      )
    );

    /**
     * Forward the batch action from the
     * preload effect into the action stream,
     * simulating NgRx dispatch.
     */
    subscriptions.add(
      effects.preloadFromPageDefinition$
        .subscribe(action => actions$.next(action))
    );

    actions$.next(
      preloadDataFromPageDefinition({
        pageDefinition: page({
          load: {
            containerId: 'customer',
            queryId: 'getCustomer',
            bindVars: {
              id: '$route.id'
            }
          }
        }),

        routeParams: {
          id: '123'
        }
      })
    );

    expect(
      dataService.getQuery
    ).toHaveBeenCalledTimes(1);

    expect(
      dataService.getQuery
    ).toHaveBeenCalledWith(
      'getCustomer',
      expect.objectContaining({
        id: '123'
      })
    );

    expect(
      emitted.some(
        action =>
          action.type === loadDataSuccess.type
      )
    ).toBe(true);
  });

  it('cancels the pending batch when the page is cleared', () => {
    const pendingResponse =
      new Subject<unknown>();

    dataService.getQuery.mockReturnValue(
      pendingResponse as Observable<unknown>
    );

    const emitted: Action[] = [];

    subscriptions.add(
      effects.loadBatch$.subscribe(
        action => emitted.push(action)
      )
    );

    subscriptions.add(
      effects.preloadFromPageDefinition$
        .subscribe(action => actions$.next(action))
    );

    actions$.next(
      preloadDataFromPageDefinition({
        pageDefinition: page({
          load: {
            containerId: 'customer',
            queryId: 'getCustomer',
            bindVars: {
              id: '$route.id'
            }
          }
        }),

        routeParams: {
          id: '123'
        }
      })
    );

    expect(
      dataService.getQuery
    ).toHaveBeenCalledTimes(1);

    /**
     * Simulate navigation invalidating
     * the current page.
     */
    actions$.next(
      clearPageDefinition()
    );

    pendingResponse.next({
      id: '123'
    });

    pendingResponse.complete();

    /**
     * A cancelled batch must never
     * dispatch a stale success action.
     */
    expect(
      emitted.some(
        action =>
          action.type === loadDataSuccess.type
      )
    ).toBe(false);
  });

  /**
   * Query V1 regression coverage.
   * These tests deliberately use the real effects with a
   * mocked DataService, leaving HTTP behaviour to the
   * service / browser integration tests.
   */
  it('submits a route-bound Query V1 filter and returns its named result', () => {
    const result = {
      data: [{
        _key: '879635',
        name: 'Routing V1 Test Project'
      }],
      paging: {
        limit: 25,
        offset: 0,
        count: 1
      }
    };

    dataService.executeQueryV1.mockReturnValue(
      of({
        results: {
          route_parameter_test: result
        }
      })
    );

    const emitted = captureExecutedPreloads();

    const definition = page({
      load: {
        containerId: 'route-parameter-test',
        queryId: 'route_parameter_test',
        bindVars: { id: '$route.id' },
        query: {
          resource: 'project',
          fields: ['_key', 'name'],
          filter: {
            field: '_key',
            operator: 'eq',
            value: '$bind.id'
          }
        }
      }
    });

    actions$.next(
      preloadDataFromPageDefinition({
        pageDefinition: definition,
        routeParams: { id: '879635' }
      })
    );

    expect(dataService.executeQueryV1).toHaveBeenCalledTimes(1);
    expect(dataService.executeQueryV1).toHaveBeenCalledWith({
      version: 1,
      queries: {
        route_parameter_test: {
          resource: 'project',
          fields: ['_key', 'name'],
          filter: {
            field: '_key',
            operator: 'eq',
            value: '879635'
          }
        }
      }
    });

    expect(dataService.getQuery).not.toHaveBeenCalled();

    expect(emitted).toContainEqual(
      loadDataSuccess({
        containerId: 'route-parameter-test',
        data: result
      })
    );

    // Resolving a binding must not mutate page metadata.
    expect(
      (definition.attributes as any).load.query.filter.value
    ).toBe('$bind.id');
  });

  it('rejects a missing Query V1 binding without calling the API', () => {
    const emitted = captureExecutedPreloads();

    actions$.next(
      preloadDataFromPageDefinition({
        pageDefinition: page({
          load: {
            containerId: 'missing-query-binding',
            queryId: 'route_parameter_test',
            bindVars: { other: '$route.id' },
            query: {
              resource: 'project',
              fields: ['_key'],
              filter: {
                field: '_key',
                operator: 'eq',
                value: '$bind.id'
              }
            }
          }
        }),
        routeParams: { id: '879635' }
      })
    );

    expect(dataService.executeQueryV1).not.toHaveBeenCalled();
    expect(dataService.getQuery).not.toHaveBeenCalled();
    expect(emitted).toContainEqual(
      loadDataFailure({
        containerId: 'missing-query-binding',
        error: "Missing query binding 'id'"
      })
    );
  });

  it('rejects malformed Query V1 references without calling the API', () => {
    const emitted = captureExecutedPreloads();

    actions$.next(
      preloadDataFromPageDefinition({
        pageDefinition: page({
          load: {
            containerId: 'malformed-query-binding',
            queryId: 'route_parameter_test',
            bindVars: { id: '$route.id' },
            query: {
              resource: 'project',
              fields: ['_key'],
              filter: {
                field: '_key',
                operator: 'eq',
                value: '$bind.id.extra'
              }
            }
          }
        }),
        routeParams: { id: '879635' }
      })
    );

    expect(dataService.executeQueryV1).not.toHaveBeenCalled();
    expect(emitted).toContainEqual(
      loadDataFailure({
        containerId: 'malformed-query-binding',
        error: "Invalid query binding '$bind.id.extra'"
      })
    );
  });

  it('resolves bindings in nested filters and array values', () => {
    dataService.executeQueryV1.mockReturnValue(
      of({
        results: {
          filtered_projects: {
            data: [],
            paging: { limit: 25, offset: 0, count: 0 }
          }
        }
      })
    );

    const emitted = captureExecutedPreloads();

    actions$.next(
      preloadDataFromPageDefinition({
        pageDefinition: page({
          load: {
            containerId: 'filtered-projects',
            queryId: 'filtered_projects',
            bindVars: {
              id: '$route.id',
              status: 'active'
            },
            query: {
              resource: 'project',
              fields: ['_key'],
              filter: {
                and: [
                  {
                    field: '_key',
                    operator: 'in',
                    value: ['$bind.id', 'other-key']
                  },
                  {
                    or: [
                      {
                        field: 'status',
                        operator: 'eq',
                        value: '$bind.status'
                      },
                      {
                        field: 'status',
                        operator: 'eq',
                        value: 'planned'
                      }
                    ]
                  }
                ]
              }
            }
          }
        }),
        routeParams: { id: '879635' }
      })
    );

    expect(dataService.executeQueryV1).toHaveBeenCalledWith({
      version: 1,
      queries: {
        filtered_projects: {
          resource: 'project',
          fields: ['_key'],
          filter: {
            and: [
              {
                field: '_key',
                operator: 'in',
                value: ['879635', 'other-key']
              },
              {
                or: [
                  {
                    field: 'status',
                    operator: 'eq',
                    value: 'active'
                  },
                  {
                    field: 'status',
                    operator: 'eq',
                    value: 'planned'
                  }
                ]
              }
            ]
          }
        }
      }
    });

    expect(emitted.some(
      action => action.type === loadDataSuccess.type
    )).toBe(true);
  });

  it('reports a missing named Query V1 response as a load failure', () => {
    dataService.executeQueryV1.mockReturnValue(
      of({ results: {} })
    );

    const emitted = captureExecutedPreloads();

    actions$.next(
      preloadDataFromPageDefinition({
        pageDefinition: page({
          load: {
            containerId: 'missing-result',
            queryId: 'route_parameter_test',
            query: {
              resource: 'project',
              fields: ['_key']
            }
          }
        }),
        routeParams: {}
      })
    );

    expect(emitted).toContainEqual(
      loadDataFailure({
        containerId: 'missing-result',
        error: "Query V1 response missing 'route_parameter_test'"
      })
    );
  });

  it('uses Query V1 for a direct loadData action', () => {
    dataService.executeQueryV1.mockReturnValue(
      of({
        results: {
          direct_project: {
            data: [],
            paging: { limit: 25, offset: 0, count: 0 }
          }
        }
      })
    );

    const emitted: Action[] = [];

    subscriptions.add(
      effects.load$.subscribe(action => emitted.push(action))
    );

    actions$.next(
      loadData({
        containerId: 'direct-project',
        queryId: 'direct_project',
        bindVars: { id: '879635' },
        query: {
          resource: 'project',
          fields: ['_key'],
          filter: {
            field: '_key',
            operator: 'eq',
            value: '$bind.id'
          }
        }
      })
    );

    expect(dataService.executeQueryV1).toHaveBeenCalledWith({
      version: 1,
      queries: {
        direct_project: {
          resource: 'project',
          fields: ['_key'],
          filter: {
            field: '_key',
            operator: 'eq',
            value: '879635'
          }
        }
      }
    });
    expect(dataService.getQuery).not.toHaveBeenCalled();
    expect(emitted.some(
      action => action.type === loadDataSuccess.type
    )).toBe(true);
  });

  it('cancels a pending Query V1 response when the page is cleared', () => {
    const pendingResponse = new Subject<unknown>();

    dataService.executeQueryV1.mockReturnValue(
      pendingResponse.asObservable()
    );

    const emitted = captureExecutedPreloads();

    actions$.next(
      preloadDataFromPageDefinition({
        pageDefinition: page({
          load: {
            containerId: 'pending-project',
            queryId: 'route_parameter_test',
            bindVars: { id: '$route.id' },
            query: {
              resource: 'project',
              fields: ['_key'],
              filter: {
                field: '_key',
                operator: 'eq',
                value: '$bind.id'
              }
            }
          }
        }),
        routeParams: { id: '879635' }
      })
    );

    expect(dataService.executeQueryV1).toHaveBeenCalledTimes(1);

    actions$.next(clearPageDefinition());

    pendingResponse.next({
      results: {
        route_parameter_test: {
          data: [{ _key: '879635' }],
          paging: { limit: 25, offset: 0, count: 1 }
        }
      }
    });
    pendingResponse.complete();

    expect(emitted.some(
      action => action.type === loadDataSuccess.type
    )).toBe(false);
  });
});
