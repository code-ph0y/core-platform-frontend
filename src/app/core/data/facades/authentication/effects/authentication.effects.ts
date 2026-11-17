
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';

import { Store } from '@ngrx/store';

import { EMPTY, of } from 'rxjs';

import {
  catchError,
  exhaustMap,
  filter,
  map,
  mergeMap,
  pairwise,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom
} from 'rxjs/operators';

import {
  loginPage,
  loginSuccess,
  loginFailure,
  rehydrateAuth,
  rehydrateAuthSuccess,
  rehydrateAuthFailure,
  requestLogout,
  logout,
  selectOrganisation,
  loadCurrentUser,
  loadCurrentUserSuccess,
  loadCurrentUserFailure
} from '../actions/authentication.actions';

import {
  selectSelectedOrganisationId
} from '../selectors/authentication.selectors';

import {
  clearPageDefinition
} from '../../container-manager/actions/container-manager.actions';

import {
  clearDataManager
} from '../../data-manager/actions/data-manager.actions';

import {
  AuthenticationService
} from '../services/authentication.service';

import {
  AlertService
} from '../../../services/alert/alert.service';

import type {
  AuthResponse
} from '../reducers/authentication.reducers';

import {
  environment
} from '../../../../../../environments/environment';

interface OrganisationPreference {
  userId: string;
  organisationId: string;
}

@Injectable()
export class AuthenticationEffects {
  private readonly actions$ = inject(Actions);
  private readonly authService = inject(AuthenticationService);
  private readonly alertService = inject(AlertService);
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  private readonly organisationPreferenceKey =
    'core-platform:selected-organisation';

  private currentUserId: string | null = null;

  private backendLogoutFailed = false;

  constructor() {
    if (!environment.production) {
      console.debug('AuthenticationEffects initialized');
    }
  }

  /**
   * Restore the persisted authentication session.
   *
   * The reducer discards cached memberships.
   * Verified organisations are fetched again
   * from NestJS.
   */
  readonly hydrate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(rehydrateAuth),

