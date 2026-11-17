
import type {
  ResourceQuery
} from './services/data.service';

/** Simple dictionary helper */
export type Dict<T = any> = Record<string, T>;

/** How a single data slice (by containerId) looks in state */
export interface DataSlice<T = any> {
  containerId: string;
  data: T | null;
  loading: boolean;
  error?: string | null;
}

/** Optional: overall data state shape keyed by containerId */
export interface DataStateMap {
  [containerId: string]: DataSlice<any> | undefined;
}

export type ConnectionType = 'single' | 'poll' | 'websocket';

/**
 * Parameters for a single data load.
 *
 * queryId identifies the request and its result.
 *
 * query is optional during migration:
 * - present: Core Platform Query V1
 * - absent: existing legacy query behaviour
 *
 * bindVars can contain resolved route parameters.
 */
export interface LoadDataParams {
  containerId: string;
  queryId: string;
  bindVars?: Dict;
  query?: ResourceQuery;
  connectionType?: ConnectionType;
  interval?: number;
}

/** Parameters for a batch of data loads */
export interface LoadDataBatchParams {
  requests: Array<
    Pick<
      LoadDataParams,
      'containerId' | 'queryId' | 'bindVars' | 'query'
    >
  >;
}

/** Parameters for saving data */
export interface SaveDataParams {
  containerId: string;
  endpoint: string;
  data: any;
  method?: 'POST' | 'PUT' | 'PATCH';
  queryId?: string;
}

/** Parameters for deleting data */
export interface DeleteDataParams {
  containerId: string;
  endpoint?: string;
  method?: 'DELETE';
  queryId?: string;
  bindVars?: Dict;
}

/** Page Definition */
export interface ContainerSpec {
  container: string;
  attributes?: any;
  children?: ContainerSpec[];
  [k: string]: any;
}
