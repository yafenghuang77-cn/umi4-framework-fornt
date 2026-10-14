import { percentile, revisionOf, shanghaiDate, summarize } from '@/utils/monitoring/aggregate';
import { recordEvent, settleWrites } from '@/utils/monitoring/collector';
import { monitoringConfig } from '@/utils/monitoring/config';
import { flushMonitoring } from '@/utils/monitoring/daily';
import { normalizeRoute, redactText, scrub } from '@/utils/monitoring/privacy';
import { isSentryReady, submitDailyToSentry } from '@/utils/monitoring/sentry';
import {
  markEventsUploaded,
  pruneStorage,
  readSnapshot,
  saveEvent,
  saveReport,
} from '@/utils/monitoring/storage';
import { postMonitoring } from '@/utils/monitoring/transport';
import { type MonitoringEvent, type MonitoringSnapshot } from '@/utils/monitoring/types';

jest.mock('@/utils/monitoring/storage', () => ({
  readSnapshot: jest.fn(),
  saveReport: jest.fn(),
  saveEvent: jest.fn(() => Promise.resolve()),
  markEventsUploaded: jest.fn(),
  pruneStorage: jest.fn(),
}));
jest.mock('@/utils/monitoring/sentry', () => ({
  isSentryReady: jest.fn(() => false),
  submitDailyToSentry: jest.fn(),
}));
jest.mock('@/utils/monitoring/transport', () => ({ postMonitoring: jest.fn() }));

const event = (overrides: Partial<MonitoringEvent> = {}): MonitoringEvent => ({
  id: 'metric-1',
  visitId: 'visit-1',
  timestamp: Date.parse('2026-10-14T01:00:00Z'),
  updatedAt: 1,
  environment: 'dev',
  release: '1.0',
  route: '/users/:id',
  kind: 'vital',
  name: 'LCP',
  value: 1000,
  unit: 'ms',
  rating: 'good',
  ...overrides,
});

describe('监控统计口径与隐私', () => {
  test('北京时间自然日不依赖宿主机时区', () => {
    expect(shanghaiDate(Date.parse('2026-10-14T15:59:59Z'))).toBe('2026-10-14');
    expect(shanghaiDate(Date.parse('2026-10-14T16:00:00Z'))).toBe('2026-10-15');
  });

  test('nearest-rank 按路由和版本分组，不为缺失指标补零', () => {
    expect(percentile([100, 1, 3, 2], 0.75)).toBe(3);
    const summaries = summarize([
      event({ id: 'a', value: 100 }),
      event({ id: 'b', value: 200, rating: 'poor' }),
      event({ id: 'c', route: '/files', release: '2.0', value: 300 }),
    ]);
    expect(summaries).toHaveLength(2);
    expect(summaries[0]).toMatchObject({ count: 2, p50: 100, p75: 200, goodRate: 0.5 });
    expect(summaries.some((item) => item.name === 'INP')).toBe(false);
  });

  test('取消、失败的业务耗时不会混入成功分位数', () => {
    expect(
      summarize([
        event({ kind: 'measure', attributes: { status: 'cancelled' } }),
        event({ kind: 'measure', attributes: { status: 'error' } }),
      ]),
    ).toEqual([]);
  });

  test('移除 URL 参数和敏感字段，动态 ID 归一化', () => {
    expect(
      scrub({
        request: { headers: { Authorization: 'secret' }, data: 'private body' },
        user: { id: 'private user' },
      }),
    ).toEqual({ request: {} });
    expect(normalizeRoute('https://api.example.com/users/123?token=abc#secret')).toBe('/users/:id');
    expect(
      redactText(
        'request https://api.example.com/users/123?token=abc Bearer abc token=def user@example.com',
      ),
    ).not.toMatch(/abc|def|user@example/);
    expect(
      scrub({
        nested: {
          Authorization: 'Bearer sensitive',
          password: '123',
          url: 'https://a.example/users?name=test',
        },
      }),
    ).toEqual({ nested: { Authorization: '[filtered]', password: '[filtered]', url: '/users' } });
  });

  test('Web Vitals 重复回调保留 id、所属页面与时间，更新指标值', async () => {
    recordEvent(event({ id: 'vital:same', value: 100 }));
    recordEvent(event({ id: 'vital:same', value: 500 }));
    await settleWrites();
    const calls = jest.mocked(saveEvent).mock.calls;
    expect(calls.at(-1)?.[0]).toMatchObject({
      id: 'vital:same',
      value: 500,
      timestamp: event().timestamp,
      route: '/users/:id',
    });
  });
});

