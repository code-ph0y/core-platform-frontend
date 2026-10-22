import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { ROUTER_NAVIGATED } from '@ngrx/router-store';
import { map, tap, withLatestFrom } from 'rxjs/operators';
import { Router } from '@angular/router';

import { routerParams, selectQueryParams } from '../selectors/router.selectors';
import { Back, Forward, Go, RouterActionTypes } from '../actions/router.actions';
import { loadPageDefinition } from '../../container-manager/actions/container-manager.actions';
import { AppState } from '../../index.facade';

@Injectable()
export class RouterEffects {
  private store = inject<Store<AppState>>(Store);
  private actions$ = inject(Actions);
  private router = inject(Router);

  /**
   * On navigation, derive page-definition coordinates from route params
   * and kick off loading the Page Definition from the backend.
   *
   * Route precedence:
   *   1. URL segment (serializer → version)
   *   2. Query param (?version=)
   *   3. 'default'
   */
  loadPageDefinition$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(ROUTER_NAVIGATED),
        withLatestFrom(
          this.store.select(routerParams),
          this.store.select(selectQueryParams)
        ),
        map(([_, params, query]) => {
          const resource = params?.resource ?? '';

          const pageType =
            (params as any)?.resourceType ??
            query?.type ??
            'default';

          const version =
            (params as any)?.version ??
            query?.version ??
            'default';

          return loadPageDefinition({
            resource,
            pageType,
            version
          });
        })
      );
    }
  );

  go$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<Go>(RouterActionTypes.Go),
        tap(({ payload }) => {
          const { path, queryParams, extras } = payload;
          this.router.navigate(path, { queryParams, ...(extras || {}) });
        })
      ),
    { dispatch: false }
  );

  back$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<Back>(RouterActionTypes.Back),
        tap(() => window.history.back())
      ),
    { dispatch: false }
  );

  forward$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType<Forward>(RouterActionTypes.Forward),
        tap(() => window.history.forward())
      ),
    { dispatch: false }
  );
}
