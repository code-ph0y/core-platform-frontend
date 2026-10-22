import { createReducer, on } from '@ngrx/store';
import * as Actions from '../actions/data-manager.actions';
import { DataSlice } from '../data-manager.types';

export interface DataManagerState {
  entities: Record<string, DataSlice<any>>;
}

export const initialDataManagerState: DataManagerState = {
  entities: {}
};

function ensureSlice(state: DataManagerState, containerId: string): DataManagerState {
  if (state.entities[containerId]) return state;
  return {
    ...state,
    entities: {
      ...state.entities,
      [containerId]: { containerId, data: null, loading: false, error: null }
    }
  };
}

export const dataManagerReducer = createReducer(
  initialDataManagerState,

  on(Actions.loadData, (s, { containerId }) => {
    s = ensureSlice(s, containerId);
    return {
      ...s,
      entities: {
        ...s.entities,
        [containerId]: { ...s.entities[containerId], loading: true, error: null }
      }
    };
  }),

  on(Actions.loadDataSuccess, (s, { containerId, data }) => {
    s = ensureSlice(s, containerId);
    return {
      ...s,
      entities: {
        ...s.entities,
        [containerId]: { ...s.entities[containerId], loading: false, error: null, data }
      }
    };
  }),

  on(Actions.loadDataFailure, (s, { containerId, error }) => {
    s = ensureSlice(s, containerId);
    return {
      ...s,
      entities: {
        ...s.entities,
        [containerId]: { ...s.entities[containerId], loading: false, error }
      }
    };
  }),

  on(Actions.saveData, (s, { containerId }) => {
    s = ensureSlice(s, containerId);
    return {
      ...s,
      entities: {
        ...s.entities,
        [containerId]: { ...s.entities[containerId], loading: true, error: null }
      }
    };
  }),

  on(Actions.saveDataSuccess, (s, { containerId, data }) => {
    s = ensureSlice(s, containerId);
    return {
      ...s,
      entities: {
        ...s.entities,
        [containerId]: { ...s.entities[containerId], loading: false, error: null, data }
      }
    };
  }),

  on(Actions.saveDataFailure, (s, { containerId, error }) => {
    s = ensureSlice(s, containerId);
    return {
      ...s,
      entities: {
        ...s.entities,
        [containerId]: { ...s.entities[containerId], loading: false, error }
      }
    };
  }),

  on(Actions.deleteData, (s, { containerId }) => {
    s = ensureSlice(s, containerId);
    return {
      ...s,
      entities: {
        ...s.entities,
        [containerId]: { ...s.entities[containerId], loading: true, error: null }
      }
    };
  }),

  on(Actions.deleteDataSuccess, (s, { containerId }) => {
    s = ensureSlice(s, containerId);
    return {
      ...s,
      entities: {
        ...s.entities,
        [containerId]: { ...s.entities[containerId], loading: false, error: null }
      }
    };
  }),

  on(Actions.deleteDataFailure, (s, { containerId, error }) => {
    s = ensureSlice(s, containerId);
    return {
      ...s,
      entities: {
        ...s.entities,
        [containerId]: { ...s.entities[containerId], loading: false, error }
      }
    };
  })
);
