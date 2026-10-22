import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from "../../../../../../environments/environment";
import { ContainerSpec } from '../../../../ui-engine/containers/container-spec';

@Injectable({ providedIn: 'root' })
export class ContainerManagerService {
  private readonly apiUrl = `${environment.apiUrl}/api/page-definitions`;

  constructor(private http: HttpClient) {}

  fetchPageDefinition(
    resource: string,
    query: Record<string, any> = {}
  ): Observable<ContainerSpec> {
    let params = new HttpParams();

    Object.keys(query).forEach(k => {
      const v = (query as any)[k];
      if (v == null) return;

      if (Array.isArray(v)) {
        v.forEach(item => params = params.append(k, String(item)));
      } else {
        params = params.set(k, typeof v === 'string' ? v : String(v));
      }
    });

    return this.http.get<ContainerSpec>(
      `${this.apiUrl}/${encodeURIComponent(resource)}`,
      { params }
    );
  }
}
