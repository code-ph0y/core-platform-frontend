import {
  Action,
  ActionReducer,
  ActionReducerMap,
  MetaReducer
} from '@ngrx/store';

import {
  RouterReducerState
} from '@ngrx/router-store';

import { environment } from '../../../../environments/environment';

// Authentication
import * as authFacade from './authentication/authentication.facade';

// Container Manager
import * as containerManagerFacade from './container-manager/container-manager.facade';

// Data Manager
import * as dataManagerFacade from './data-manager/data-manager.facade';

// Router
import * as routerFacade from './router/router.facade';
import { CustomRouterState } from './router/serializer/custom-router.serializer';

// Application Routes
import {
  applicationRoutesFeatureKey,
  applicationRoutesReducer,
  initialApplicationRoutesState
} from './router/reducers/application-routes.reducer';

import type {
  ApplicationRoutesState
} from './router/reducers/application-routes.reducer';

/**
 * Root AppState interface, mapping each
 * feature key to its typed state.
 */
export interface AppState {
  [routerFacade.routerStoreKey]:
    RouterReducerState<CustomRouterState>;

  [authFacade.authenticationKey]:
    authFacade.AuthState;

  [containerManagerFacade.containerManagerFeatureKey]:
    containerManagerFacade.ContainerManagerState;

  [dataManagerFacade.dataManagerKey]:
    dataManagerFacade.DataManagerState;

  [applicationRoutesFeatureKey]:
    ApplicationRoutesState;
}

/**
 * Combine all reducers in one map.
 */
export const reducers: ActionReducerMap<AppState> = {
  [routerFacade.routerStoreKey]:
  routerFacade.routerReducer,

  [authFacade.authenticationKey]:
  authFacade.authReducer,

  [containerManagerFacade.containerManagerFeatureKey]:
  containerManagerFacade.containerManagerReducer,

  [dataManagerFacade.dataManagerKey]:
  dataManagerFacade.dataManagerReducer,

  [applicationRoutesFeatureKey]:
  applicationRoutesReducer,
};

/**
 * Clear the entire store on logout.
 */
export function clearStateMetaReducer(
  reducer: ActionReducer<AppState>
): ActionReducer<AppState> {
  return (state: AppState | undefined, action: Action): AppState => {
    if (action.type === authFacade.logout.type) {
      localStorage.removeItem('auth_response');
      state = {} as AppState;
    }

    return reducer(state, action);
  };
}

/**
 * Immediately invalidate tenant-scoped state when the
 * authenticated user selects a different, valid organisation.
 *
 * The authentication reducer validates membership.
 *
 * We compare state before and after the action to
 * detect whether the selection was accepted.
 */
export function clearTenantStateMetaReducer(
  reducer: ActionReducer<AppState>
): ActionReducer<AppState> {
  return (state: AppState | undefined, action: Action): AppState => {
    if (
      !state ||
      action.type !== authFacade.selectOrganisation.type
    ) {
      return reducer(state, action);
    }

    const previousOrganisationId =
      state[authFacade.authenticationKey]?.selectedOrganisationId;

    const nextState = reducer(state, action);

    const nextOrganisationId =
      nextState[authFacade.authenticationKey]?.selectedOrganisationId;

    // Invalid or repeated selections leave
    // existing tenant state untouched.
    if (
      !nextOrganisationId ||
      previousOrganisationId === nextOrganisationId
    ) {
      return nextState;
    }

    return {
      ...nextState,

      // Clear the previous organisation's page.
      [containerManagerFacade.containerManagerFeatureKey]:
      containerManagerFacade.initialContainerManagerState,

      // Clear the previous organisation's data.
      [dataManagerFacade.dataManagerKey]:
      dataManagerFacade.initialDataManagerState,

      // Clear routes discovered under the previous
      // organisation's authentication context.
      [applicationRoutesFeatureKey]:
      initialApplicationRoutesState,
    };
  };
}

/**
 * Optional debug meta-reducer.
 */
export function debug(
  reducer: ActionReducer<any>
): ActionReducer<any> {
  return (state, action) => {
    console.debug('state before:', state);
    console.debug('action:', action);

    const nextState = reducer(state, action);

    console.debug('state after:', nextState);

    return nextState;
  };
}

/**
 * Compose meta-reducers depending on environment.
 */
export const metaReducers: MetaReducer<AppState>[] =
  !environment.production
    ? [
      debug,
      clearStateMetaReducer,
      clearTenantStateMetaReducer,
    ]
    : [
      clearStateMetaReducer,
      clearTenantStateMetaReducer,
    ];
