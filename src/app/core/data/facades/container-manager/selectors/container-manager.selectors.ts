import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ContainerManagerState } from '../reducers/container-manager.reducer';

export const containerManagerFeatureKey = 'containerManager';

export const selectContainerManagerState =
  createFeatureSelector<ContainerManagerState | undefined>(containerManagerFeatureKey);

export const selectPageDefinition = createSelector(
  selectContainerManagerState,
  s => s?.current ?? null
);

export const selectPageDefinitionLoading = createSelector(
  selectContainerManagerState,
  s => s?.loading ?? false
);

export const selectPageDefinitionError = createSelector(
  selectContainerManagerState,
  s => s?.error ?? null
);
