import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Dict } from '../data-manager.types';
import { environment } from '../../../../../../environments/environment';

export type QueryValue = string | number | boolean | null;

export type QueryFilter =
  | {
  field: string;
  operator:
    | 'eq'
    | 'neq'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'in'
    | 'contains';
  value: QueryValue | QueryValue[];
}
  | { and: QueryFilter[] }
  | { or: QueryFilter[] };

export interface ResourceQuery {
  name?: string;
  resource: string;
  fields?: string[];
  filter?: QueryFilter;
  sort?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  paging?: {
    limit: number;
    offset?: number;
  };
}

export interface QueryV1Request {
  version: 1;
  queries: Record<string, ResourceQuery>;
}

export interface QueryV1Response {
  results: Record<
    string,
    {
      data: Record<string, unknown>[];
      paging: {
        limit: number;
        offset: number;
        count: number;
      };
    }
  >;
}

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly apiUrl =
    `${environment.apiUrl}/api/queries`;

  private readonly queryV1Url =
    `${environment.apiUrl}/api/query`;

  constructor(private http: HttpClient) {}

  /**
   * Legacy query endpoint.
   *
   * Preserve existing callers until the Data Manager
   * has been migrated to Query V1.
   */
  getQuery(
    queryId: string,
    bindVars?: Dict
  ): Observable<any> {
    const params = new HttpParams({
      fromObject: toStringParams(bindVars)
    });

    return this.http.get<any>(
      `${this.apiUrl}/${encodeURIComponent(queryId)}`,
      { params }
    );
  }

  /**
   * Core Platform Query Engine V1.
   *
   * The backend validates resources and fields,
   * authorizes access, and enforces organisation scope.
   *
   * Authentication and organisation headers continue
   * through the application's existing HTTP interceptors.
   */
  executeQueryV1(
    request: QueryV1Request
  ): Observable<QueryV1Response> {
    return this.http.post<QueryV1Response>(
      this.queryV1Url,
      request
    );
  }

  save(
    endpoint: string,
    payload: any,
    method: 'POST' | 'PUT' | 'PATCH'
  ): Observable<any> {
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
    return this.http.delete<any>(
      normalizeUrl(endpoint)
    );
  }
}

function toStringParams(vars?: Dict): Dict<string> {
  if (!vars) {
    return {};
  }

  const out: Dict<string> = {};

  for (const k of Object.keys(vars)) {
    const v = vars[k];

    out[k] =
      typeof v === 'string'
        ? v
        : JSON.stringify(v);
  }

  return out;
}

function normalizeUrl(endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  const base =
    environment.apiUrl?.replace(/\/+$/, '') ?? '';

  const path =
    endpoint.startsWith('/')
      ? endpoint
      : `/${endpoint}`;

  return `${base}${path}`;
}
