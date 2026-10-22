import { createAction, props } from '@ngrx/store';
import { AuthResponse } from '../reducers/authentication.reducers';

// Login Actions
export const loginPage = createAction(
  '[Login Page] Login',
  props<{ endpoint: string; email: string; password: string }>()
);

export const loginSuccess = createAction(
  '[Auth API] Login Success',
  props<{ auth_response: AuthResponse }>()
);

export const loginFailure = createAction(
  '[Auth API] Login Failure',
  props<{ error: any }>()
);

// Rehydrate Auth (Check Local Storage)
export const rehydrateAuth = createAction('[Auth] Rehydrate Auth');

export const rehydrateAuthSuccess = createAction(
  '[Auth] Rehydrate Auth Success',
  props<{ auth_response: AuthResponse }>()
);

export const rehydrateAuthFailure = createAction(
  '[Auth] Rehydrate Auth Failure',
  props<{ error: any }>()
);

// Logout
export const logout = createAction('[Auth] Logout');
