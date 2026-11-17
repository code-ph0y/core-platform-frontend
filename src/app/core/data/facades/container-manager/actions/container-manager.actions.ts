
import { createAction, props } from '@ngrx/store';

import type {
  ContainerSpec
} from '../../../../plugins/containers/container-spec';

import type {
  RouteParameters
} from '../../data-manager/route-bindings';

/**
 * Load a compiled page definition.
 *
 * Preserve the existing applicationId + route
 * contract used by the frontend.
 *
 * routeParams carries the parameters resolved
 * from the browser URL by the backend.
 *
 * Example:
 *   applicationId: 'crm'
 *   route: '/customers/:id'
 *   routeParams: { id: '123' }
 */
export const loadPageDefinition = createAction(
  '[ContainerMgr] Load Page Definition',
  props<{
    applicationId: string;
    route: string;
    routeParams?: RouteParameters;
  }>()
);

/**
 * Page definition loaded successfully.
 *
 * Preserve route context so it can be passed
 * to the Data Manager preload action.
 */
export const loadPageDefinitionSuccess = createAction(
  '[ContainerMgr] Load Page Definition Success',
  props<{
    pageDefinition: ContainerSpec;
    routeParams?: RouteParameters;
  }>()
);

/**
 * Page definition loading failed.
 */
export const loadPageDefinitionFailure = createAction(
  '[ContainerMgr] Load Page Definition Failure',
  props<{
    error: any;
  }>()
);

/**
 * Clear the current page definition.
 */
export const clearPageDefinition = createAction(
  '[ContainerMgr] Clear Page Definition'
);
