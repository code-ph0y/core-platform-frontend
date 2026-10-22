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

/** Params for a single load request */
export interface LoadDataParams {
  containerId: string;
  queryId: string;
  bindVars?: Dict;
  connectionType?: ConnectionType; // default 'single'
  interval?: number;               // only for 'poll'
}

/** Params for a batch load */
export interface LoadDataBatchParams {
  requests: Array<Pick<LoadDataParams, 'containerId' | 'queryId' | 'bindVars'>>;
}

/** Params for saving data */
export interface SaveDataParams {
  containerId: string;
  endpoint: string;
  data: any;
  method?: 'POST' | 'PUT' | 'PATCH';
  queryId?: string;
}

/** Params for deleting data */
export interface DeleteDataParams {
  containerId: string;
  endpoint?: string;
  method?: 'DELETE';
  queryId?: string;
  bindVars?: Dict;
}

/** Page Definition (you can import ContainerSpec and alias it) */
export interface ContainerSpec {
  container: string;
  attributes?: any;
  children?: ContainerSpec[];
  [k: string]: any;
}
