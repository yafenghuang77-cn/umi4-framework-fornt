import { monitoringConfig } from './config';
import { monitoringSnapshotSchema } from './schema';
import { type MonitoringSnapshot } from './types';

/** 独立 transport：不经过业务拦截器，避免监控失败递归上报。仅同源携带 Cookie。 */
export async function monitoringFetch(url: string, init?: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, {
      ...init,
      credentials: 'same-origin',
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`监控接口 HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function postMonitoring(body: unknown) {
  const result = await monitoringFetch(monitoringConfig.ingestUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (
    !result ||
    typeof result !== 'object' ||
    !('accepted' in result) ||
    result.accepted !== true
  ) {
    throw new Error('监控接口未返回 accepted: true');
  }
}

export async function queryMonitoring(from: string, to: string): Promise<MonitoringSnapshot> {
  if (!monitoringConfig.queryUrl) {
    throw new Error('尚未配置全站统计查询接口');
  }
  const url = new URL(monitoringConfig.queryUrl, location.origin);
  url.searchParams.set('from', from);
  url.searchParams.set('to', to);
  url.searchParams.set('environment', monitoringConfig.environment);
  const result = await monitoringFetch(url.href);
  if (
    !result ||
    typeof result !== 'object' ||
    !('events' in result) ||
    !('reports' in result) ||
    !Array.isArray(result.events) ||
    !Array.isArray(result.reports)
  ) {
    throw new Error('查询接口返回格式不正确，应包含 events 和 reports 数组');
  }
  const parsed = monitoringSnapshotSchema.safeParse(result);
  if (!parsed.success) {
    throw new Error('统计数据字段不符合协议或超过 10,000 条，请缩小查询范围');
  }
  return parsed.data;
}
