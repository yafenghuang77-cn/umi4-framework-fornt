import { retryTimedOutQuery } from '@utils/requestRetry';

describe('查询重试策略', () => {
  test.each(['ECONNABORTED', 'ETIMEDOUT'])('%s 在达到上限前允许重试', (code) => {
    expect(retryTimedOutQuery(0, { code })).toBe(true);
    expect(retryTimedOutQuery(4, { code })).toBe(true);
    expect(retryTimedOutQuery(5, { code })).toBe(false);
  });

  test.each([{ code: 'ERR_NETWORK' }, { code: 'ERR_CANCELED' }, new Error('失败'), null])(
    '非超时错误不自动重试：%p',
    (error) => {
      expect(retryTimedOutQuery(0, error)).toBe(false);
    },
  );
});
