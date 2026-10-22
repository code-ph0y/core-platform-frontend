import { RouterStateSerializer } from '@ngrx/router-store';
import { ActivatedRouteSnapshot, Params, RouterStateSnapshot } from '@angular/router';

export interface CustomRouterState {
  resource: string | null;
  resourceType: string | null;
  version: string | null;
  url: string;
  queryParams: Params;
  params: Params;
}

export class CustomRouterSerializer implements RouterStateSerializer<CustomRouterState> {
  serialize(routerState: RouterStateSnapshot): CustomRouterState {
    const firstChild = routerState.root.firstChild;

    if (!firstChild) {
      return {
        resource: null,
        resourceType: null,
        version: null,
        url: routerState.url,
        queryParams: routerState.root.queryParams ?? {},
        params: {},
      };
    }

    const queryParams = routerState.root.queryParams ?? {};
    const url = routerState.url;
    const urlSegment = firstChild.url ?? [];

    function extractParams(route: ActivatedRouteSnapshot, collected: Params = {}): Params {
      const merged = { ...collected, ...route.params };
      return route.firstChild ? extractParams(route.firstChild, merged) : merged;
    }

    const params = extractParams(routerState.root);

    return {
      resource: urlSegment.length > 0 ? urlSegment[0].path : null,
      resourceType: urlSegment.length > 1 ? urlSegment[1].path : null,
      version: urlSegment.length > 2 ? urlSegment[2].path : null,
      queryParams,
      url,
      params,
    };
  }
}
