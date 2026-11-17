
import { Action, createAction, props } from '@ngrx/store';
import { NavigationExtras } from '@angular/router';

/**
 * Existing navigation actions.
 */
export enum RouterActionTypes {
  Go = '[Router] Go',
  Back = '[Router] Back',
  Forward = '[Router] Forward',
  DoNothing = '[Router] Do Nothing'
}

export class Go implements Action {
  readonly type = RouterActionTypes.Go;

  constructor(
    public payload: {
      path: any[];
      queryParams?: Record<string, any>;
      extras?: NavigationExtras;
    }
  ) {}
}

export class Back implements Action {
  readonly type = RouterActionTypes.Back;
}

export class Forward implements Action {
  readonly type = RouterActionTypes.Forward;
}

export class DoNothing implements Action {
  readonly type = RouterActionTypes.DoNothing;
}

export const noLoadContainersDispatched =
  createAction(RouterActionTypes.DoNothing);

export type RouterActions =
  | Go
  | Back
  | Forward
  | DoNothing;

/**
 * Compiled application route metadata returned by NestJS.
 */
export type ApplicationRouteAccess =
  | 'public'
  | 'authenticated'
  | 'organisation';

export interface ApplicationRouteEntry {
  applicationId: string;
  page: string;
  title: string;
  access: ApplicationRouteAccess;
}

export type ApplicationRouteMap =
  Record<string, ApplicationRouteEntry>;

/**
 * Request the route map for the current
 * authentication and organisation context.
 */
export const loadApplicationRoutes = createAction(
  '[Router] Load Application Routes'
);

/**
 * Route discovery succeeded.
 */
export const loadApplicationRoutesSuccess = createAction(
  '[Router API] Load Application Routes Success',
  props<{ routes: ApplicationRouteMap }>()
);

/**
 * Route discovery failed.
 */
export const loadApplicationRoutesFailure = createAction(
  '[Router API] Load Application Routes Failure',
  props<{ error: string }>()
);

/**
 * Remove routes associated with a previous
 * authentication or organisation context.
 */
export const clearApplicationRoutes = createAction(
  '[Router] Clear Application Routes'
);
