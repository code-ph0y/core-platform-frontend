
import { Injectable } from '@angular/core';

import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';

import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { switchMap, take } from 'rxjs/operators';

import {
  selectAuthState
} from '../selectors/authentication.selectors';

import { environment } from '../../../../../../environments/environment';

@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  constructor(
    private readonly store: Store,
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    const apiUrl = environment.apiUrl.replace(/\/+$/, '');

    // Only attach authentication context to our API.
    const isApiRequest =
      req.url === apiUrl ||
      req.url.startsWith(`${apiUrl}/`);

    if (!isApiRequest) {
      return next.handle(req);
    }

    // Read authentication and organisation context
    // together from one consistent NgRx state snapshot.
    return this.store.select(selectAuthState).pipe(
      take(1),

      switchMap(authState => {
        const accessToken =
          authState?.auth_response?.access_token ?? null;

        const selectedOrganisationId =
          authState?.selectedOrganisationId ?? null;

        const headers: Record<string, string> = {};

        // Attach the verified session's access token.
        if (accessToken) {
          headers['Authorization'] =
            `Bearer ${accessToken}`;
        }

        // Organisation context is only sent when
        // both a token and organisation are available.
        if (accessToken && selectedOrganisationId) {
          headers['x-organisation-id'] =
            selectedOrganisationId;
        }

        // Public requests can proceed without credentials.
        if (Object.keys(headers).length === 0) {
          return next.handle(req);
        }

        const authenticatedRequest = req.clone({
          setHeaders: headers
        });

        return next.handle(authenticatedRequest);
      })
    );
  }
}
