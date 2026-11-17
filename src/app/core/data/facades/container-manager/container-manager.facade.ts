import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import {
  selectPageDefinition,
  selectPageDefinitionLoading,
  selectPageDefinitionError,
} from './selectors/container-manager.selectors';

import {
  clearPageDefinition,
  loadPageDefinition,
} from './actions/container-manager.actions';

export * from './reducers/container-manager.reducer';
export * from './actions/container-manager.actions';
export * from './selectors/container-manager.selectors';

@Injectable({ providedIn: 'root' })
export class ContainerManagerFacade {
  private store = inject(Store);

  pageDefinition$ = this.store.select(selectPageDefinition);
  loading$ = this.store.select(selectPageDefinitionLoading);
  error$ = this.store.select(selectPageDefinitionError);

  load(applicationId: string, route: string): void {
    this.store.dispatch(
      loadPageDefinition({
        applicationId,
        route,
      }),
    );
  }

  clear() {
    this.store.dispatch(clearPageDefinition());
  }
}
