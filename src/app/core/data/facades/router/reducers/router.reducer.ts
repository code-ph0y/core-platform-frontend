import { Action } from '@ngrx/store';
import { RouterReducerState } from '@ngrx/router-store';
import { CustomRouterState } from '../serializer/custom-router.serializer';
import { ROUTER_NAVIGATED } from '@ngrx/router-store';

/**
 * Initial router state for our custom router store.
 */
export const initialRouterState: RouterReducerState<CustomRouterState> = {
  state: {
    resource: '',
    resourceType: '',
    version: '',
    queryParams: {},
    url: '',
    params: {},
  },
  navigationId: 0,
};

/**
 * A basic router reducer that merges @ngrx/router-store data with
 * our custom state. If your app relies on the default router-store,
 * you may skip this and let StoreRouterConnectingModule handle it automatically.
 */
export function routerReducer(
  state: RouterReducerState<CustomRouterState> = initialRouterState,
  action: Action
): RouterReducerState<CustomRouterState> {
  switch (action.type) {
    case ROUTER_NAVIGATED: {
      // The payload has shape: { routerState, event }
      // The custom serializer sets action.payload.routerState
      const routerState = (action as any).payload?.routerState;
      return {
        ...state,
        state: {
          ...routerState,
        },
      };
    }
    default:
      return state;
  }
}
