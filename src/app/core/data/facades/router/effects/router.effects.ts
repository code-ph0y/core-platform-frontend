
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';

import {
  Actions,
  createEffect,
  ofType,
  ROOT_EFFECTS_INIT
} from '@ngrx/effects';

import {
  ROUTER_NAVIGATED,
  ROUTER_NAVIGATION
} from '@ngrx/router-store';

import { Store } from '@ngrx/store';

import {
  combineLatest,
  concat,
  EMPTY,
  merge,
  of
} from 'rxjs';

import {
  catchError,
  distinctUntilChanged,
  map,
  skip,
  switchMap,
  takeUntil,
  tap,
  withLatestFrom
} from 'rxjs/operators';

import {
  Back,
  Forward,
  Go,
  RouterActionTypes,
  loadApplicationRoutes,
  loadApplicationRoutesSuccess,
  loadApplicationRoutesFailure,
  clearApplicationRoutes
} from '../actions/router.actions';

import {
  clearPageDefinition,
  loadPageDefinition
} from '../../container-manager/actions/container-manager.actions';

import {
  isAuthenticated,
  selectAuthToken,
  selectSelectedOrganisationId
} from '../../authentication/selectors/authentication.selectors';

import {
  selectApplicationRoutesState
} from '../selectors/router.selectors';

import {
  RouterService
} from '../services/router.service';

import type {
  ResolvedApplicationBrowserRoute
} from '../services/router.service';

import type {
  RouteParameters
} from '../../data-manager/route-bindings';

type PageResolutionTrigger =
  | 'resolve'
  | 'invalidate';

@Injectable()
export class RouterEffects {
  private readonly actions$ = inject(Actions);
  private readonly router = inject(Router);
  private readonly store = inject(Store);

  private readonly routerService =
    inject(RouterService);

  /**
   * Refresh authorized routes on startup
   * and whenever authentication or
   * organisation context changes.
   */
  readonly refreshApplicationRoutesOnContextChange$ =
    createEffect(() => {
      const contextChanges$ = combineLatest([
        this.store.select(selectAuthToken),
        this.store.select(selectSelectedOrganisationId)
      ]).pipe(
        distinctUntilChanged(
          (
            [previousToken, previousOrganisationId],
            [currentToken, currentOrganisationId]
          ) =>
            previousToken === currentToken &&
            previousOrganisationId === currentOrganisationId
        ),

        skip(1)
      );

      return merge(
        this.actions$.pipe(
          ofType(ROOT_EFFECTS_INIT)
        ),

        contextChanges$
      ).pipe(
        map(() => loadApplicationRoutes())
      );
    });

