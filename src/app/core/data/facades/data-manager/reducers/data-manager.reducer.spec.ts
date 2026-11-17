
import {
  dataManagerReducer,
  initialDataManagerState
} from './data-manager.reducer';

import type {
  DataManagerState
} from './data-manager.reducer';

import * as Actions from '../actions/data-manager.actions';

describe('DataManagerReducer', () => {
  const containerId = 'customerDetails';

  function initialState(): DataManagerState {
    return dataManagerReducer(
      undefined,
      { type: '[Test] Init' }
    );
  }

  describe('initial state', () => {
    it('starts with no page data', () => {
      const state = initialState();

      expect(Object.keys(state.entities)).toEqual([]);

      expect(state).toBe(initialDataManagerState);
    });

    it('uses a null-prototype dictionary', () => {
      const state = initialState();

      expect(
        Object.getPrototypeOf(state.entities)
      ).toBeNull();
    });
  });

  describe('loading', () => {
    it('creates a loading slice', () => {
      const state = dataManagerReducer(
        initialState(),
        Actions.loadData({
          containerId,
          queryId: 'getCustomer',
          bindVars: {
            id: '123'
          }
        })
      );

      expect(state.entities[containerId]).toEqual({
        containerId,
        data: null,
        loading: true,
        error: null
      });
    });

    it('stores successful query data', () => {
      const customer = {
        id: 123,
        name: 'Example Customer'
      };

      const loaded = dataManagerReducer(
        initialState(),
        Actions.loadDataSuccess({
          containerId,
          data: customer
        })
      );

      expect(
        loaded.entities[containerId].data
      ).toEqual(customer);

      expect(
        loaded.entities[containerId].loading
      ).toBe(false);

      expect(
        loaded.entities[containerId].error
      ).toBeNull();
    });

    it('stores query errors', () => {
      const failed = dataManagerReducer(
        initialState(),
        Actions.loadDataFailure({
          containerId,
          error: 'Query failed'
        })
      );

      expect(
        failed.entities[containerId].loading
      ).toBe(false);

      expect(
        failed.entities[containerId].error
      ).toBe('Query failed');
    });
  });

  describe('clearing', () => {
    it('removes previously loaded data', () => {
      const loaded = dataManagerReducer(
        initialState(),
        Actions.loadDataSuccess({
          containerId,
          data: {
            id: 123
          }
        })
      );

      const cleared = dataManagerReducer(
        loaded,
        Actions.clearDataManager()
      );

      expect(Object.keys(cleared.entities)).toEqual([]);

      expect(
        cleared.entities[containerId]
      ).toBeUndefined();
    });

    it('removes query errors', () => {
      const failed = dataManagerReducer(
        initialState(),
        Actions.loadDataFailure({
          containerId,
          error: 'Access denied'
        })
      );

      const cleared = dataManagerReducer(
        failed,
        Actions.clearDataManager()
      );

      expect(Object.keys(cleared.entities)).toEqual([]);
    });

    it('removes pending loading state', () => {
      const loading = dataManagerReducer(
        initialState(),
        Actions.loadData({
          containerId,
          queryId: 'getCustomer'
        })
      );

      expect(
        loading.entities[containerId].loading
      ).toBe(true);

      const cleared = dataManagerReducer(
        loading,
        Actions.clearDataManager()
      );

      expect(Object.keys(cleared.entities)).toEqual([]);
    });

    it('removes data created by save operations', () => {
      const saved = dataManagerReducer(
        initialState(),
        Actions.saveDataSuccess({
          containerId,
          data: {
            id: 123,
            name: 'Updated'
          }
        })
      );

      const cleared = dataManagerReducer(
        saved,
        Actions.clearDataManager()
      );

      expect(Object.keys(cleared.entities)).toEqual([]);
    });

    it('removes pending delete state', () => {
      const deleting = dataManagerReducer(
        initialState(),
        Actions.deleteData({
          containerId,
          endpoint: '/api/customers/123'
        })
      );

      const cleared = dataManagerReducer(
        deleting,
        Actions.clearDataManager()
      );

      expect(Object.keys(cleared.entities)).toEqual([]);
    });

    it('clears multiple containers together', () => {
      let state = initialState();

      state = dataManagerReducer(
        state,
        Actions.loadDataSuccess({
          containerId: 'customerDetails',
          data: { id: 123 }
        })
      );

      state = dataManagerReducer(
        state,
        Actions.loadDataSuccess({
          containerId: 'customerOrders',
          data: [{ id: 900 }]
        })
      );

      state = dataManagerReducer(
        state,
        Actions.loadDataFailure({
          containerId: 'customerInvoices',
          error: 'Unable to load invoices'
        })
      );

      expect(
        Object.keys(state.entities).sort()
      ).toEqual([
        'customerDetails',
        'customerInvoices',
        'customerOrders'
      ]);

      const cleared = dataManagerReducer(
        state,
        Actions.clearDataManager()
      );

      expect(Object.keys(cleared.entities)).toEqual([]);
    });

    it('allows a fresh load after clearing', () => {
      const oldPage = dataManagerReducer(
        initialState(),
        Actions.loadDataSuccess({
          containerId,
          data: { id: 123 }
        })
      );

      const cleared = dataManagerReducer(
        oldPage,
        Actions.clearDataManager()
      );

      const nextPage = dataManagerReducer(
        cleared,
        Actions.loadData({
          containerId,
          queryId: 'getCustomer',
          bindVars: { id: '456' }
        })
      );

      expect(nextPage.entities[containerId]).toEqual({
        containerId,
        data: null,
        loading: true,
        error: null
      });
    });

    it('keeps the reset dictionary prototype-safe', () => {
      const loaded = dataManagerReducer(
        initialState(),
        Actions.loadDataSuccess({
          containerId,
          data: { id: 123 }
        })
      );

      const cleared = dataManagerReducer(
        loaded,
        Actions.clearDataManager()
      );

      expect(
        Object.getPrototypeOf(cleared.entities)
      ).toBeNull();
    });
  });

  describe('reserved container IDs', () => {
    const reservedIds = [
      'constructor',
      'toString',
      '__proto__',
      'hasOwnProperty'
    ];

    reservedIds.forEach(reservedId => {
      it(`stores '${reservedId}' as an ordinary container ID`, () => {
        const data = {
          id: reservedId,
          value: 42
        };

        const state = dataManagerReducer(
          initialState(),
          Actions.loadDataSuccess({
            containerId: reservedId,
            data
          })
        );

        expect(
          Object.prototype.hasOwnProperty.call(
            state.entities,
            reservedId
          )
        ).toBe(true);

        expect(state.entities[reservedId]).toEqual({
          containerId: reservedId,
          data,
          loading: false,
          error: null
        });

        expect(
          Object.getPrototypeOf(state.entities)
        ).toBeNull();
      });
    });

    it('keeps reserved IDs independent of normal IDs', () => {
      let state = initialState();

      state = dataManagerReducer(
        state,
        Actions.loadDataSuccess({
          containerId: '__proto__',
          data: 'reserved-data'
        })
      );

      state = dataManagerReducer(
        state,
        Actions.loadDataSuccess({
          containerId: 'customerDetails',
          data: 'customer-data'
        })
      );

      expect(
        state.entities['__proto__'].data
      ).toBe('reserved-data');

      expect(
        state.entities['customerDetails'].data
      ).toBe('customer-data');

      expect(
        Object.keys(state.entities).sort()
      ).toEqual([
        '__proto__',
        'customerDetails'
      ]);
    });

    it('supports updating a reserved container ID', () => {
      const loading = dataManagerReducer(
        initialState(),
        Actions.loadData({
          containerId: 'constructor',
          queryId: 'getCustomer'
        })
      );

      const loaded = dataManagerReducer(
        loading,
        Actions.loadDataSuccess({
          containerId: 'constructor',
          data: { id: 123 }
        })
      );

      expect(
        loaded.entities['constructor'].loading
      ).toBe(false);

      expect(
        loaded.entities['constructor'].data
      ).toEqual({ id: 123 });
    });

    it('clears reserved container IDs', () => {
      const loaded = dataManagerReducer(
        initialState(),
        Actions.loadDataSuccess({
          containerId: '__proto__',
          data: { id: 123 }
        })
      );

      const cleared = dataManagerReducer(
        loaded,
        Actions.clearDataManager()
      );

      expect(Object.keys(cleared.entities)).toEqual([]);

      expect(
        Object.prototype.hasOwnProperty.call(
          cleared.entities,
          '__proto__'
        )
      ).toBe(false);
    });
  });

  describe('immutability', () => {
    it('does not mutate previous state during updates', () => {
      const first = dataManagerReducer(
        initialState(),
        Actions.loadDataSuccess({
          containerId,
          data: { id: 123 }
        })
      );

      const second = dataManagerReducer(
        first,
        Actions.loadDataSuccess({
          containerId,
          data: { id: 456 }
        })
      );

      expect(first).not.toBe(second);

      expect(first.entities).not.toBe(
        second.entities
      );

      expect(
        first.entities[containerId].data
      ).toEqual({ id: 123 });

      expect(
        second.entities[containerId].data
      ).toEqual({ id: 456 });
    });

    it('does not mutate unrelated container slices', () => {
      let state = initialState();

      state = dataManagerReducer(
        state,
        Actions.loadDataSuccess({
          containerId: 'customers',
          data: [{ id: 123 }]
        })
      );

      state = dataManagerReducer(
        state,
        Actions.loadDataSuccess({
          containerId: 'orders',
          data: [{ id: 900 }]
        })
      );

      const originalCustomers =
        state.entities['customers'];

      const next = dataManagerReducer(
        state,
        Actions.loadDataSuccess({
          containerId: 'orders',
          data: [{ id: 901 }]
        })
      );

      expect(
        next.entities['customers']
      ).toBe(originalCustomers);

      expect(
        state.entities['orders'].data
      ).toEqual([{ id: 900 }]);

      expect(
        next.entities['orders'].data
      ).toEqual([{ id: 901 }]);
    });

    it('does not mutate previous state when clearing', () => {
      const previous = dataManagerReducer(
        initialState(),
        Actions.loadDataSuccess({
          containerId,
          data: { id: 123 }
        })
      );

      const cleared = dataManagerReducer(
        previous,
        Actions.clearDataManager()
      );

      expect(cleared).not.toBe(previous);

      expect(cleared.entities).not.toBe(
        previous.entities
      );

      expect(
        previous.entities[containerId].data
      ).toEqual({ id: 123 });

      expect(Object.keys(cleared.entities)).toEqual([]);
    });
  });
});
