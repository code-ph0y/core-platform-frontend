import { createFeatureSelector, createSelector } from '@ngrx/store';
import { getRouterSelectors, RouterReducerState } from '@ngrx/router-store';
import { CustomRouterState } from '../serializer/custom-router.serializer';

// Create a feature selector for the 'router' slice of state
export const selectRouterState =
  createFeatureSelector<RouterReducerState<CustomRouterState>>('router');

// We can extract typed router selectors:
export const {
  selectCurrentRoute,
  selectFragment,
  selectQueryParams,
  selectQueryParam,
  selectRouteParams,
  selectRouteParam,
  selectRouteData,
  selectUrl,
  selectTitle,
} = getRouterSelectors(selectRouterState);

/**
 * Select custom fields from our router state (like resource, type, id).
 * If routerState is missing, we default to an empty object.
 */
export const routerParams = createSelector(
  selectRouterState,
  (routerState) => routerState?.state ?? {}
);
