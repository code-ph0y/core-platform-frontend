import { Injectable } from '@angular/core';
import { NavigationExtras } from '@angular/router';
import { Store } from '@ngrx/store';

import { Go, Back, Forward } from './actions/router.actions';

// Re-export so consumers can import from a single location
export * as fromRouterStore from '@ngrx/router-store';
export * from './actions/router.actions';
export * from './reducers/router.reducer';
export * from './selectors/router.selectors';

export const routerStoreKey = 'router';

/**
 * A simple facade that provides convenience methods to dispatch router actions,
 * like navigation and history operations.
 */
@Injectable({ providedIn: 'root' })
export class RouterFacade {
  // If you maintain a typed root store (e.g., `Store<AppState>`), inject that instead of `Store<unknown>`.
  constructor(private store: Store<unknown>) {}

  /**
   * Dispatches a 'Go' action to navigate to a specific path, with optional query params and navigation extras.
   */
  go(path: any[], queryParams?: Record<string, any>, extras?: NavigationExtras): void {
    // Pass path, queryParams, extras directly, without the "payload" key
    this.store.dispatch(new Go({ path, queryParams, extras }));
  }

  /** Dispatches a 'Back' action to navigate backward in browser history. */
  back(): void {
    this.store.dispatch(new Back());
  }

  /** Dispatches a 'Forward' action to navigate forward in browser history. */
  forward(): void {
    this.store.dispatch(new Forward());
  }
}
