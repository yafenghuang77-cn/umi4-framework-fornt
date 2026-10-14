import { currentVisit, recordEvent } from './collector';
import { normalizeRoute } from './privacy';

interface TimedConfig {
  url?: string;
  method?: string;
  __monitoring?: { started: number; route: string; visitId: string; done?: boolean };
}

export function startRequest<T extends TimedConfig>(config: T): T {
  return { ...config, __monitoring: { started: performance.now(), ...currentVisit() } };
}

export function finishRequest(config: TimedConfig | undefined, status: number, failed: boolean) {
  const timing = config?.__monitoring;
  if (!timing || timing.done) {
    return;
  }
  timing.done = true;
  recordEvent({
    visitId: timing.visitId,
    route: timing.route,
    kind: 'request',
    name: `${(config.method || 'GET').toUpperCase()} ${normalizeRoute(config.url || '/')}`,
    value: performance.now() - timing.started,
    unit: 'ms',
    attributes: { status, failed },
  });
}
