
import { Injectable, inject } from '@angular/core';

import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';

import {
  ROUTER_NAVIGATION
} from '@ngrx/router-store';

import {
  catchError,
  map,
  merge,
  of,
  switchMap,
  takeUntil
} from 'rxjs';

import {
  loadPageDefinition,
  loadPageDefinitionFailure,
  loadPageDefinitionSuccess,
  clearPageDefinition
} from '../actions/container-manager.actions';

import {
  loadApplicationRoutes,
  clearApplicationRoutes
} from '../../router/actions/router.actions';

import {
  ContainerManagerService
} from '../services/container-manager.service';

import {
  preloadDataFromPageDefinition
} from '../../data-manager/actions/data-manager.actions';

@Injectable()
export class ContainerManagerEffects {
  private readonly actions$ = inject(Actions);

  private readonly containerManagerService =
    inject(ContainerManagerService);

  /**
   * Events that invalidate an in-flight
   * page-definition request.
   *
   * Cancel when:
   *
   * 1. The current page is cleared.
   * 2. Angular starts another navigation.
   * 3. Authorized route discovery refreshes.
   * 4. The authorized route map is cleared.
   */
  private readonly cancelPageLoad$ = merge(
    this.actions$.pipe(
      ofType(clearPageDefinition)
    ),

    this.actions$.pipe(
      ofType(ROUTER_NAVIGATION)
    ),

    this.actions$.pipe(
      ofType(loadApplicationRoutes)
    ),

    this.actions$.pipe(
      ofType(clearApplicationRoutes)
    )
  );

  /**
   * Load a compiled, permission-filtered
   * page definition from NestJS.
   *
   * applicationId:
   *   The owning application.
   *
   * route:
   *   The stable page ID resolved by NestJS.
   *
   * routeParams:
   *   Parameters extracted from the browser URL.
   *
   * Example:
   *
   * applicationId: 'crm'
   * route: 'customerDetails'
   * routeParams: { id: '123' }
   *
   * Route parameters do not affect which
   * page definition is fetched.
   *
   * They are preserved so the Data Manager
   * can resolve its query bindings later.
   */
  readonly load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadPageDefinition),

      /**
       * Starting a newer page load cancels
       * the previous HTTP request.
       */
      switchMap(({
                   applicationId,
                   route,
                   routeParams
                 }) =>
        this.containerManagerService
          .fetchPageDefinition(
            applicationId,
            route
          )
          .pipe(
            /**
             * Carry the route parameters
             * belonging to this specific
             * page request into its success.
             *
             * Do not read current router state
             * here: navigation may have changed
             * while the HTTP request was running.
             */
            map(pageDefinition =>
              loadPageDefinitionSuccess({
                pageDefinition,
                routeParams
              })
            ),

            /**
             * Handle errors from the currently
             * active page-definition request.
             */
            catchError(error => {
              console.error(
                '[PageDefinition HTTP error]',
                error
              );

              const message =
                error?.error?.message;

              return of(
                loadPageDefinitionFailure({
                  error:
                    (typeof message === 'string'
                      ? message
                      : error?.message) ??
                    'Failed to load page definition'
                })
              );
            }),

            /**
             * Prevent a late response from
             * repopulating page state after
             * navigation or context invalidation.
             *
             * Backend authorization remains
             * mandatory and authoritative.
             */
            takeUntil(
              this.cancelPageLoad$
            )
          )
      )
    )
  );

  /**
   * After a page definition loads,
   * trigger its metadata-defined data loads.
   *
   * IMPORTANT:
   *
   * Forward routeParams from the successful
   * page request, rather than deriving them
   * again from the current browser URL.
   *
   * This preserves the association between:
   *
   * - The page definition
   * - The resolved route parameters
   * - The data preload request
   *
   * Data Manager independently handles
   * cancellation of its HTTP requests.
   */
  readonly preloadOnSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadPageDefinitionSuccess),

      map(({
             pageDefinition,
             routeParams
           }) =>
        preloadDataFromPageDefinition({
          pageDefinition,
          routeParams
        })
      )
    )
  );
}
