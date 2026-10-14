import { type MetricType, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

import { changeVisit, currentVisit, recordEvent } from './collector';
import { monitoringConfig } from './config';
import { flushMonitoring } from './daily';
import { normalizeRoute } from './privacy';
import { captureError, initSentry, logMessage, performanceSpan } from './sentry';

export { shanghaiDate, summarize } from './aggregate';
export { recordEvent } from './collector';
export { monitoringConfig } from './config';
export { flushMonitoring } from './daily';
export { captureError, logMessage as monitoringLog } from './sentry';
export { getStorageError, readSnapshot } from './storage';
export { queryMonitoring } from './transport';
export type { DailyReport, MetricSummary, MonitoringEvent, MonitoringSnapshot } from './types';

let initialized = false;
let routeFrame = 0;
let cleanup: (() => void) | undefined;

/** 业务主动结束，确保耗时包含数据加载与内容渲染；取消不计入成功耗时。 */
export function startMeasure(name: string) {
  const started = performance.now();
  const visit = currentVisit();
  const span = performanceSpan(name);
  let ended = false;
  return (status: 'success' | 'error' | 'cancelled' = 'success') => {
    if (ended) {
      return;
    }
    ended = true;
    span?.setAttribute('result', status);
    span?.end();
    recordEvent({
      ...visit,
      kind: 'measure',
      name,
      value: performance.now() - started,
      unit: 'ms',
      attributes: { status },
    });
  };
}

/** 此指标只估算路由通知后的绘制等待，不代表懒加载或业务数据已经就绪。 */
export function trackRoute(path: string) {
  if (!monitoringConfig.enabled) {
    return;
  }
  changeVisit(path);
  const started = performance.now();
  const visit = currentVisit();
  cancelAnimationFrame(routeFrame);
  routeFrame = requestAnimationFrame(() => {
    routeFrame = requestAnimationFrame(() => {
      if (document.visibilityState === 'visible') {
        recordEvent({
          ...visit,
          kind: 'measure',
          name: 'ROUTE_PAINT_ESTIMATE',
          value: performance.now() - started,
          unit: 'ms',
        });
      }
    });
  });
}

export function initMonitoring() {
  if (initialized || !monitoringConfig.enabled || typeof window === 'undefined') {
    return;
  }
  initialized = true;
  initSentry();
  // 标准 Web Vitals 为文档访问口径，SPA 切换不会反复注册观察器。
  const initialVisit = currentVisit();
  const origin = performance.timeOrigin;
  const reportVital = (metric: MetricType) => {
    recordEvent({
      ...initialVisit,
      id: `vital:${metric.id}`,
      kind: 'vital',
      name: metric.name,
      route: normalizeRoute(metric.navigationURL || initialVisit.route),
      timestamp: origin + (metric.navigationStartTime || 0),
      value: metric.value,
      unit: metric.name === 'CLS' ? 'score' : 'ms',
      rating: metric.rating,
      attributes: { navigationType: metric.navigationType },
    });
  };
  onCLS(reportVital);
  onFCP(reportVital);
  onINP(reportVital);
  onLCP(reportVital);
  onTTFB(reportVital);
  const onError = (event: ErrorEvent) =>
    recordEvent({
      kind: 'error',
      name: 'UNCAUGHT_ERROR',
      level: 'error',
      message: event.message || '脚本错误',
    });
  const onRejection = (event: PromiseRejectionEvent) =>
    recordEvent({
      kind: 'error',
      name: 'UNHANDLED_REJECTION',
      level: 'error',
      message: event.reason instanceof Error ? event.reason.message : String(event.reason),
    });
  const flush = () => {
    void flushMonitoring().catch(() => {
      /* 监控不得影响业务。 */
    });
  };
  const onVisibility = () => {
    if (document.visibilityState === 'visible') {
      flush();
    }
  };
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);
  window.addEventListener('online', flush);
  document.addEventListener('visibilitychange', onVisibility);
  const timer = window.setInterval(flush, 60_000);
  const startTimer = window.setTimeout(flush, 1000);
  logMessage('info', 'monitoring.started', { environment: monitoringConfig.environment });
  cleanup = () => {
    window.removeEventListener('error', onError);
    window.removeEventListener('unhandledrejection', onRejection);
    window.removeEventListener('online', flush);
    document.removeEventListener('visibilitychange', onVisibility);
    clearInterval(timer);
    clearTimeout(startTimer);
    cancelAnimationFrame(routeFrame);
  };
}

export function disposeMonitoring() {
  cleanup?.();
}

/** React 错误边界的本地记录（Sentry ErrorBoundary 已完成 SDK 上报）。 */
export function recordReactError(error: unknown) {
  if (!monitoringConfig.dsn) {
    captureError(error, { source: 'react' });
  } else {
    recordEvent({
      kind: 'error',
      name: 'REACT_ERROR',
      level: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
