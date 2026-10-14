import { revisionOf, shanghaiDate, summarize } from './aggregate';
import { settleWrites } from './collector';
import { monitoringConfig } from './config';
import { monitoringId } from './id';
import { isSentryReady, submitDailyToSentry } from './sentry';
import { markEventsUploaded, pruneStorage, readSnapshot, saveReport } from './storage';
import { postMonitoring } from './transport';
import { type DailyReport } from './types';

let running: Promise<void> | undefined;
const fallbackClientId = monitoringId();

function clientId() {
  try {
    const key = 'framework:monitoring:client';
    const saved = localStorage.getItem(key);
    if (saved) {
      return saved;
    }
    localStorage.setItem(key, fallbackClientId);
  } catch {
    /* 存储禁用时使用本次页面实例 ID。 */
  }
  return fallbackClientId;
}

async function runDaily() {
  if (!monitoringConfig.enabled) {
    return;
  }
  await settleWrites();
  const { events, reports } = await readSnapshot();
  const today = shanghaiDate();
  const environment = monitoringConfig.environment;
  const eligible = events.filter(
    (event) => event.environment === environment && shanghaiDate(event.timestamp) < today,
  );
  const dates = [...new Set(eligible.map((event) => shanghaiDate(event.timestamp)))].sort();
  for (const date of dates) {
    const dailyEvents = eligible.filter((event) => shanghaiDate(event.timestamp) === date);
    const id = `${clientId()}:${environment}:${date}`;
    const revision = await revisionOf(dailyEvents);
    const previous = reports.find((item) => item.id === id);
    if (previous?.revision === revision && previous.status !== 'pending') {
      continue;
    }
    const report: DailyReport =
      previous?.revision === revision
        ? { ...previous }
        : {
            id,
            revision,
            date,
            environment,
            generatedAt: Date.now(),
            eventCount: dailyEvents.length,
            logCount: dailyEvents.filter((item) => item.kind === 'log').length,
            errorCount: dailyEvents.filter((item) => item.kind === 'error').length,
            metrics: summarize(dailyEvents),
            status: 'pending',
          };
    await saveReport(report);
    if (!monitoringConfig.ingestUrl && !isSentryReady()) {
      continue;
    }
    try {
      if (monitoringConfig.ingestUrl) {
        await postMonitoring({ type: 'daily', report });
        report.status = 'uploaded';
      } else {
        await submitDailyToSentry(report);
        report.status = 'sentry-submitted';
      }
      report.uploadedAt = Date.now();
      delete report.lastError;
    } catch (error) {
      report.lastError = error instanceof Error ? error.message : '上报失败';
    }
    await saveReport(report);
  }
  // 最多处理 100 条一批；服务端按 id+updatedAt 幂等更新，2xx+accepted 才确认。
  if (monitoringConfig.ingestUrl) {
    const pending = events
      .filter(
        (event) =>
          event.environment === environment &&
          (!event.uploadedAt || event.uploadedAt < event.updatedAt),
      )
      .slice(0, 100);
    if (pending.length) {
      try {
        await postMonitoring({ type: 'events', events: pending });
        await markEventsUploaded(pending);
      } catch {
        /* 保留原记录，下次定时或在线恢复时重试。 */
      }
    }
  }
  await pruneStorage();
}

/** 同一标签页互斥；支持 Web Locks 的浏览器还会在多个标签页之间互斥。 */
export function flushMonitoring(): Promise<void> {
  running ??= (async () => {
    try {
      if (navigator.locks) {
        await navigator.locks.request('framework-monitoring-upload', runDaily);
      } else {
        await runDaily();
      }
    } finally {
      running = undefined;
    }
  })();
  return running;
}
