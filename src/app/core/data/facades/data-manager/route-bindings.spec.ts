
import {
  resolveRouteBindings
} from './route-bindings';

describe('RouteBindings', () => {
  describe('parameter resolution', () => {
    it('resolves a route parameter', () => {
      const result = resolveRouteBindings(
        { id: '$route.id' },
        { id: '123' }
      );

      expect(result?.['id']).toBe('123');
    });

    it('resolves multiple route parameters', () => {
      const result = resolveRouteBindings(
        {
          customerId: '$route.customerId',
          orderId: '$route.orderId'
        },
        {
          customerId: '123',
          orderId: '900'
        }
      );

      expect(result?.['customerId']).toBe('123');
      expect(result?.['orderId']).toBe('900');
    });

    it('preserves numeric-looking IDs as strings', () => {
      const result = resolveRouteBindings(
        { id: '$route.id' },
        { id: '00123' }
      );

      expect(result?.['id']).toBe('00123');
    });

    it('supports empty-string parameter values', () => {
      const result = resolveRouteBindings(
        { id: '$route.id' },
        { id: '' }
      );

      expect(result?.['id']).toBe('');
    });
  });

  describe('literal values', () => {
    it('preserves ordinary strings', () => {
      const result = resolveRouteBindings(
        {
          status: 'active',
          label: 'Customer details'
        },
        {}
      );

      expect(result?.['status']).toBe('active');
      expect(result?.['label']).toBe('Customer details');
    });

    it('preserves numbers and booleans', () => {
      const result = resolveRouteBindings(
        {
          limit: 25,
          includeOrders: true,
          archived: false
        },
        {}
      );

      expect(result?.['limit']).toBe(25);
      expect(result?.['includeOrders']).toBe(true);
      expect(result?.['archived']).toBe(false);
    });

    it('preserves null, arrays and objects', () => {
      const filters = {
        active: true
      };

      const fields = ['id', 'name'];

      const result = resolveRouteBindings(
        {
          optional: null,
          filters,
          fields
        },
        {}
      );

      expect(result?.['optional']).toBeNull();
      expect(result?.['filters']).toBe(filters);
      expect(result?.['fields']).toBe(fields);
    });

    it('does not interpret partial string templates', () => {
      const result = resolveRouteBindings(
        {
          label: 'Customer $route.id'
        },
        { id: '123' }
      );

      expect(result?.['label']).toBe(
        'Customer $route.id'
      );
    });

    it('returns undefined for absent bindings', () => {
      expect(
        resolveRouteBindings(
          undefined,
          { id: '123' }
        )
      ).toBeUndefined();
    });

    it('supports an empty bindings object', () => {
      const result = resolveRouteBindings(
        {},
        { id: '123' }
      );

      expect(Object.keys(result ?? {})).toEqual([]);
    });
  });

  describe('invalid bindings', () => {
    it('rejects missing route parameters', () => {
      expect(() =>
        resolveRouteBindings(
          { id: '$route.id' },
          {}
        )
      ).toThrow(
        "Missing route parameter 'id'"
      );
    });

    it('rejects an incorrectly named parameter', () => {
      expect(() =>
        resolveRouteBindings(
          { id: '$route.customerId' },
          { id: '123' }
        )
      ).toThrow(
        "Missing route parameter 'customerId'"
      );
    });

    it('rejects an incomplete route reference', () => {
      expect(() =>
        resolveRouteBindings(
          { id: '$route.' },
          {}
        )
      ).toThrow(
        'Invalid route parameter binding'
      );
    });

    it('rejects nested route references', () => {
      expect(() =>
        resolveRouteBindings(
          { id: '$route.customer.id' },
          {}
        )
      ).toThrow(
        'Invalid route parameter binding'
      );
    });

    it('rejects invalid parameter names', () => {
      expect(() =>
        resolveRouteBindings(
          { id: '$route.123id' },
          {}
        )
      ).toThrow(
        'Invalid route parameter binding'
      );
    });

    it('does not resolve inherited properties', () => {
      const inheritedParams =
        Object.create({
          id: 'inherited-value'
        }) as Record<string, string>;

      expect(() =>
        resolveRouteBindings(
          { id: '$route.id' },
          inheritedParams
        )
      ).toThrow(
        "Missing route parameter 'id'"
      );
    });
  });

  describe('multiple containers', () => {
    it('resolves different IDs independently', () => {
      const customerBindings = {
        id: '$route.customerId',
        includeOrders: true
      };

      const orderBindings = {
        id: '$route.orderId',
        limit: 10
      };

      const routeParams = {
        customerId: '123',
        orderId: '900'
      };

      const customerResult =
        resolveRouteBindings(
          customerBindings,
          routeParams
        );

      const orderResult =
        resolveRouteBindings(
          orderBindings,
          routeParams
        );

      expect(customerResult?.['id']).toBe('123');
      expect(customerResult?.['includeOrders']).toBe(true);

      expect(orderResult?.['id']).toBe('900');
      expect(orderResult?.['limit']).toBe(10);

      expect(customerResult).not.toBe(orderResult);
    });

    it('does not mutate the original bindings', () => {
      const bindings = Object.freeze({
        id: '$route.id',
        limit: 20
      });

      const routeParams = Object.freeze({
        id: '123'
      });

      const result = resolveRouteBindings(
        bindings,
        routeParams
      );

      expect(result?.['id']).toBe('123');
      expect(result?.['limit']).toBe(20);

      expect(bindings.id).toBe('$route.id');
      expect(routeParams.id).toBe('123');

      expect(result).not.toBe(bindings);
    });

    it('keeps independently resolved requests isolated', () => {
      const definition = {
        id: '$route.id'
      };

      const first = resolveRouteBindings(
        definition,
        { id: '123' }
      );

      const second = resolveRouteBindings(
        definition,
        { id: '456' }
      );

      expect(first?.['id']).toBe('123');
      expect(second?.['id']).toBe('456');
      expect(definition.id).toBe('$route.id');
    });
  });

  describe('dictionary safety', () => {
    it('uses a null-prototype result dictionary', () => {
      const result = resolveRouteBindings(
        { id: '$route.id' },
        { id: '123' }
      );

      expect(
        Object.getPrototypeOf(result)
      ).toBeNull();
    });

    it('supports reserved binding keys safely', () => {
      const bindings = Object.fromEntries([
        ['__proto__', '$route.id'],
        ['constructor', 'literal'],
        ['toString', 42]
      ]);

      const result = resolveRouteBindings(
        bindings,
        { id: '123' }
      );

      expect(result?.['__proto__']).toBe('123');
      expect(result?.['constructor']).toBe('literal');
      expect(result?.['toString']).toBe(42);

      expect(
        Object.prototype.hasOwnProperty.call(
          result,
          '__proto__'
        )
      ).toBe(true);

      expect(
        Object.getPrototypeOf(result)
      ).toBeNull();
    });
  });
});
