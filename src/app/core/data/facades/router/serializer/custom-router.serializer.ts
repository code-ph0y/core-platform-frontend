
import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Params,
  RouterStateSnapshot
} from '@angular/router';
import { RouterStateSerializer } from '@ngrx/router-store';

export interface CustomRouterState {
  url: string;
  params: Params;
  queryParams: Params;
  applicationId: string | null;
  page: string | null;
}

@Injectable()
export class CustomRouterSerializer
  implements RouterStateSerializer<CustomRouterState> {

  serialize(routerState: RouterStateSnapshot): CustomRouterState {
    let route: ActivatedRouteSnapshot = routerState.root;

    const params: Params = {};

    // Collect parameters from the entire activated route tree.
    while (route) {
      Object.assign(params, route.params);

      if (!route.firstChild) {
        break;
      }

      route = route.firstChild;
    }

    return {
      url: routerState.url,
      params,
      queryParams: routerState.root.queryParams,
      applicationId: params['applicationId'] ?? null,
      page: params['page'] ?? null
    };
  }
}
