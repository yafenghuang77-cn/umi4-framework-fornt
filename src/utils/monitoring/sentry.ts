import * as Sentry from '@sentry/react';

import { recordEvent } from './collector';
import { monitoringConfig } from './config';
import { normalizeRoute, redactText, scrub } from './privacy';
import { type DailyReport } from './types';

let ready = false;
export function isSentryReady() {
  return ready;
}

export function initSentry() {
  if (ready || !monitoringConfig.enabled || !monitoringConfig.dsn) {
    return;
  }
  try {
    const client = Sentry.init({
      dsn: monitoringConfig.dsn,
      environment: monitoringConfig.environment,
      release: monitoringConfig.release,
      dataCollection: {
        userInfo: false,
        cookies: false,
        httpHeaders: false,
        httpBodies: [],
        urlQueryParams: false,
        stackFrameVariables: false,
      },
      tracesSampleRate: monitoringConfig.tracesSampleRate,
      integrations: [
        Sentry.browserTracingIntegration({
          beforeStartSpan: (context) => ({ ...context, name: normalizeRoute(context.name) }),
          shouldCreateSpanForRequest: (url) =>
            ![monitoringConfig.ingestUrl, monitoringConfig.queryUrl]
              .filter(Boolean)
              .some(
                (endpoint) =>
                  new URL(url, location.origin).pathname ===
                  new URL(endpoint, location.origin).pathname,
              ),
        }),
        Sentry.consoleLoggingIntegration({ levels: ['warn', 'error'] }),
      ],
      // 默认不向业务或第三方接口附加 tracing header；后端联调时按域名显式开放。
      tracePropagationTargets: [],
      beforeSend: (event) => scrub(event),
      beforeBreadcrumb: (breadcrumb) => scrub(breadcrumb),
      beforeSendSpan: (span) => scrub(span),
      beforeSendLog: (log) => {
        const cleaned = scrub(log);
        if (!String(cleaned.message).startsWith('performance.daily')) {
          recordEvent({
            kind: 'log',
            name: 'LOG',
            level: log.level === 'fatal' ? 'error' : log.level === 'trace' ? 'debug' : log.level,
            message: String(cleaned.message),
            attributes: Object.fromEntries(
              Object.entries(cleaned.attributes || {}).filter(([, value]) =>
                ['string', 'number', 'boolean'].includes(typeof value),
              ),
            ) as Record<string, string | number | boolean>,
          });
        }
        return cleaned;
      },
    });
    ready = Boolean(client?.getDsn());
    if (!ready) {
      throw new Error('Sentry DSN 无效');
    }
  } catch {
    recordEvent({
      kind: 'error',
      name: 'MONITORING_INIT',
      message: 'Sentry 初始化失败，请检查 DSN 配置',
      level: 'error',
    });
  }
}

export function logMessage(
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  attributes: Record<string, string | number | boolean> = {},
) {
  const cleaned = redactText(message);
  const context = scrub(attributes);
  if (ready) {
    Sentry.logger[level](cleaned, context);
  } else {
    recordEvent({ kind: 'log', name: 'LOG', level, message: cleaned, attributes: context });
  }
}

export function captureError(
  error: unknown,
  attributes: Record<string, string | number | boolean> = {},
) {
  const original = error instanceof Error ? error : new Error(String(error));
  const safeError = new Error(redactText(original.message));
  safeError.name = original.name;
  safeError.stack = original.stack ? redactText(original.stack) : undefined;
  recordEvent({
    kind: 'error',
    name: safeError.name,
    level: 'error',
    message: safeError.message,
    attributes: scrub(attributes),
  });
  if (ready) {
    Sentry.captureException(safeError, { extra: scrub(attributes) });
  }
}

export function performanceSpan(name: string) {
  return ready
    ? Sentry.startInactiveSpan({ name: redactText(name), op: 'ui.business' })
    : undefined;
}

export async function submitDailyToSentry(report: DailyReport) {
  if (!ready) {
    throw new Error('尚未配置 Sentry 或统计上报接口');
  }
  // SDK 11 日志默认启用；日报走结构化日志，避免改变 Web Vitals 的采样与口径。
  Sentry.logger.info('performance.daily', {
    report_id: report.id,
    revision: report.revision,
    date: report.date,
    event_count: report.eventCount,
    error_count: report.errorCount,
  });
  report.metrics.forEach((metric) =>
    Sentry.logger.info('performance.daily.metric', {
      report_id: report.id,
      revision: report.revision,
      date: report.date,
      ...metric,
    }),
  );
  if (!(await Sentry.flush(5000))) {
    throw new Error('Sentry 队列未能在 5 秒内完成发送');
  }
}
