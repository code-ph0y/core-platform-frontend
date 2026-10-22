import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Dict } from '../data-manager.types';
import { environment } from '../../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly apiUrl = `${environment.apiUrl}/api/queries`;

  constructor(private http: HttpClient) {}

  getQuery(queryId: string, bindVars?: Dict): Observable<any> {
    const params = new HttpParams({ fromObject: toStringParams(bindVars) });
    return this.http.get<any>(`${this.apiUrl}/${encodeURIComponent(queryId)}`, { params });
  }

  save(endpoint: string, payload: any, method: 'POST' | 'PUT' | 'PATCH'): Observable<any> {
    const url = normalizeUrl(endpoint);

    switch (method) {
      case 'PUT':
        return this.http.put<any>(url, payload);
      case 'PATCH':
        return this.http.patch<any>(url, payload);
      default:
        return this.http.post<any>(url, payload);
    }
  }

  remove(endpoint: string): Observable<any> {
    return this.http.delete<any>(normalizeUrl(endpoint));
  }
}

function toStringParams(vars?: Dict): Dict<string> {
  if (!vars) return {};
  const out: Dict<string> = {};
  for (const k of Object.keys(vars)) {
    const v = vars[k];
    out[k] = typeof v === 'string' ? v : JSON.stringify(v);
  }
  return out;
}

function normalizeUrl(endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  const base = environment.apiUrl?.replace(/\/+$/, '') ?? '';
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}