      map(() => {
        const raw = localStorage.getItem(
          'auth_response'
        );

        if (!raw) {
          return {
            type: '[Auth] Rehydrate Noop'
          } as any;
        }

        try {
          const authResponse: AuthResponse =
            JSON.parse(raw);

          return rehydrateAuthSuccess({
            auth_response: authResponse
          });
        } catch (error) {
          console.error(
            'Rehydration Error:',
            error
          );

          localStorage.removeItem(
            'auth_response'
          );

          return rehydrateAuthFailure({
            error: 'Corrupt session in storage'
          });
        }
      })
    )
  );

  /**
   * Authenticate the user.
   *
   * Persist the access token BEFORE
   * dispatching loginSuccess.
   */
  readonly login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loginPage),

      tap(() => {
        this.currentUserId = null;
        this.clearOrganisationPreference();
      }),

      switchMap(({ endpoint, email, password }) =>
        this.authService
          .login(endpoint, email, password)
          .pipe(
            tap((authResponse: AuthResponse) => {
              localStorage.setItem(
                'auth_response',
                JSON.stringify(authResponse)
              );
            }),

            map((authResponse: AuthResponse) =>
              loginSuccess({
                auth_response: authResponse
              })
            ),

            catchError(error => {
              console.error(
                'Login failed:',
                error
              );

              return of(
                loginFailure({
                  error:
                    error?.message ||
                    'Login failed'
                })
              );
            })
          )
      )
    )
  );

  /**
   * Discover the current user after
   * login or session restoration.
   */
  readonly discoverCurrentUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        loginSuccess,
        rehydrateAuthSuccess
      ),

      filter(({ auth_response }) =>
        typeof auth_response.access_token ===
        'string' &&
        auth_response.access_token.length > 0
      ),

      map(() => loadCurrentUser())
    )
  );

  /**
   * Retrieve verified organisation choices.
   *
   * Cancel discovery when authentication
   * changes or the user logs out.
   */
  readonly loadCurrentUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCurrentUser),

      switchMap(() =>
        this.authService.getCurrentUser().pipe(
          map(user =>
            loadCurrentUserSuccess({
              user
            })
          ),

          catchError(error =>
            of(
              loadCurrentUserFailure({
                error:
                  error?.message ||
                  'Failed to load current user'
              })
            )
          ),

          takeUntil(
            this.actions$.pipe(
              ofType(
                logout,
                loginPage,
                rehydrateAuth
              )
            )
          )
        )
      )
    )
  );

  /**
   * Restore the previously selected
   * organisation after F5.
   *
   * Only restore a preference when it
   * belongs to the same user and is
   * present in newly verified memberships.
   */
  readonly restoreOrganisationSelection$ =
    createEffect(() =>
      this.actions$.pipe(
        ofType(loadCurrentUserSuccess),

        withLatestFrom(
          this.store.select(
            selectSelectedOrganisationId
          )
        ),

        mergeMap(([{ user }, selectedId]) => {
          this.currentUserId = user.id;

          if (selectedId) {
            this.saveOrganisationPreference({
              userId: user.id,
              organisationId: selectedId
            });

            return EMPTY;
          }

          const preference =
            this.readOrganisationPreference();

          if (!preference) {
            return EMPTY;
          }

          if (preference.userId !== user.id) {
            this.clearOrganisationPreference();
            return EMPTY;
          }

          const isStillAllowed =
            user.organisations.some(
              organisation =>
                organisation.id ===
                preference.organisationId
            );

          if (!isStillAllowed) {
            this.clearOrganisationPreference();
            return EMPTY;
          }

          return of(
            selectOrganisation({
              organisationId:
              preference.organisationId
            })
          );
        })
      )
    );

  /**
   * Report successful login.
   *
   * Navigation waits until an organisation
   * has been selected.
   */
  readonly loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(loginSuccess),

        tap(() => {
          if (!environment.production) {
            console.debug(
              '[Login Success] Waiting for organisation discovery'
            );
          }

          this.alertService.success(
            'Login Successful'
          );
        })
      ),
    {
      dispatch: false
    }
  );

  /**
   * Navigate from /login to the registered
   * dashboard route when an organisation
   * becomes available.
   *
   * Preserve existing deep links.
   */
  readonly navigateAfterOrganisationReady$ =
    createEffect(
      () =>
        this.actions$.pipe(
          ofType(
            loadCurrentUserSuccess,
            selectOrganisation
          ),

          withLatestFrom(
            this.store.select(
              selectSelectedOrganisationId
            )
          ),

          filter(([, organisationId]) =>
            typeof organisationId ===
            'string' &&
            organisationId.length > 0
          ),

          tap(() => {
            const currentPath =
              this.router.url
                .split('?')[0]
                .split('#')[0];

            if (currentPath !== '/login') {
              return;
            }

            void this.router
              .navigateByUrl('/dashboard')
              .catch(error => {
                console.error(
                  'Dashboard navigation failed:',
                  error
                );
              });
          })
        ),
      {
        dispatch: false
      }
    );

  /**
   * Report login errors.
   */
  readonly loginError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(loginFailure),

        tap(({ error }) => {
          if (!environment.production) {
            console.debug(
              '[Login Error] effect triggered'
            );
          }

          this.alertService.error(error);
        })
      ),
    {
      dispatch: false
    }
  );

  /**
   * STEP 67:
   *
   * Request backend logout BEFORE
   * dispatching the state-clearing action.
   *
   * This keeps the Bearer token available
   * to the HTTP interceptor while NestJS
   * processes the revocation request.
   *
   * exhaustMap prevents overlapping logout
   * requests from repeated button clicks.
   *
   * If the server request fails, we still
   * clear the local session.
   */
  readonly requestLogout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(requestLogout),

      exhaustMap(() => {
        this.backendLogoutFailed = false;

        return this.authService.logout().pipe(
          map(() => logout()),

          catchError(error => {
            this.backendLogoutFailed = true;

            console.error(
              'Backend logout failed:',
              error
            );

            return of(logout());
          })
        );
      })
    )
  );

  /**
   * Complete local logout.
   *
   * This runs after successful or failed
   * backend logout.
   *
   * Existing direct logout actions also
   * continue to clear local state.
   */
  readonly logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(logout),

        tap(() => {
          this.currentUserId = null;
          this.clearOrganisationPreference();

          localStorage.removeItem(
            'auth_response'
          );

          void this.router.navigate([
            '/login'
          ]);

          if (this.backendLogoutFailed) {
            this.alertService.error(
              'Signed out locally, but server session revocation could not be confirmed.'
            );
          } else {
            this.alertService.success(
              'You have been logged out'
            );
          }

          this.backendLogoutFailed = false;
        })
      ),
    {
      dispatch: false
    }
  );

  /**
   * Clear page and data state when
   * the selected organisation changes.
   *
   * Save only a user-scoped organisation
   * preference, never permission grants.
   */
  readonly organisationChanged$ = createEffect(() =>
    this.store
      .select(selectSelectedOrganisationId)
      .pipe(
        pairwise(),

        filter(
          ([previousId, currentId]) =>
            previousId !== currentId &&
            currentId !== null
        ),

        tap(([, currentId]) => {
          if (
            this.currentUserId &&
            typeof currentId === 'string'
          ) {
            this.saveOrganisationPreference({
              userId: this.currentUserId,
              organisationId: currentId
            });
          }
        }),

        mergeMap(() => [
          clearPageDefinition(),
          clearDataManager()
        ])
      )
  );

  /**
   * Read the previously selected
   * organisation from sessionStorage.
   *
   * The preference is never treated as
   * proof of authorization.
   */
  private readOrganisationPreference():
    OrganisationPreference | null {
    try {
      const raw = sessionStorage.getItem(
        this.organisationPreferenceKey
      );

      if (!raw) {
        return null;
      }

      const value: unknown = JSON.parse(raw);

      if (
        typeof value !== 'object' ||
        value === null ||
        !('userId' in value) ||
        !('organisationId' in value) ||
        typeof value.userId !== 'string' ||
        typeof value.organisationId !== 'string'
      ) {
        return null;
      }

      return {
        userId: value.userId,
        organisationId: value.organisationId
      };
    } catch {
      return null;
    }
  }

  private saveOrganisationPreference(
    preference: OrganisationPreference
  ): void {
    try {
      sessionStorage.setItem(
        this.organisationPreferenceKey,
        JSON.stringify(preference)
      );
    } catch {
      // Storage may be unavailable.
      // Organisation selection still works,
      // but preference restoration will not.
    }
  }

  private clearOrganisationPreference(): void {
    try {
      sessionStorage.removeItem(
        this.organisationPreferenceKey
      );
    } catch {
      // Ignore unavailable browser storage.
    }
  }
}
