
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
  error: null
};

export const containerManagerReducer = createReducer(
  initialContainerManagerState,

  /**
   * Clear the current page definition.
   */
  on(CMActions.clearPageDefinition, () => ({
    ...initialContainerManagerState
  })),

  /**
   * Begin loading a new page.
   *
   * Clear the previous definition so stale or unauthorised
   * content is not displayed during navigation.
   */
  on(CMActions.loadPageDefinition, state => ({
    ...state,
    current: null,
    loading: true,
    error: null
  })),

  /**
   * Store the compiled page definition returned by the API.
   */
  on(
    CMActions.loadPageDefinitionSuccess,
    (state, { pageDefinition }) => ({
      ...state,
      current: pageDefinition,
      loading: false,
      error: null
    })
  ),

  /**
   * Stop loading and expose the error to the UI.
   */
  on(
    CMActions.loadPageDefinitionFailure,
    (state, { error }) => ({
      ...state,
      current: null,
      loading: false,
      error
    })
  )
);
