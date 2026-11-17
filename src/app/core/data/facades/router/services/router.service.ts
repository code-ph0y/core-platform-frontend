
import { Injectable, inject } from '@angular/core';

import {
  HttpClient,
  HttpParams
} from '@angular/common/http';

import { Observable } from 'rxjs';

import { environment } from '../../../../../../environments/environment';

import type {
  ApplicationRouteMap
} from '../actions/router.actions';

/**
 * Access policy enforced by NestJS.
 */
export type ApplicationRouteAccess =
  | 'public'
  | 'authenticated'
  | 'organisation';

/**
 * Supported canonical redirect behaviours.
 */
export type ApplicationRouteRedirect =
  | 'permanent'
  | 'temporary';

/**
 * Browser URL resolution returned by NestJS.
 *
 * Endpoint:
 *
 * GET /api/applications/resolve?url=...
 *
 * The backend resolves and authorizes the
 * requested URL before returning this data.
 *
 * A resolved page has a stable identity
 * independently of its browser path.
 */
export interface ResolvedApplicationBrowserRoute {
  /**
   * Owning application.
   *
   * Example:
   * crm
   */
  applicationId: string;

  /**
   * Stable compiled page ID.
   *
   * Example:
   * customerDetails
   */
  page: string;

  title: string;

  access: ApplicationRouteAccess;

  /**
   * Actual matched pathname.
   *
   * Example:
   * /crm/clients/123
   */
  pathname: string;

  /**
   * Browser pattern that matched.
   *
   * Example:
   * /crm/clients/{id}
   */
  pattern: string;

  /**
   * Canonical browser route pattern.
   *
   * Example:
   * /crm/customers/{id}
   */
  canonicalPath: string;

  /**
   * Named parameters extracted from the URL.
   *
   * Example:
   * { id: '123' }
   */
  params: Readonly<
    Record<string, string>
  >;

  /**
   * Decoded query parameters.
   *
   * Repeated keys are represented as arrays.
   *
   * Example:
   *
   * ?tag=one&tag=two
   *
   * {
   *   tag: ['one', 'two']
   * }
   */
  queryParams: Readonly<
    Record<
      string,
      string | readonly string[]
    >
  >;

  /**
   * Present when the matched URL is an alias.
   */
  redirect?: ApplicationRouteRedirect;

  /**
   * Concrete canonical destination.
   *
   * Includes expanded route parameters
   * and the original query string.
   *
   * Example:
   * /crm/customers/123?tab=orders
   */
  redirectTo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RouterService {
  private readonly http = inject(HttpClient);

  /**
   * NestJS uses the global /api prefix.
   *
   * Support environment.apiUrl configured
   * either with or without that prefix.
   *
   * Examples:
   *
   * http://localhost:3000
   *   -> http://localhost:3000/api
   *
   * http://localhost:3000/api
   *   -> http://localhost:3000/api
   *
   * /api
   *   -> /api
   *
   * ''
   *   -> /api
   */
  private readonly apiUrl = (() => {
    const baseUrl = environment.apiUrl.replace(
      /\/+$/,
      ''
    );

    return baseUrl.endsWith('/api')
      ? baseUrl
      : `${baseUrl}/api`;
  })();

  /**
   * Retrieve browser routes authorized for
   * the current authentication and
   * organisation context.
   *
   * The response includes:
   *
   * - Canonical route entries
   * - Alias route entries
   * - Stable page IDs
   * - Route access policies
   * - Alias redirect metadata
   *
   * Existing HTTP interceptors may attach
   * authentication and organisation headers.
   */
  getApplicationRoutes(): Observable<ApplicationRouteMap> {
    return this.http.get<ApplicationRouteMap>(
      `${this.apiUrl}/applications/routes`
    );
  }

  /**
   * Resolve a browser URL through NestJS.
   *
   * The backend performs route matching
   * and authorization before returning
   * route metadata.
   *
   * Examples:
   *
   * /login
   *
   * /crm/customers/123
   *
   * /crm/clients/123?tab=orders
   *
   * Do not include the browser origin
   * or Angular's hash-routing prefix.
   *
   * Angular Router.url already provides
   * the application-relative URL.
   */
  resolveBrowserRoute(
    browserUrl: string
  ): Observable<ResolvedApplicationBrowserRoute> {
    /**
     * Encode the entire browser URL as
     * one query parameter.
     *
     * This is important because the URL
     * being resolved may itself contain
     * query parameters.
     *
     * Example input:
     *
     * /crm/clients/123?tab=orders&view=compact
     *
     * HttpParams prevents the inner '&'
     * from becoming an additional query
     * parameter on the API request.
     */
    const params = new HttpParams().set(
      'url',
      browserUrl,
    );

    /**
     * Use the same environment-based API
     * host and HTTP configuration as
     * getApplicationRoutes().
     *
     * Do not duplicate JWT or organisation
     * header logic here.
     *
     * Any configured HTTP interceptors
     * apply to both endpoints consistently.
     */
    return this.http.get<ResolvedApplicationBrowserRoute>(
      `${this.apiUrl}/applications/resolve`,
      {
        params
      }
    );
  }
}
