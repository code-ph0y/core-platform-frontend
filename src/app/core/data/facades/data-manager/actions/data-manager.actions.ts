import { createAction, props } from '@ngrx/store';

import {
  LoadDataParams,
  LoadDataBatchParams,
  SaveDataParams,
  DeleteDataParams,
  ContainerSpec
} from '../data-manager.types';

import type {
  RouteParameters
} from '../route-bindings';

/**
 * Preload data referenced by a page definition.
 *
 * routeParams contains parameters resolved by
 * the backend application route resolver.
 *
 * Example:
 *
 * URL:
 *   /crm/customers/123
 *
 * routeParams:
 *   { id: '123' }
 *
 * Page bindVars:
 *   { id: '$route.id' }
 *
 * Existing callers can omit routeParams
 * until the routing pipeline is connected.
 */
export const preloadDataFromPageDefinition = createAction(
  '[Data] Preload From PageDefinition',
  props<{
    pageDefinition: ContainerSpec | ContainerSpec[];
    routeParams?: RouteParameters;
  }>()
);

/** Load a single query. */
export const loadData = createAction(
  '[Data] Load',
  props<LoadDataParams>()
);

export const loadDataSuccess = createAction(
  '[Data] Load Success',
  props<{
    containerId: string;
    data: any;
  }>()
);

export const loadDataFailure = createAction(
  '[Data] Load Failure',
  props<{
    containerId: string;
    error: string;
  }>()
);

/** Load a batch of queries. */
export const loadDataBatch = createAction(
  '[Data] Load Batch',
  props<LoadDataBatchParams>()
);

/** Save data. */
export const saveData = createAction(
  '[Data] Save',
  props<SaveDataParams>()
);

export const saveDataSuccess = createAction(
  '[Data] Save Success',
  props<{
    containerId: string;
    data: any;
  }>()
);

export const saveDataFailure = createAction(
  '[Data] Save Failure',
  props<{
    containerId: string;
    error: string;
  }>()
);

/** Delete data. */
export const deleteData = createAction(
  '[Data] Delete',
  props<DeleteDataParams>()
);

export const deleteDataSuccess = createAction(
  '[Data] Delete Success',
  props<{
    containerId: string;
    data?: any;
  }>()
);

export const deleteDataFailure = createAction(
  '[Data] Delete Failure',
  props<{
    containerId: string;
    error: string;
  }>()
);

/**
 * Remove all Data Manager state.
 *
 * Used when navigation, page, authentication
 * or organisation context is invalidated.
 */
export const clearDataManager = createAction(
  '[Data Manager] Clear All Data'
);
