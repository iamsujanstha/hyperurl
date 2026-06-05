import { RequestConfig, CurlResult } from '@/server/modules/curl-engine';
import { ProgressUpdate } from '@/server/modules/runner';

export const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'GRAPHQL'] as const;

export type HttpMethod = typeof METHODS[number];

export interface AssertionRule {
  id: string;
  type: 'status' | 'latency' | 'body_contains' | 'json_path' | 'header_matches' | 'graphql_no_errors';
  value: string;
  extra?: string;
}

export interface AssertionResult {
  ruleId: string;
  type: string;
  passed: boolean;
  actual: string;
  expected: string;
  error?: string;
}

export interface SavedRequest extends RequestConfig {
  id: string;
  name: string;
  graphqlQuery?: string;
  graphqlVariables?: string;
  headersList: { id: string, key: string, value: string }[];
  assertions?: AssertionRule[];
}

export interface Collection {
  id: string;
  name: string;
  requests: SavedRequest[];
}

export interface Tab {
  id: string;
  name: string;
  config: RequestConfig;
  graphqlQuery?: string;
  graphqlVariables?: string;
  headersList: { id: string, key: string, value: string }[];
  result: CurlResult | null;
  results: CurlResult[];
  batchResults: CurlResult[];
  batchMode: boolean;
  batchIterations?: number;
  batchConcurrency?: number;
  showCurl: boolean;
  loading: boolean;
  progress: null | ProgressUpdate;
  assertions?: AssertionRule[];
}

export interface Telemetry {
  redisStatus: string;
  redisLatency: number;
  activeWorkers: number;
  maxWorkers: number;
  latency: string;
  redisType: string;
  clientCount: number;
  spawnedWorkers: {
    id: string;
    name: string;
    status: 'IDLE' | 'ACTIVE';
    task: string;
    activeTime: number;
  }[];
}

export interface DialogState {
  isOpen: boolean;
  type: 'ALERT' | 'CONFIRM' | 'PROMPT_TEXT' | 'SAVE_REQUEST';
  title: string;
  message: string;
  defaultValue?: string;
  inputVal?: string;
  selectedColId?: string;
  onConfirm: (val1?: string, val2?: string) => void;
}
