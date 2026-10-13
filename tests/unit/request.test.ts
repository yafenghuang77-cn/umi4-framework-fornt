import { history, type ResponseInterceptor } from '@umijs/max';
import { notification } from 'antd';

import { BusinessError, errorConfig } from '@/utils/request/error';
import { attachToken } from '@/utils/request/requestInterceptor';
import { handleResponse, rejectResponse, resolveResponse } from '@/utils/request/response';
import { getToken, removeToken, setToken } from '@/utils/request/token';

jest.mock('@umijs/max', () => ({
  history: { location: { pathname: '/welcome' }, replace: jest.fn() },
}));

jest.mock('antd', () => ({ notification: { error: jest.fn() } }));

function response(data: unknown, responseType?: 'blob') {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: { headers: {}, responseType },
  } as Parameters<ResponseInterceptor>[0];
}

describe('请求凭证', () => {
  test('保存时去除空白，退出时清除凭证', () => {
    setToken(' token-value ');
    expect(getToken()).toBe('token-value');
    removeToken();
    expect(getToken()).toBeNull();
  });

  test('默认注入 Bearer Token，skipAuth 时跳过', async () => {
    setToken('token-value');
    expect((await attachToken({ url: '/api/users' })).headers).toEqual({
      Authorization: 'Bearer token-value',
    });
    expect((await attachToken({ url: '/api/login', skipAuth: true })).headers).toEqual({});
  });

  test('保留调用方指定的 Authorization，不区分字段大小写', async () => {
    setToken('token-value');
    expect((await attachToken({ headers: { authorization: 'Basic custom' } })).headers).toEqual({
      authorization: 'Basic custom',
    });
  });
});

describe('响应协议', () => {
  test('未登录业务错误即使跳过全局提示，仍会跳转登录页', () => {
    errorConfig.errorHandler?.(new BusinessError({ code: 401 }), { skipErrorHandler: true });
    expect(history.replace).toHaveBeenCalledWith('/user/login');
    expect(notification.error).not.toHaveBeenCalled();
  });

  test('主动取消请求不提示错误也不跳转', () => {
    const error = Object.assign(new Error('取消请求'), { code: 'ERR_CANCELED' });
    errorConfig.errorHandler?.(error, {});
    expect(history.replace).not.toHaveBeenCalled();
    expect(notification.error).not.toHaveBeenCalled();
  });

  test('提取 data，包括 falsy 值；完整响应选项保留响应体', () => {
    expect(resolveResponse({ success: true, data: 0 })).toBe(0);
    expect(resolveResponse({ success: true, data: null })).toBeNull();
    const body = { success: true, data: { id: 1 } };
    expect(resolveResponse(body, { returnFullResponse: true })).toBe(body);
    expect(resolveResponse({ id: 1 })).toEqual({ id: 1 });
  });

  test.each([401, '401'])('HTTP 200 中的未登录业务码 %p 仍然抛错', (code) => {
    expect(() => handleResponse(response({ code, data: null }))).toThrow(BusinessError);
  });

  test('业务失败在提取 data 前抛错，data 内的 success 不影响外层状态', async () => {
    expect(() =>
      handleResponse(response({ success: false, message: '无权限', data: null })),
    ).toThrow('无权限');
    expect(
      (await handleResponse(response({ success: true, data: { success: false } }))).data,
    ).toEqual({
      success: false,
    });
  });

  test('下载响应原样返回，原始错误继续传递给调用方', async () => {
    const download = response(new Blob(['file']), 'blob');
    expect(handleResponse(download)).toBe(download);
    const error = new Error('网络错误');
    await expect(rejectResponse(error)).rejects.toBe(error);
  });
});
