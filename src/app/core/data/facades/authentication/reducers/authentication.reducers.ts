
import { createReducer, on } from '@ngrx/store';

import {
  rehydrateAuthSuccess,
  loginSuccess,
  loginFailure,
  logout,
  selectOrganisation,
  loadCurrentUserSuccess,
  loadCurrentUserFailure,
} from '../actions/authentication.actions';

/**
 * Use the minimal organisation contract
 * returned by GET /api/auth/me.
 *
 * There are deliberately no frontend
 * roles or permission grants here.
 *
 * Re-export the type to preserve existing
 * imports from this reducer file.
 */
export type AuthenticatedOrganisation =
  import('../services/authentication.service').AuthenticatedOrganisation;

/**
 * Authentication session response.
 *
 * Login and refresh supply the token fields.
 *
 * Organisations are populated separately,
 * after authenticated discovery succeeds.
 *
 * The optional organisations property is
 * retained for compatibility with existing
 * state selectors.
 */
export interface AuthResponse {
  access_token: string | null;
  token_type: string | null;
  expires_at: string | null;
  revoked: string | null;
  organisations?: AuthenticatedOrganisation[];
}

export interface AuthState {
  auth_response: AuthResponse;

  /**
   * The organisation selected for the
   * current authenticated session.
   *
   * Selection in Angular is only a UI
   * convenience. NestJS must authorize
   * every organisation-scoped request.
   */
  selectedOrganisationId: string | null;

  error: any;
}

export const authenticationKey = 'auth';

export const initialState: AuthState = {
  auth_response: {
    access_token: null,
    token_type: null,
    expires_at: null,
    revoked: null,
    organisations: [],
  },

  selectedOrganisationId: null,

  error: null,
};

export const authReducer = createReducer(
  initialState,

  /**
   * Login and rehydration restore only
   * the authentication session.
   *
   * IMPORTANT:
   *
   * Never trust organisation memberships
   * supplied by an old localStorage session.
   *
   * The user must be fetched from NestJS
   * before selecting an organisation.
   */
  on(
    rehydrateAuthSuccess,
    loginSuccess,
    (state, { auth_response }): AuthState => ({
      ...state,

      auth_response: {
        ...auth_response,

        // Discard any cached memberships.
        organisations: [],
      },

      // Wait for verified discovery.
      selectedOrganisationId: null,

      error: null,
    })
  ),

  /**
   * Accept verified organisation choices
   * returned by GET /api/auth/me.
   *
   * One membership:
   *   Select it automatically.
   *
   * Multiple memberships:
   *   Preserve an existing selection only
   *   if it remains valid.
   *
   * No memberships:
   *   Leave the selection empty.
   */
  on(
    loadCurrentUserSuccess,
    (state, { user }): AuthState => {
      // Ignore a late response after logout.
      if (!state.auth_response.access_token) {
        return state;
      }

      const organisations =
        Array.isArray(user.organisations)
          ? user.organisations
          : [];

      const previousSelection =
        state.selectedOrganisationId;

      let selectedOrganisationId: string | null =
        null;

      if (organisations.length === 1) {
        selectedOrganisationId =
          organisations[0].id;
      } else if (
        previousSelection !== null &&
        organisations.some(
          organisation =>
            organisation.id === previousSelection
        )
      ) {
        selectedOrganisationId =
          previousSelection;
      }

      return {
        ...state,

        auth_response: {
          ...state.auth_response,

          // Verified choices only.
          organisations,
        },

        selectedOrganisationId,

        error: null,
      };
    }
  ),

  /**
   * If current-user discovery fails,
   * do not retain previously discovered
   * organisation choices.
   *
   * A global HTTP 401 handler may also
   * trigger logout separately.
   */
  on(
    loadCurrentUserFailure,
    (state, { error }): AuthState => {
      if (!state.auth_response.access_token) {
        return state;
      }

      return {
        ...state,

        auth_response: {
          ...state.auth_response,
          organisations: [],
        },

        selectedOrganisationId: null,

        error,
      };
    }
  ),

  /**
   * Manual organisation selection.
   *
   * Only accept organisations from the
   * latest verified discovery response.
   *
   * NestJS must still validate membership
   * independently for protected requests.
   */
  on(
    selectOrganisation,
    (state, { organisationId }): AuthState => {
      const isAllowed = (
        state.auth_response.organisations ?? []
      ).some(
        organisation =>
          organisation.id === organisationId
      );

      if (
        !state.auth_response.access_token ||
        !isAllowed
      ) {
        return state;
      }

      if (
        state.selectedOrganisationId ===
        organisationId
      ) {
        return state;
      }

      return {
        ...state,
        selectedOrganisationId:
        organisationId,
      };
    }
  ),

  /**
   * Failed login clears authentication
   * and organisation context.
   */
  on(
    loginFailure,
    (state, { error }): AuthState => ({
      ...state,

      auth_response: {
        ...initialState.auth_response,
        organisations: [],
      },

      selectedOrganisationId: null,

      error,
    })
  ),

  /**
   * Logout removes the complete
   * authentication and organisation state.
   */
  on(
    logout,
    (): AuthState => ({
      ...initialState,

      auth_response: {
        ...initialState.auth_response,
        organisations: [],
      },
    })
  )
);
