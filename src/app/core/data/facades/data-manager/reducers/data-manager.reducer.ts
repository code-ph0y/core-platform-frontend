
import {
  createReducer,
  on
} from '@ngrx/store';

import * as Actions from '../actions/data-manager.actions';

import type {
  DataSlice
} from '../data-manager.types';

/**
 * Data Manager state.
 *
 * Each container owns a data slice identified
 * by its containerId.
 */
export interface DataManagerState {
  entities: Record<string, DataSlice<any>>;
}

/**
 * Create a dictionary without inherited
 * JavaScript object properties.
 *
 * This safely supports container IDs such as:
 *
 * - constructor
 * - toString
 * - __proto__
 * - hasOwnProperty
 *
 * These identifiers must behave like ordinary
 * keys, not inherited object properties.
 */
function createEntities(): Record<
  string,
  DataSlice<any>
> {
  return Object.create(null) as Record<
    string,
    DataSlice<any>
  >;
}

/**
 * Initial Data Manager state.
 *
 * A null-prototype dictionary prevents
 * inherited property collisions.
 */
export const initialDataManagerState:
  DataManagerState = {
  entities: createEntities()
};

/**
 * Read an existing container data slice.
 *
 * Use an own-property check rather than
 * relying on truthiness or inherited keys.
 *
 * Return a fresh empty slice when the
 * container has not yet been registered.
 */
function getSlice(
  state: DataManagerState,
  containerId: string
): DataSlice<any> {
  if (
    Object.prototype.hasOwnProperty.call(
      state.entities,
      containerId
    )
  ) {
    return state.entities[containerId];
  }

  return {
    containerId,
    data: null,
    loading: false,
    error: null
  };
}

/**
 * Immutably update one container data slice.
 *
 * Every update:
 *
 * 1. Reads only an explicitly stored slice.
 * 2. Creates a new null-prototype dictionary.
 * 3. Copies existing container data.
 * 4. Updates only the requested container.
 *
 * Other container slices retain their values.
 *
 * No existing state object is mutated.
 */
function updateSlice(
  state: DataManagerState,
  containerId: string,
  changes: Partial<DataSlice<any>>
): DataManagerState {
  const previous = getSlice(
    state,
    containerId
  );

  const updated: DataSlice<any> = {
    ...previous,
    ...changes,
    containerId
  };

  /**
   * Copy into a null-prototype dictionary
   * so special property names remain safe.
   */
  const entities = Object.assign(
    createEntities(),
    state.entities
  );

  entities[containerId] = updated;

  return {
    ...state,
    entities
  };
}

/**
 * Data Manager reducer.
 *
 * Existing action contracts and state
 * transitions are preserved.
 */
export const dataManagerReducer = createReducer(
  initialDataManagerState,

  /**
   * Clear every page-scoped data slice.
   *
   * Removes:
   *
   * - Loaded data
   * - Loading flags
   * - Errors
   * - Pending operation state
   *
   * Effects handle request cancellation.
   */
  on(
    Actions.clearDataManager,
    (): DataManagerState => ({
      entities: createEntities()
    })
  ),

  /**
   * Start loading a single query.
   */
  on(
    Actions.loadData,
    (state, { containerId }) =>
      updateSlice(
        state,
        containerId,
        {
          loading: true,
          error: null
        }
      )
  ),

  /**
   * Store successfully loaded query data.
   */
  on(
    Actions.loadDataSuccess,
    (state, { containerId, data }) =>
      updateSlice(
        state,
        containerId,
        {
          data,
          loading: false,
          error: null
        }
      )
  ),

  /**
   * Store a query failure.
   *
   * Preserve existing data, if any.
   */
  on(
    Actions.loadDataFailure,
    (state, { containerId, error }) =>
      updateSlice(
        state,
        containerId,
        {
          loading: false,
          error
        }
      )
  ),

  /**
   * Start saving container data.
   */
  on(
    Actions.saveData,
    (state, { containerId }) =>
      updateSlice(
        state,
        containerId,
        {
          loading: true,
          error: null
        }
      )
  ),

  /**
   * Store a successful save response.
   */
  on(
    Actions.saveDataSuccess,
    (state, { containerId, data }) =>
      updateSlice(
        state,
        containerId,
        {
          data,
          loading: false,
          error: null
        }
      )
  ),

  /**
   * Store a save failure.
   */
  on(
    Actions.saveDataFailure,
    (state, { containerId, error }) =>
      updateSlice(
        state,
        containerId,
        {
          loading: false,
          error
        }
      )
  ),

  /**
   * Start deleting container data.
   */
  on(
    Actions.deleteData,
    (state, { containerId }) =>
      updateSlice(
        state,
        containerId,
        {
          loading: true,
          error: null
        }
      )
  ),

  /**
   * Finish a successful delete operation.
   *
   * Preserve existing reducer semantics:
   * this action resets loading and errors
   * but does not automatically remove data.
   *
   * Clearing deleted records, if required,
   * is a separate application-level policy.
   */
  on(
    Actions.deleteDataSuccess,
    (state, { containerId }) =>
      updateSlice(
        state,
        containerId,
        {
          loading: false,
          error: null
        }
      )
  ),

  /**
   * Store a delete failure.
   */
  on(
    Actions.deleteDataFailure,
    (state, { containerId, error }) =>
      updateSlice(
        state,
        containerId,
        {
          loading: false,
          error
        }
      )
  )
);
