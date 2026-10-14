import { type MonitoringConfig } from './types';

declare const MONITORING_CONFIG: Partial<MonitoringConfig>;

const injected = typeof MONITORING_CONFIG === 'undefined' ? {} : MONITORING_CONFIG;
const sampleRate = Number(injected.tracesSampleRate ?? 0.1);

export const monitoringConfig: MonitoringConfig = {
  enabled: injected.enabled !== false,
  dsn: injected.dsn || '',
  environment: injected.environment || 'dev',
  release: injected.release || 'local',
  tracesSampleRate: Number.isFinite(sampleRate) ? Math.max(0, Math.min(1, sampleRate)) : 0.1,
  ingestUrl: injected.ingestUrl || '',
  queryUrl: injected.queryUrl || '',
};
