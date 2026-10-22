import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

import { AppState } from '../index.facade';
import { loginPage, logout } from './actions/authentication.actions';
import { isAuthenticated, selectAuthError } from './selectors/authentication.selectors';

// Re-export so consumers can import from a single barrel
export * from './reducers/authentication.reducers';
export * from './actions/authentication.actions';
export * from './selectors/authentication.selectors';

@Injectable({ providedIn: 'root' })
export class AuthenticationFacade {
  constructor(private store: Store<AppState>) {}

  /**
   * Dispatches the LoginPage action to authenticate.
   */
  login(endpoint: string, email: string, password: string): void {
    this.store.dispatch(loginPage({ endpoint, email, password }));
  }

  /**
   * Dispatches the Logout action to clear auth state.
   */
  logout(): void {
    this.store.dispatch(logout());
  }

  // Selectors exposed as getters
  get isAuthenticated$(): Observable<boolean> {
    return this.store.select(isAuthenticated);
  }

  get error$(): Observable<any> {
    return this.store.select(selectAuthError);
  }

  /**
   * Synchronously checks if user is authenticated.
   * Blocks once with `take(1)` to grab current auth value.
   */
  isAuthenticatedSync(): boolean {
    let authed = false;
    this.isAuthenticated$.pipe(take(1)).subscribe(isAuthed => (authed = isAuthed));
    return authed;
  }
}
