
import { createReducer, on } from '@ngrx/store';

import {
  loadApplicationRoutes,
  loadApplicationRoutesSuccess,
  loadApplicationRoutesFailure,
  clearApplicationRoutes,
} from '../actions/router.actions';

import type {
  ApplicationRouteMap,
} from '../actions/router.actions';

export const applicationRoutesFeatureKey = 'applicationRoutes';

export interface ApplicationRoutesState {
  routes: ApplicationRouteMap;
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

export const initialApplicationRoutesState: ApplicationRoutesState = {
  routes: {},
  loading: false,
  loaded: false,
  error: null,
};

export const applicationRoutesReducer = createReducer(
  initialApplicationRoutesState,

  /**
   * Begin loading routes for the current
   * authentication and organisation context.
   *
   * Clear old routes to avoid exposing stale
   * navigation entries during a context change.
   */
  on(loadApplicationRoutes, () => ({
    ...initialApplicationRoutesState,
    routes: {},
    loading: true,
  })),

  /**
   * Store the authorised route map returned
   * by the NestJS application registry.
   */
  on(loadApplicationRoutesSuccess, (state, { routes }) => ({
    ...state,
    routes,
    loading: false,
    loaded: true,
    error: null,
  })),

  /**
   * Clear routes when discovery fails.
   */
  on(loadApplicationRoutesFailure, (_, { error }) => ({
    routes: {},
    loading: false,
    loaded: false,
    error,
  })),

  /**
   * Clear all discovered routes when the
   * authentication context is reset.
   */
  on(clearApplicationRoutes, () => ({
    ...initialApplicationRoutesState,
    routes: {},
  })),
);
