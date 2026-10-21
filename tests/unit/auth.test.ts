import { request } from '@umijs/max';

import { login, register } from '@/services/auth';

jest.mock('@umijs/max', () => ({ request: jest.fn() }));

test.each([
  ['login', login],
  ['register', register],
] as const)('%s 以匿名 JSON POST 请求后端，密码保持原样且不提交额外字段', async (path, submit) => {
  const result = { username: 'alice' };
  jest.mocked(request).mockResolvedValueOnce(result);
  await expect(submit({ username: ' Alice ', password: ' password 123 ' })).resolves.toBe(result);
  expect(request).toHaveBeenCalledWith(`/api/auth/${path}`, {
    method: 'POST',
    skipAuth: true,
    skipErrorHandler: true,
    data: { username: 'Alice', password: ' password 123 ' },
  });
});
