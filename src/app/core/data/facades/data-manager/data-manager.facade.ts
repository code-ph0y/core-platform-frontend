import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import {
  preloadDataFromPageDefinition,
  loadData,
  loadDataBatch,
  saveData,
  deleteData
} from './actions/data-manager.actions';

import {
  LoadDataParams,
  LoadDataBatchParams,
  SaveDataParams,
  DeleteDataParams,
  ContainerSpec
} from './data-manager.types';

import { selectContainerDataById } from './selectors/data-manager.selectors';

export * from './reducers/data-manager.reducer';
export * from './actions/data-manager.actions';
export * from './selectors/data-manager.selectors';

export const dataManagerKey = 'data';

@Injectable({ providedIn: 'root' })
export class DataManagerFacade {
  private store = inject(Store);

  preloadFromPageDefinition(pageDefinition: ContainerSpec | ContainerSpec[]) {
    this.store.dispatch(preloadDataFromPageDefinition({ pageDefinition }));
  }

  loadData(params: LoadDataParams) {
    this.store.dispatch(loadData(params));
  }

  loadDataBatch(params: LoadDataBatchParams) {
    this.store.dispatch(loadDataBatch(params));
  }

  save(params: SaveDataParams) {
    this.store.dispatch(saveData(params));
  }

  remove(params: DeleteDataParams) {
    this.store.dispatch(deleteData(params));
  }

  getDataById(containerId: string) {
    return this.store.select(selectContainerDataById, { containerId });
  }
}
