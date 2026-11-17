
import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';

import {
  getRouterSelectors,
  RouterReducerState
} from '@ngrx/router-store';

import {
  CustomRouterState
} from '../serializer/custom-router.serializer';

import {
  applicationRoutesFeatureKey
} from '../reducers/application-routes.reducer';

import type {
  ApplicationRoutesState
} from '../reducers/application-routes.reducer';

/**
 * Existing Angular Router Store selectors.
 */
export const selectRouterState =
  createFeatureSelector<RouterReducerState<CustomRouterState>>(
    'router'
  );

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

export const routerParams = createSelector(
  selectRouterState,
  routerState => routerState?.state ?? {}
);

/**
 * Application route discovery selectors.
 */
export const selectApplicationRoutesState =
  createFeatureSelector<ApplicationRoutesState>(
    applicationRoutesFeatureKey
  );

export const selectApplicationRoutes = createSelector(
  selectApplicationRoutesState,
  state => state.routes
);

export const selectApplicationRoutesLoading = createSelector(
  selectApplicationRoutesState,
  state => state.loading
);

export const selectApplicationRoutesLoaded = createSelector(
  selectApplicationRoutesState,
  state => state.loaded
);

export const selectApplicationRoutesError = createSelector(
  selectApplicationRoutesState,
  state => state.error
);

/**
 * Find the compiled route metadata for the
 * current Angular navigation.
 *
 * The backend route map is our source of truth
 * for page title and access requirements.
 *
 * Returns null if the current page is not
 * present in the discovered route map.
 */
export const selectCurrentApplicationRoute = createSelector(
  selectRouterState,
  selectApplicationRoutes,
  (routerState, routes) => {
    const applicationId =
      routerState?.state?.applicationId;

    const page =
      routerState?.state?.page;

    if (!applicationId || !page) {
      return null;
    }

    const path =
      `/applications/${applicationId}/${page}`;

    return routes[path] ?? null;
  }
);
