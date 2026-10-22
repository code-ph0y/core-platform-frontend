import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import {
  preloadDataFromPageDefinition,
  loadData,
  loadDataBatch,
  loadDataFailure,
  loadDataSuccess,
  saveData,
  saveDataFailure,
  saveDataSuccess,
  deleteData,
  deleteDataFailure,
  deleteDataSuccess
} from '../actions/data-manager.actions';

import { switchMap, map, catchError, mergeMap } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';

import { DataService } from '../services/data.service';
import { ContainerSpec } from '../data-manager.types';

@Injectable()
export class DataManagerEffects {
  private actions$ = inject(Actions);
  private dataService = inject(DataService);

  constructor() {
    // DEBUG: prove the class was constructed
    console.debug('[DataManagerEffects] init');
  }

  /** Crawl the Page Definition and gather all attributes.load; then batch */
  preloadFromPageDefinition$ = createEffect(() =>
    this.actions$.pipe(
      ofType(preloadDataFromPageDefinition),
      map(({ pageDefinition }) => {
        const reqs = collectLoads(pageDefinition);
        console.debug('[Data] preloadFromPageDefinition -> requests', reqs);
        return reqs;
      }),
      map((requests) =>
        requests.length
          ? loadDataBatch({ requests })
          : ({ type: '[Data] Noop Preload (Empty)' } as any)
      )
    )
  );

  /** Handle loadData (single) */
  load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadData),
      mergeMap(({ containerId, queryId, bindVars }) =>
        this.dataService.getQuery(queryId, bindVars).pipe(
          map((data) => loadDataSuccess({ containerId, data })),
          catchError((err) =>
            of(loadDataFailure({ containerId, error: err?.message || 'Load failed' }))
          )
        )
      )
    )
  );

  /** Handle loadDataBatch (parallel) */
  loadBatch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadDataBatch),
      // tap(a => console.debug('[Data] loadBatch', a)),
      switchMap(({ requests }) => {
        if (!requests?.length) {
          return of({ type: '[Data] Noop Batch (Empty)' } as any);
        }

        // Build each call defensively
        const calls = requests.map(({ containerId, queryId, bindVars }) =>
          this.dataService.getQuery(queryId, bindVars).pipe(
            map((data) => loadDataSuccess({ containerId, data })),
            catchError((err) =>
              of(loadDataFailure({ containerId, error: err?.message || 'Load failed' }))
            )
          )
        );

        // If any call array element is undefined/null (shouldn't happen), filter it out
        const safeCalls = calls.filter(Boolean);
        if (!safeCalls.length) {
          return of({ type: '[Data] Noop Batch (No Safe Calls)' } as any);
        }

        // Combine all results. If you want "best effort" streaming, you can:
        //   return from(safeCalls).pipe(mergeMap(x => x));
        // For "all-or-end", forkJoin is fine:
        return forkJoin(safeCalls);
      }),
      // forkJoin emits an array of actions—flatten them to individual dispatches
      mergeMap((actions: any) => Array.isArray(actions) ? actions : [actions])
    )
  );

  /** Save */
  save$ = createEffect(() =>
    this.actions$.pipe(
      ofType(saveData),
      // tap(a => console.debug('[Data] save', a)),
      mergeMap(({ containerId, endpoint, data, method = 'POST' }) =>
        this.dataService.save(endpoint, data, method).pipe(
          map((resp) => saveDataSuccess({ containerId, data: resp })),
          catchError((err) =>
            of(saveDataFailure({ containerId, error: err?.message || 'Save failed' }))
          )
        )
      )
    )
  );

  /** Delete */
  delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deleteData),
      // tap(a => console.debug('[Data] delete', a)),
      mergeMap(({ containerId, endpoint }) =>
        this.dataService.remove(endpoint || '').pipe(
          map((resp) => deleteDataSuccess({ containerId, data: resp })),
          catchError((err) =>
            of(deleteDataFailure({ containerId, error: err?.message || 'Delete failed' }))
          )
        )
      )
    )
  );
}

/** Helper: recursively collect load specs from a ContainerSpec tree */
function collectLoads(
  root: ContainerSpec | ContainerSpec[]
): Array<{ containerId: string; queryId: string; bindVars?: Record<string, any> }> {
  const uniq: Record<string, { containerId: string; queryId: string; bindVars?: any }> = {};

  const visit = (n: ContainerSpec | null | undefined) => {
    if (!n || typeof n !== 'object') return;

    const attrs: any = n.attributes || {};
    const load = attrs.load;

    if (load?.queryId) {
      const containerId = load.containerId || attrs.containerId || deriveId(n);
      const key = `${containerId}::${load.queryId}::${JSON.stringify(load.bindVars || {})}`;
      uniq[key] = { containerId, queryId: load.queryId, bindVars: load.bindVars };
    }

    if (Array.isArray(n.children)) n.children.forEach(visit);
  };

  const deriveId = (n: ContainerSpec) => {
    const t = n.container || 'node';
    const a: any = n.attributes || {};
    const k = a.key || a.alias || a.containerId || 'value';
    return `${t}:${k}`;
  };

  if (Array.isArray(root)) root.forEach(visit); else visit(root);
  return Object.values(uniq);
}
