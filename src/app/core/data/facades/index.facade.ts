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

/**
 * Root AppState interface, mapping each feature key to its typed state.
 */
export interface AppState {
  [routerFacade.routerStoreKey]: RouterReducerState<CustomRouterState>;
  [authFacade.authenticationKey]: authFacade.AuthState;
  [containerManagerFacade.containerManagerFeatureKey]: containerManagerFacade.ContainerManagerState;
  [dataManagerFacade.dataManagerKey]: dataManagerFacade.DataManagerState;
}

/**
 * Combine all your reducers in one map.
 * Must match keys in AppState interface.
 */
export const reducers: ActionReducerMap<AppState> = {
  [routerFacade.routerStoreKey]: routerFacade.routerReducer,
  [authFacade.authenticationKey]: authFacade.authReducer,
  [containerManagerFacade.containerManagerFeatureKey]: containerManagerFacade.containerManagerReducer,
  [dataManagerFacade.dataManagerKey]: dataManagerFacade.dataManagerReducer,
};

/**
 * Example meta-reducer that clears the store on logout.
 */
export function clearStateMetaReducer(reducer: ActionReducer<AppState>): ActionReducer<AppState> {
  return (state: AppState | undefined, action: Action): AppState => {
    if (action.type === authFacade.logout.type) {
      localStorage.removeItem('auth_response');
      // Clear entire store
      state = {} as AppState;
    }
    return reducer(state, action);
  };
}

/**
 * Optional debug meta-reducer that logs all actions and states in dev mode.
 */
export function debug(reducer: ActionReducer<any>): ActionReducer<any> {
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
export const metaReducers: MetaReducer<AppState>[] = !environment.production
  ? [debug, clearStateMetaReducer]
  : [clearStateMetaReducer];
