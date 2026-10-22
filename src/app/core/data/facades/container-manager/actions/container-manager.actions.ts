import { createAction, props } from '@ngrx/store';
import { ContainerSpec } from '../../../../ui-engine/containers/container-spec';

export const loadPageDefinition = createAction(
  '[ContainerMgr] Load Page Definition',
  props<{ resource: string; pageType?: string; version?: string }>() // ← rename here
);

export const loadPageDefinitionSuccess = createAction(
  '[ContainerMgr] Load Page Definition Success',
  props<{ pageDefinition: ContainerSpec }>()
);

export const loadPageDefinitionFailure = createAction(
  '[ContainerMgr] Load Page Definition Failure',
  props<{ error: any }>()
);


export const clearPageDefinition = createAction(
  '[ContainerMgr] Clear Page Definition'
);
