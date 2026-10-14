export interface MonitoringConfig {
  enabled: boolean;
  dsn: string;
  environment: string;
  release: string;
  tracesSampleRate: number;
  ingestUrl: string;
  queryUrl: string;
}

export interface MonitoringEvent {
  id: string;
  visitId: string;
  timestamp: number;
  updatedAt: number;
  environment: string;
  release: string;
  route: string;
  kind: 'vital' | 'measure' | 'request' | 'log' | 'error';
  name: string;
  value?: number;
  unit?: 'ms' | 'score';
  rating?: 'good' | 'needs-improvement' | 'poor';
  level?: 'debug' | 'info' | 'warn' | 'error';
  message?: string;
  attributes?: Record<string, string | number | boolean>;
  uploadedAt?: number;
}

export interface MetricSummary {
  key: string;
  route: string;
  name: string;
  release: string;
  unit: 'ms' | 'score';
  count: number;
  p50: number;
  p75: number;
  p95: number;
  goodRate?: number;
}

export interface DailyReport {
  id: string;
  revision: string;
  date: string;
  environment: string;
  generatedAt: number;
  eventCount: number;
  logCount: number;
  errorCount: number;
  metrics: MetricSummary[];
  status: 'pending' | 'uploaded' | 'sentry-submitted';
  uploadedAt?: number;
  lastError?: string;
}

export interface MonitoringSnapshot {
  events: MonitoringEvent[];
  reports: DailyReport[];
}
