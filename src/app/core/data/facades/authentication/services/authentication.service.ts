import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../../../environments/environment';
import { Observable } from 'rxjs';
import { AuthResponse } from '../reducers/authentication.reducers';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private http = inject(HttpClient);

  /**
   * Logs in using the provided action endpoint, email, and password.
   */
  login(action: string, email: string, password: string): Observable<AuthResponse> {
    const base = environment.apiUrl?.replace(/\/+$/, '') ?? '';
    const path = action.startsWith('/') ? action : `/${action}`;

    return this.http.post<AuthResponse>(
      `${base}${path}`,
      { email, password },
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        }),
      }
    );
  }

  /**
   * Retrieves the access token from localStorage (if available).
   */
  getAccessToken(): string | null {
    try {
      const data: AuthResponse | null = JSON.parse(localStorage.getItem('auth_response') || 'null');
      return data?.access_token ?? null;
    } catch (error) {
      console.error('Error parsing auth_response from localStorage', error);
      return null;
    }
  }

  /**
   * Checks if access token exists (basic check).
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}
