
import { Injectable, inject } from '@angular/core';

import {
  HttpClient,
  HttpContext,
  HttpContextToken,
  HttpHeaders
} from '@angular/common/http';

import { Observable } from 'rxjs';

import {
  environment
} from '../../../../../../environments/environment';

import type {
  AuthResponse
} from '../reducers/authentication.reducers';

export interface AuthenticatedOrganisation {
  id: string;
  name: string;
  label: string;
}

export interface CurrentUserResponse {
  id: string;
  email: string;
  organisations: AuthenticatedOrganisation[];
}

/**
 * Login failures should not trigger
 * the global HTTP 401 logout handler.
 */
export const IS_LOGIN_REQUEST =
  new HttpContextToken<boolean>(() => false);

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private readonly http = inject(HttpClient);

  /**
   * Authenticate.
   *
   * withCredentials allows the browser
   * to receive the HttpOnly refresh cookie.
   */
  login(
    action: string,
    email: string,
    password: string
  ): Observable<AuthResponse> {
    const base =
      environment.apiUrl?.replace(/\/+$/, '') ?? '';

    const path = action.startsWith('/')
      ? action
      : `/${action}`;

    return this.http.post<AuthResponse>(
      `${base}${path}`,
      { email, password },
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        }),
        context: new HttpContext().set(
          IS_LOGIN_REQUEST,
          true
        ),
        withCredentials: true
      }
    );
  }

  /**
   * Retrieve freshly verified
   * organisation memberships.
   */
  getCurrentUser(): Observable<CurrentUserResponse> {
    const base =
      environment.apiUrl?.replace(/\/+$/, '') ?? '';

    return this.http.get<CurrentUserResponse>(
      `${base}/api/auth/me`
    );
  }

  /**
   * Revoke the backend refresh session.
   *
   * The interceptor must still attach
   * the Bearer token, and the browser
   * must send the HttpOnly refresh cookie.
   */
  logout(): Observable<{ message: string }> {
    const base =
      environment.apiUrl?.replace(/\/+$/, '') ?? '';

    return this.http.post<{ message: string }>(
      `${base}/api/auth/logout`,
      {},
      {
        withCredentials: true
      }
    );
  }

  /**
   * Read the locally persisted
   * access token.
   */
  getAccessToken(): string | null {
    try {
      const data: AuthResponse | null = JSON.parse(
        localStorage.getItem('auth_response') || 'null'
      );

      return data?.access_token ?? null;
    } catch (error) {
      console.error(
        'Error parsing auth_response from localStorage',
        error
      );

      return null;
    }
  }

  /**
   * A stored token does not independently
   * establish that the session is valid.
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}
