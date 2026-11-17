
/**
 * Route parameter bindings for page data requests.
 *
 * Page definitions can reference parameters
 * returned by the application's route resolver.
 *
 * Example:
 *
 * Route:
 *   /crm/customers/{id}
 *
 * Browser URL:
 *   /crm/customers/123
 *
 * Resolved parameters:
 *   { id: '123' }
 *
 * Page bindVars:
 *   {
 *     id: '$route.id',
 *     includeOrders: true
 *   }
 *
 * Result:
 *   {
 *     id: '123',
 *     includeOrders: true
 *   }
 */

export type RouteParameters =
  Readonly<Record<string, string>>;

export type DataBindings =
  Readonly<Record<string, unknown>>;

/**
 * Only complete route parameter references
 * are supported.
 *
 * This deliberately avoids arbitrary
 * JavaScript evaluation or string templates.
 */
const ROUTE_REFERENCE =
  /^\$route\.([A-Za-z_][A-Za-z0-9_]*)$/;

/**
 * Convert page-defined bindVars into
 * resolved query variables.
 *
 * Rules:
 *
 * - Literal values remain unchanged.
 * - "$route.id" resolves from routeParams.id.
 * - Missing parameters fail explicitly.
 * - Input objects are never mutated.
 * - Reserved object keys are handled safely.
 */
export function resolveRouteBindings(
  bindVars: DataBindings | undefined,
  routeParams: RouteParameters
): Record<string, unknown> | undefined {
  if (!bindVars) {
    return undefined;
  }

  const resolved = Object.create(null) as
    Record<string, unknown>;

  for (const [key, value] of Object.entries(bindVars)) {
    if (typeof value !== 'string') {
      resolved[key] = value;
      continue;
    }

    if (!value.startsWith('$route.')) {
      resolved[key] = value;
      continue;
    }

    const match = ROUTE_REFERENCE.exec(value);

    if (!match) {
      throw new Error(
        `Invalid route parameter binding: '${value}'`
      );
    }

    const parameterName = match[1];

    if (
      !Object.prototype.hasOwnProperty.call(
        routeParams,
        parameterName
      )
    ) {
      throw new Error(
        `Missing route parameter '${parameterName}' ` +
        `required by binding '${key}'`
      );
    }

    resolved[key] = routeParams[parameterName];
  }

  return resolved;
}
