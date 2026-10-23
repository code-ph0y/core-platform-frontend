import { createReducer, on } from '@ngrx/store';
import * as CMActions from '../actions/container-manager.actions';
import { ContainerSpec } from '../../../../plugins/containers/container-spec';

export interface ContainerManagerState {
  current: ContainerSpec | null;
  loading: boolean;
  error: string | null;
}

export const initialContainerManagerState: ContainerManagerState = {
  current: null,
  loading: false,
  error: null,
};

export const containerManagerReducer = createReducer(
  initialContainerManagerState,

  on(CMActions.clearPageDefinition, () => initialContainerManagerState),

  on(CMActions.loadPageDefinition, (s) => ({
    ...s, loading: true, error: null
  })),

  on(CMActions.loadPageDefinitionSuccess, (s, { pageDefinition }) => ({
    ...s, loading: false, error: null, current: pageDefinition
  })),

  on(CMActions.loadPageDefinitionFailure, (s, { error }) => ({
    ...s, loading: false, error
  })),
);
