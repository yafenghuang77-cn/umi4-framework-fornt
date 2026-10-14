import { monitoringConfig } from '@/utils/monitoring/config';
import { postMonitoring, queryMonitoring } from '@/utils/monitoring/transport';

const originalFetch = globalThis.fetch;
const fetchMock = jest.fn();

beforeEach(() => {
  globalThis.fetch = fetchMock;
  monitoringConfig.ingestUrl = '/api/monitoring/ingest';
  monitoringConfig.queryUrl = '/api/monitoring/query';
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

test('只有 2xx 且 accepted=true 才确认，不把 SPA 回退当作成功', async () => {
  fetchMock.mockResolvedValueOnce(response({ accepted: true }));
  await expect(postMonitoring({ type: 'events', events: [] })).resolves.toBeUndefined();
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/monitoring/ingest',
    expect.objectContaining({ credentials: 'same-origin', method: 'POST' }),
  );
  fetchMock.mockResolvedValueOnce(response({ accepted: false }));
  await expect(postMonitoring({})).rejects.toThrow('accepted');
  fetchMock.mockResolvedValueOnce(response({}, 503));
  await expect(postMonitoring({})).rejects.toThrow('503');
  fetchMock.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => {
      throw new SyntaxError('HTML');
    },
  });
  await expect(postMonitoring({})).rejects.toThrow('HTML');
});

test('服务端查询携带日期和环境，严格校验返回字段', async () => {
  fetchMock.mockResolvedValueOnce(response({ events: [], reports: [] }));
  await expect(queryMonitoring('2026-10-01', '2026-10-14')).resolves.toEqual({
    events: [],
    reports: [],
  });
  expect(fetchMock.mock.calls[0][0]).toContain('from=2026-10-01&to=2026-10-14&environment=dev');
  fetchMock.mockResolvedValueOnce(response({ events: [{ kind: 'invalid' }], reports: [] }));
  await expect(queryMonitoring('2026-10-01', '2026-10-14')).rejects.toThrow('字段不符合协议');
});

test('未配置查询目标时不发送请求或伪造服务端数据', async () => {
  monitoringConfig.queryUrl = '';
  await expect(queryMonitoring('2026-10-01', '2026-10-14')).rejects.toThrow('尚未配置');
  expect(fetchMock).not.toHaveBeenCalled();
});
