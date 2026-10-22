import { Action, createAction } from '@ngrx/store';
import { NavigationExtras } from '@angular/router';

/** Enum of router action types. */
export enum RouterActionTypes {
  Go = '[Router] Go',
  Back = '[Router] Back',
  Forward = '[Router] Forward',
  DoNothing = '[Router] Do Nothing'
}

/**
 * Action to navigate to a specific path.
 * Example usage:
 *   this.store.dispatch(new Go({
 *     path: ['/dashboard'],
 *     queryParams: { foo: 'bar' },
 *     extras: { replaceUrl: true }
 *   }));
 */
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

/** Action to navigate back in history. */
export class Back implements Action {
  readonly type = RouterActionTypes.Back;
}

/** Action to navigate forward in history. */
export class Forward implements Action {
  readonly type = RouterActionTypes.Forward;
}

/** A no-op action for placeholders or ignoring certain events. */
export class DoNothing implements Action {
  readonly type = RouterActionTypes.DoNothing;
}

/**
 * For times we want to indicate no container load is needed,
 * or simply to do nothing in response to a router event.
 */
export const noLoadContainersDispatched = createAction(RouterActionTypes.DoNothing);

/** Union of all router actions. */
export type RouterActions = Go | Back | Forward | DoNothing;