describe('每日上报与补报', () => {
  let snapshot: MonitoringSnapshot;
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-14T16:01:00Z'));
    monitoringConfig.ingestUrl = '';
    monitoringConfig.enabled = true;
    snapshot = { events: [event()], reports: [] };
    jest.mocked(readSnapshot).mockImplementation(async () => snapshot);
    jest.mocked(saveReport).mockImplementation(async (report) => {
      snapshot.reports = [
        ...snapshot.reports.filter((item) => item.id !== report.id),
        { ...report },
      ];
    });
    jest.mocked(isSentryReady).mockReturnValue(false);
    jest.mocked(postMonitoring).mockResolvedValue(undefined);
  });
  afterEach(() => {
    jest.useRealTimers();
    monitoringConfig.ingestUrl = '';
  });

  test('不提前生成当天日报，无上报目标时保留 pending', async () => {
    snapshot.events.push(event({ id: 'today', timestamp: Date.now() }));
    await flushMonitoring();
    expect(snapshot.reports).toHaveLength(1);
    expect(snapshot.reports[0]).toMatchObject({
      date: '2026-10-14',
      eventCount: 1,
      status: 'pending',
    });
    expect(postMonitoring).not.toHaveBeenCalled();
  });

  test('失败保留数据，成功确认后才标记，相同版本不重复提交', async () => {
    monitoringConfig.ingestUrl = '/api/monitoring';
    jest.mocked(postMonitoring).mockRejectedValueOnce(new Error('offline'));
    await flushMonitoring();
    expect(snapshot.reports[0]).toMatchObject({ status: 'pending', lastError: 'offline' });
    await flushMonitoring();
    expect(snapshot.reports[0].status).toBe('uploaded');
    const dailyCalls = () =>
      jest
        .mocked(postMonitoring)
        .mock.calls.filter(([body]) => (body as { type: string }).type === 'daily');
    expect(dailyCalls()).toHaveLength(2);
    await flushMonitoring();
    expect(dailyCalls()).toHaveLength(2);
    expect(markEventsUploaded).toHaveBeenCalled();
  });

  test('延迟到达的旧日指标更正会产生新的日报版本', async () => {
    monitoringConfig.ingestUrl = '/api/monitoring';
    await flushMonitoring();
    const revision = snapshot.reports[0].revision;
    snapshot.events[0] = event({ value: 2500, updatedAt: 2 });
    await flushMonitoring();
    expect(snapshot.reports[0].revision).not.toBe(revision);
    expect(snapshot.reports[0].metrics[0].p75).toBe(2500);
  });

  test('Sentry 队列提交与接口确认使用不同状态', async () => {
    jest.mocked(isSentryReady).mockReturnValue(true);
    await flushMonitoring();
    expect(submitDailyToSentry).toHaveBeenCalled();
    expect(snapshot.reports[0].status).toBe('sentry-submitted');
  });

  test('并发触发复用同一次补报，忽略其他环境数据', async () => {
    snapshot.events.push(event({ id: 'prod', environment: 'prod' }));
    await Promise.all([flushMonitoring(), flushMonitoring()]);
    expect(snapshot.reports[0].eventCount).toBe(1);
    expect(pruneStorage).toHaveBeenCalledTimes(1);
  });

  test('禁用监控时不生成和上传历史日报', async () => {
    monitoringConfig.enabled = false;
    await flushMonitoring();
    expect(saveReport).not.toHaveBeenCalled();
    expect(postMonitoring).not.toHaveBeenCalled();
  });

  test('日报版本与读取顺序无关', async () => {
    const items = [event(), event({ id: 'second', value: 200 })];
    expect(await revisionOf(items)).toBe(await revisionOf([...items].reverse()));
  });
});
