import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of } from 'rxjs';
import { preloadDataFromPageDefinition } from '../../data-manager/actions/data-manager.actions';
import { Store } from '@ngrx/store';
import { selectQueryParams } from '../../router/selectors/router.selectors';
import { withLatestFrom } from 'rxjs/operators';
import { AppState } from '../../index.facade';
import { loadPageDefinition, loadPageDefinitionFailure, loadPageDefinitionSuccess } from '../container-manager.facade';
import { ContainerManagerService } from '../services/container-manager.service';

@Injectable()
export class ContainerManagerEffects {
  private store = inject<Store<AppState>>(Store);
  private actions$ = inject(Actions);
  private containerManagerService = inject(ContainerManagerService);

  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadPageDefinition),
      withLatestFrom(this.store.select(selectQueryParams)),
      mergeMap(([{ resource, pageType = 'default', version = 'default' }, currentQuery]) => {
        // Effect’s responsibility: decide what the query should be
        const merged = {
          ...(currentQuery ?? {}),
          type: pageType,
          version: version,
        };

        // Service’s responsibility: build headers, URL, params, and call HTTP
        return this.containerManagerService
          .fetchPageDefinition(resource, merged)
          .pipe(
            map(pageDefinition => loadPageDefinitionSuccess({ pageDefinition })),
            catchError(err =>
              of(
                loadPageDefinitionFailure({
                  error:
                    err?.error?.error?.message ||
                    err?.message ||
                    'Failed to load page definition',
                })
              )
            )
          );
      })
    )
  );

  /** After a page definition is in state, trigger preloading all loads it references */
  preloadOnSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadPageDefinitionSuccess),
      map(({ pageDefinition }) => preloadDataFromPageDefinition({ pageDefinition }))
    )
  );
}
