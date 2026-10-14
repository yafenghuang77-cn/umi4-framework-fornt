import { type MetricSummary, type MonitoringEvent } from './types';

export function shanghaiDate(timestamp = Date.now()): string {
  return new Date(timestamp + 8 * 3600_000).toISOString().slice(0, 10);
}

/** nearest-rank 分位数；未采集到的指标不补零。 */
export function percentile(values: number[], fraction: number): number {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  return sorted.length ? sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)] : 0;
}

export function summarize(events: MonitoringEvent[]): MetricSummary[] {
  const groups = new Map<string, MonitoringEvent[]>();
  for (const event of events) {
    if (
      event.kind === 'measure' &&
      event.attributes?.status &&
      event.attributes.status !== 'success'
    ) {
      continue;
    }
    if (typeof event.value !== 'number' || !Number.isFinite(event.value)) {
      continue;
    }
    const key = JSON.stringify([event.route, event.name, event.release, event.unit]);
    const items = groups.get(key) || [];
    items.push(event);
    groups.set(key, items);
  }
  return [...groups]
    .map(([key, items]) => {
      const first = items[0];
      const values = items.map((item) => item.value!);
      const rated = items.filter((item) => item.rating);
      return {
        key,
        route: first.route,
        name: first.name,
        release: first.release,
        unit: first.unit || 'ms',
        count: items.length,
        p50: percentile(values, 0.5),
        p75: percentile(values, 0.75),
        p95: percentile(values, 0.95),
        goodRate: rated.length
          ? rated.filter((item) => item.rating === 'good').length / rated.length
          : undefined,
      };
    })
    .sort((a, b) => b.count - a.count);
}

export async function revisionOf(events: MonitoringEvent[]): Promise<string> {
  const content = events.map(({ id, updatedAt, value }) => [id, updatedAt, value]).sort();
  const serialized = JSON.stringify(content);
  if (!crypto.subtle) {
    let checksum = 2166136261;
    for (let index = 0; index < serialized.length; index++) {
      checksum = Math.imul(checksum ^ serialized.charCodeAt(index), 16777619);
    }
    return `${serialized.length}-${(checksum >>> 0).toString(16)}`;
  }
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(serialized));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
