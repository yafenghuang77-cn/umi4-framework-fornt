import * as Sentry from '@sentry/react';

import { recordEvent } from '@/utils/monitoring/collector';
import { monitoringConfig } from '@/utils/monitoring/config';
import {
  captureError,
  initSentry,
  isSentryReady,
  logMessage,
  submitDailyToSentry,
} from '@/utils/monitoring/sentry';
import { type DailyReport } from '@/utils/monitoring/types';

jest.mock('@sentry/react', () => ({
  init: jest.fn(() => ({ getDsn: () => ({ publicKey: 'test' }) })),
  browserTracingIntegration: jest.fn(() => ({ name: 'BrowserTracing' })),
  consoleLoggingIntegration: jest.fn(() => ({ name: 'ConsoleLogging' })),
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  captureException: jest.fn(),
  flush: jest.fn(async () => true),
}));
jest.mock('@/utils/monitoring/collector', () => ({ recordEvent: jest.fn() }));

beforeEach(() => {
  monitoringConfig.dsn = 'https://public@example.com/1';
  initSentry();
});

const report: DailyReport = {
  id: 'browser:dev:2026-10-14',
  revision: 'r1',
  date: '2026-10-14',
  environment: 'dev',
  generatedAt: 1,
  eventCount: 2,
  logCount: 1,
  errorCount: 0,
  status: 'pending',
  metrics: [
    {
      key: 'lcp',
      route: '/welcome',
      name: 'LCP',
      release: 'test',
      unit: 'ms',
      count: 1,
      p50: 100,
      p75: 100,
      p95: 100,
    },
  ],
};

test('Sentry 11 初始化性能与日志，关闭敏感采集，并在上报前脱敏', () => {
  monitoringConfig.dsn = 'https://public@example.com/1';
  initSentry();
  initSentry();
  expect(Sentry.init).toHaveBeenCalledTimes(1);
  expect(isSentryReady()).toBe(true);
  const options = jest.mocked(Sentry.init).mock.calls[0][0];
  expect(options.dataCollection).toMatchObject({
    userInfo: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
  });
  expect(Sentry.browserTracingIntegration).toHaveBeenCalled();
  expect(Sentry.consoleLoggingIntegration).toHaveBeenCalledWith({ levels: ['warn', 'error'] });
  const log = options.beforeSendLog?.({
    level: 'info',
    message: 'token=private-value',
    attributes: { password: 'secret' },
  });
  expect(log).toMatchObject({
    message: 'token=[filtered]',
    attributes: { password: '[filtered]' },
  });
  expect(recordEvent).toHaveBeenCalledWith(
    expect.objectContaining({ kind: 'log', message: 'token=[filtered]' }),
  );
});

test('业务结构化日志与异常不传原始敏感上下文', () => {
  logMessage('warn', 'slow request token=private-value', { password: 'secret', duration: 400 });
  expect(Sentry.logger.warn).toHaveBeenCalledWith('slow request token=[filtered]', {
    password: '[filtered]',
    duration: 400,
  });
  captureError(new Error('failed user@example.com'), { token: 'private-value' });
  expect(Sentry.captureException).toHaveBeenCalledWith(
    expect.objectContaining({ message: 'failed [email]' }),
    { extra: { token: '[filtered]' } },
  );
});

test('日报发送总量与各指标结构化日志，flush 超时仍视为失败', async () => {
  await submitDailyToSentry(report);
  expect(Sentry.logger.info).toHaveBeenCalledWith(
    'performance.daily',
    expect.objectContaining({ report_id: report.id, revision: 'r1' }),
  );
  expect(Sentry.logger.info).toHaveBeenCalledWith(
    'performance.daily.metric',
    expect.objectContaining({ name: 'LCP', p75: 100 }),
  );
  jest.mocked(Sentry.flush).mockResolvedValueOnce(false);
  await expect(submitDailyToSentry(report)).rejects.toThrow('Sentry 队列');
});
