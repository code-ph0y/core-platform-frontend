
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../../../environments/environment';
import { ContainerSpec } from '../../../../plugins/containers/container-spec';

@Injectable({ providedIn: 'root' })
export class ContainerManagerService {
  private readonly apiUrl =
    `${environment.apiUrl.replace(/\/+$/, '')}/api`;

  constructor(private http: HttpClient) {}

  fetchPageDefinition(
    applicationId: string,
    route: string
  ): Observable<ContainerSpec> {
    const normalizedRoute = route.replace(/^\/+/, '');

    /**
     * Application IDs use lowercase identifiers.
     * Page IDs follow the backend application loader
     * and controller contract, including camelCase.
     */
    if (
      !/^[a-z][a-z0-9_-]*$/.test(applicationId) ||
      !/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(normalizedRoute)
    ) {
      throw new Error('Invalid application page coordinates');
    }

    const url =
      `${this.apiUrl}/applications/${encodeURIComponent(applicationId)}` +
      `/pages/${encodeURIComponent(normalizedRoute)}`;

    return this.http.get<ContainerSpec>(url);
  }
}