  /**
   * Fetch authorized application routes.
   *
   * Cancel the request if authentication
   * or organisation context changes.
   */
  readonly loadApplicationRoutes$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadApplicationRoutes),

      switchMap(() => {
        const contextChanged$ = combineLatest([
          this.store.select(selectAuthToken),
          this.store.select(selectSelectedOrganisationId)
        ]).pipe(
          distinctUntilChanged(
            (
              [previousToken, previousOrganisationId],
              [currentToken, currentOrganisationId]
            ) =>
              previousToken === currentToken &&
              previousOrganisationId === currentOrganisationId
          ),

          skip(1)
        );

        return this.routerService
          .getApplicationRoutes()
          .pipe(
            map(routes =>
              loadApplicationRoutesSuccess({
                routes
              })
            ),

            catchError(error =>
              of(
                loadApplicationRoutesFailure({
                  error:
                    typeof error?.error?.message ===
                    'string'
                      ? error.error.message
                      : error?.message ||
                      'Failed to load application routes'
                })
              )
            ),

            takeUntil(
              merge(
                contextChanged$,

                this.actions$.pipe(
                  ofType(clearApplicationRoutes)
                )
              )
            )
          );
      })
    )
  );

  /**
   * Resolve browser navigation through NestJS.
   *
   * Browser URL
   *   -> authorized route resolution
   *   -> redirect OR stable page ID
   *   -> page definition request
   *
   * The resolved route parameters now
   * accompany the page definition request.
   */
  readonly loadPageDefinition$ = createEffect(() => {
    const contextChanges$ = combineLatest([
      this.store.select(selectAuthToken),
      this.store.select(selectSelectedOrganisationId)
    ]).pipe(
      distinctUntilChanged(
        (
          [previousToken, previousOrganisationId],
          [currentToken, currentOrganisationId]
        ) =>
          previousToken === currentToken &&
          previousOrganisationId === currentOrganisationId
      ),

      skip(1),

      map(
        (): PageResolutionTrigger => 'invalidate'
      )
    );

    const routerTriggers$ = this.actions$.pipe(
      ofType(
        ROUTER_NAVIGATION,
        ROUTER_NAVIGATED,
        loadApplicationRoutes,
        loadApplicationRoutesSuccess,
        loadApplicationRoutesFailure,
        clearApplicationRoutes
      ),

      map((action): PageResolutionTrigger => {
        if (
          action.type === ROUTER_NAVIGATED ||
          action.type === loadApplicationRoutesSuccess.type
        ) {
          return 'resolve';
        }

        return 'invalidate';
      })
    );

    return merge(
      routerTriggers$,
      contextChanges$
    ).pipe(
      withLatestFrom(
        this.store.select(selectApplicationRoutesState),
        this.store.select(isAuthenticated),
        this.store.select(selectSelectedOrganisationId)
      ),

      /**
       * A newer navigation or context event
       * cancels obsolete route resolution.
       */
      switchMap(([
                   trigger,
                   applicationRoutesState,
                   authenticated,
                   organisationId
                 ]) => {
        if (trigger === 'invalidate') {
          return of(clearPageDefinition());
        }

        if (!applicationRoutesState.loaded) {
          return of(clearPageDefinition());
        }

        /**
         * Router.url contains the current
         * application-relative browser URL,
         * including with hash-based routing.
         */
        const browserUrl = this.router.url;

        if (
          !browserUrl.startsWith('/') ||
          browserUrl.startsWith('//') ||
          browserUrl.includes('#')
        ) {
          return of(clearPageDefinition());
        }

        const resolution$ = this.routerService
          .resolveBrowserRoute(browserUrl)
          .pipe(
            switchMap(resolved => {
              /**
               * Ignore a result if navigation
               * has moved to another URL.
               */
              if (this.router.url !== browserUrl) {
                return EMPTY;
              }

              /**
               * Verify that the resolved route
               * belongs to the currently
               * authorized discovery map.
               */
              const discoveredRoute =
                applicationRoutesState.routes[
                  resolved.pattern
                  ];

              if (
                !discoveredRoute ||
                discoveredRoute.applicationId !==
                resolved.applicationId ||
                discoveredRoute.page !==
                resolved.page ||
                discoveredRoute.access !==
                resolved.access
              ) {
                return EMPTY;
              }

              /**
               * Check frontend eligibility.
               * NestJS remains authoritative.
               */
              if (
                !this.canRenderPage(
                  resolved,
                  authenticated,
                  organisationId
                )
              ) {
                return EMPTY;
              }

              /**
               * Redirect aliases to their
               * canonical browser URLs.
               */
              if (
                resolved.redirect !== undefined
              ) {
                const destination =
                  resolved.redirectTo;

                if (
                  typeof destination !== 'string' ||
                  !destination.startsWith('/') ||
                  destination.startsWith('//') ||
                  destination.includes('#') ||
                  destination === browserUrl
                ) {
                  return EMPTY;
                }

                void this.router.navigateByUrl(
                  destination,
                  {
                    replaceUrl: true
                  }
                );

                return EMPTY;
              }

              /**
               * Canonical route.
               *
               * Example:
               *
               * URL:
               *   /crm/customers/123
               *
               * Stable page:
               *   customerDetails
               *
               * Route parameters:
               *   { id: '123' }
               *
               * Preserve the existing
               * applicationId + route contract.
               */
              const routeParams =
                this.extractRouteParams(resolved);

              return of(
                loadPageDefinition({
                  applicationId:
                  resolved.applicationId,

                  route:
                  resolved.page,

                  routeParams
                })
              );
            }),

            /**
             * Unknown or failed resolutions
             * must not load a page.
             */
            catchError(() => EMPTY)
          );

        /**
         * Clear the previous page before
         * loading the newly resolved page.
         */
        return concat(
          of(clearPageDefinition()),
          resolution$
        );
      })
    );
  });

  /**
   * Copy parameters returned by NestJS
   * into a safe, independent dictionary.
   *
   * Static routes can have no parameters.
   *
   * This reads the `params` field from the
   * route-resolution response.
   *
   * Runtime validation prevents malformed
   * values entering the page-loading action.
   */
  private extractRouteParams(
    resolved: ResolvedApplicationBrowserRoute
  ): RouteParameters {
    const candidate: unknown =
      'params' in resolved
        ? resolved.params
        : undefined;

    const params = Object.create(null) as
      Record<string, string>;

    if (
      candidate === undefined ||
      candidate === null
    ) {
      return params;
    }

    if (
      typeof candidate !== 'object' ||
      Array.isArray(candidate)
    ) {
      throw new Error(
        'Invalid route parameters in route resolution'
      );
    }

    for (
      const [key, value] of Object.entries(candidate)
      ) {
      if (typeof value !== 'string') {
        throw new Error(
          `Invalid value for route parameter '${key}'`
        );
      }

      params[key] = value;
    }

    return params;
  }

  /**
   * Frontend rendering eligibility.
   *
   * Backend authorization remains
   * mandatory and authoritative.
   */
  private canRenderPage(
    route: Pick<
      ResolvedApplicationBrowserRoute,
      'applicationId' | 'access'
    >,
    authenticated: boolean,
    organisationId: unknown
  ): boolean {
    const isPlatform =
      route.applicationId === 'platform';

    switch (route.access) {
      case 'public':
        return isPlatform;

      case 'authenticated':
        return (
          isPlatform &&
          authenticated
        );

      case 'organisation':
        return (
          authenticated &&
          organisationId !== null &&
          organisationId !== undefined &&
          String(organisationId).length > 0
        );

      default:
        return false;
    }
  }

  /**
   * Navigate through Angular Router.
   */
  readonly go$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<Go>(
          RouterActionTypes.Go
        ),

        tap(({ payload }) => {
          const {
            path,
            queryParams,
            extras
          } = payload;

          void this.router.navigate(
            path,
            {
              queryParams,
              ...(extras || {})
            }
          );
        })
      ),

    {
      dispatch: false
    }
  );

  /**
   * Browser back navigation.
   */
  readonly back$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<Back>(
          RouterActionTypes.Back
        ),

        tap(() =>
          window.history.back()
        )
      ),

    {
      dispatch: false
    }
  );

  /**
   * Browser forward navigation.
   */
  readonly forward$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<Forward>(
          RouterActionTypes.Forward
        ),

        tap(() =>
          window.history.forward()
        )
      ),

    {
      dispatch: false
    }
  );
}
