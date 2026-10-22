import { createFeatureSelector, createSelector } from '@ngrx/store';
import { DataManagerState } from '../reducers/data-manager.reducer';

export const dataManagerFeatureKey = 'data';

export const selectDataManagerState =
  createFeatureSelector<DataManagerState>(dataManagerFeatureKey);

export const selectContainerDataById = createSelector(
  selectDataManagerState,
  (_: unknown, props: { containerId: string }) => props.containerId,
  (s, containerId) => s.entities[containerId] ?? { containerId, data: null, loading: false, error: null }
);
