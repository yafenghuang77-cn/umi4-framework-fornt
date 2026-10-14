import { monitoringConfig } from './config';
import { monitoringId } from './id';
import { normalizeRoute, scrub } from './privacy';
import { saveEvent } from './storage';
import { type MonitoringEvent } from './types';

let visitId = monitoringId();
let route = typeof location === 'undefined' ? '/' : normalizeRoute(location.href);
const writes = new Set<Promise<void>>();

export function currentVisit() {
  return { visitId, route };
}
export function changeVisit(path: string) {
  const nextRoute = normalizeRoute(path);
  if (route !== nextRoute) {
    visitId = monitoringId();
  }
  route = nextRoute;
}

type EventInput = Pick<MonitoringEvent, 'kind' | 'name'> & Partial<MonitoringEvent>;

export function recordEvent(input: EventInput) {
  if (
    !monitoringConfig.enabled ||
    (input.value !== undefined && (!Number.isFinite(input.value) || input.value < 0))
  ) {
    return;
  }
  const now = Date.now();
  const event: MonitoringEvent = scrub({
    ...currentVisit(),
    id: monitoringId(),
    timestamp: now,
    environment: monitoringConfig.environment,
    release: monitoringConfig.release,
    ...input,
    updatedAt: now,
  });
  event.route = normalizeRoute(event.route);
  const write = saveEvent(event);
  writes.add(write);
  void write.finally(() => writes.delete(write));
}

export async function settleWrites() {
  await Promise.all([...writes]);
}
