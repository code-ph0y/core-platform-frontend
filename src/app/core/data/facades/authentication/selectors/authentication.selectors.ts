import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState, AuthResponse, authenticationKey } from '../reducers/authentication.reducers';

/**
 * Selects the entire AuthState from the store.
 * Make sure this matches how you register your feature in StoreModule.
 */
export const selectAuthState = createFeatureSelector<AuthState>(authenticationKey);

export const selectAuthResponse = createSelector(
  selectAuthState,
  (state: AuthState): AuthResponse => state.auth_response
);

export const selectAuthToken = createSelector(
  selectAuthState,
  (state: AuthState): string | null => state.auth_response.access_token
);

export const selectAuthError = createSelector(
  selectAuthState,
  (state: AuthState): any => state.error
);

export const isAuthenticated = createSelector(
  selectAuthState,
  (state: AuthState): boolean => {
    const { access_token, expires_at } = state.auth_response;
    if (!access_token || !expires_at) return false;

    // Convert string to milliseconds
    const expiresAtMs = new Date(expires_at).getTime();

    console.log('expiresAtMs', expiresAtMs);

    if (!Number.isFinite(expiresAtMs)) return false;
    return Date.now() < expiresAtMs;
  }
);
