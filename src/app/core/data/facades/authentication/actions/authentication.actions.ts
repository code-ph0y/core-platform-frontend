
import { createAction, props } from '@ngrx/store';

import type {
  AuthResponse
} from '../reducers/authentication.reducers';

import type {
  CurrentUserResponse
} from '../services/authentication.service';

/**
 * Login Actions
 */

export const loginPage = createAction(
  '[Login Page] Login',
  props<{
    endpoint: string;
    email: string;
    password: string;
  }>()
);

export const loginSuccess = createAction(
  '[Auth API] Login Success',
  props<{
    auth_response: AuthResponse;
  }>()
);

export const loginFailure = createAction(
  '[Auth API] Login Failure',
  props<{
    error: any;
  }>()
);

/**
 * Rehydrate Auth
 *
 * Restore the previously stored session.
 * Organisation memberships must be
 * refreshed separately from the backend.
 */

export const rehydrateAuth = createAction(
  '[Auth] Rehydrate Auth'
);

export const rehydrateAuthSuccess = createAction(
  '[Auth] Rehydrate Auth Success',
  props<{
    auth_response: AuthResponse;
  }>()
);

export const rehydrateAuthFailure = createAction(
  '[Auth] Rehydrate Auth Failure',
  props<{
    error: any;
  }>()
);

/**
 * Current User / Organisation Discovery
 *
 * The backend returns only verified,
 * minimal organisation information.
 *
 * Roles and permission grants are not
 * included in this API contract.
 */

export const loadCurrentUser = createAction(
  '[Auth API] Load Current User'
);

export const loadCurrentUserSuccess = createAction(
  '[Auth API] Load Current User Success',
  props<{
    user: CurrentUserResponse;
  }>()
);

export const loadCurrentUserFailure = createAction(
  '[Auth API] Load Current User Failure',
  props<{
    error: any;
  }>()
);

export const requestLogout = createAction(
  '[Auth] Request Logout'
);

export const logout = createAction(
  '[Auth] Logout'
);

/**
 * Select the organisation whose
 * application data is being accessed.
 *
 * The reducer checks that the selection
 * belongs to the discovered memberships.
 *
 * NestJS must independently verify
 * membership on protected API requests.
 */

export const selectOrganisation = createAction(
  '[Auth] Select Organisation',
  props<{
    organisationId: string;
  }>()
);
