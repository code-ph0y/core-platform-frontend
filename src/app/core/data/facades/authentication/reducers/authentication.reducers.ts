import { createReducer, on } from '@ngrx/store';
import {
  rehydrateAuthSuccess,
  loginSuccess,
  loginFailure,
  logout,
} from '../actions/authentication.actions';

/**
 * Represents the server's response for authentication.
 */
export interface AuthResponse {
  access_token: string | null;
  token_type: string | null;
  expires_at: string | null;
  revoked: string | null;
  navigate_to?: string; // Where to navigate upon successful login
}

export interface AuthState {
  auth_response: AuthResponse;
  error: any; // or `unknown` / a more specific type, if desired
}

export const initialState: AuthState = {
  auth_response: {
    access_token: null,
    token_type: null,
    expires_at: null,
    revoked: null,
  },
  error: null,
};

export const authenticationKey = 'auth';

export const authReducer = createReducer(
  initialState,

  // On successful login or rehydration, store the new AuthResponse
  on(rehydrateAuthSuccess, loginSuccess, (state, { auth_response }) => ({
    ...state,
    auth_response,
    error: null
  })),

  // On login failure, clear out the auth_response and store the error
  on(loginFailure, (state, { error }) => ({
    ...state,
    auth_response: { ...initialState.auth_response },
    error
  })),

  // On logout, reset to the initial state
  on(logout, () => ({
    ...initialState
  }))
);
