
import {
  routerReducer as ngrxRouterReducer,
  RouterReducerState
} from '@ngrx/router-store';

import { Action } from '@ngrx/store';

import { CustomRouterState } from '../serializer/custom-router.serializer';

export const initialRouterState: RouterReducerState<CustomRouterState> = {
  state: {
    url: '',
    params: {},
    queryParams: {},
    applicationId: null,
    page: null
  },
  navigationId: 0
};

/**
 * Use the official NgRx Router Store reducer.
 *
 * This handles navigation lifecycle actions, cancellations,
 * errors and navigation IDs.
 */
export function routerReducer(
  state: RouterReducerState<CustomRouterState> | undefined,
  action: Action
): RouterReducerState<CustomRouterState> {
  return ngrxRouterReducer<CustomRouterState>(
    state ?? initialRouterState,
    action
  );
}
