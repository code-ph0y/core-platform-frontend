import { createAction, props } from '@ngrx/store';
import {
  LoadDataParams,
  LoadDataBatchParams,
  SaveDataParams,
  DeleteDataParams,
  ContainerSpec
} from '../data-manager.types';

/** Preload everything referenced by a PageDefinition */
export const preloadDataFromPageDefinition = createAction(
  '[Data] Preload From PageDefinition',
  props<{ pageDefinition: ContainerSpec | ContainerSpec[] }>()
);

/** Load (single) */
export const loadData = createAction(
  '[Data] Load',
  props<LoadDataParams>()
);

export const loadDataSuccess = createAction(
  '[Data] Load Success',
  props<{ containerId: string; data: any }>()
);

export const loadDataFailure = createAction(
  '[Data] Load Failure',
  props<{ containerId: string; error: string }>()
);

/** Load batch (kick-off) */
export const loadDataBatch = createAction(
  '[Data] Load Batch',
  props<LoadDataBatchParams>()
);

/** Save */
export const saveData = createAction(
  '[Data] Save',
  props<SaveDataParams>()
);

export const saveDataSuccess = createAction(
  '[Data] Save Success',
  props<{ containerId: string; data: any }>()
);

export const saveDataFailure = createAction(
  '[Data] Save Failure',
  props<{ containerId: string; error: string }>()
);

/** Delete */
export const deleteData = createAction(
  '[Data] Delete',
  props<DeleteDataParams>()
);

export const deleteDataSuccess = createAction(
  '[Data] Delete Success',
  props<{ containerId: string; data?: any }>()
);

export const deleteDataFailure = createAction(
  '[Data] Delete Failure',
  props<{ containerId: string; error: string }>()
);
