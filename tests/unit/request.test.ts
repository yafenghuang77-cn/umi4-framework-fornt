import { history, type ResponseInterceptor } from '@umijs/max';
import { notification } from 'antd';

import { BusinessError, errorConfig, getRequestErrorMessage } from '@/utils/request/error';
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

function success(data: unknown) {
  return { success: true, errCode: '0', errMessage: '成功', data };
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

  test('使用后端返回的 Token 名称和前缀，清除后恢复默认设置', async () => {
    setToken('token-value', { tokenName: 'satoken', tokenPrefix: null });
    expect((await attachToken({ url: '/api/users' })).headers).toEqual({ satoken: 'token-value' });
    expect((await attachToken({ headers: { SaToken: 'custom' } })).headers).toEqual({
      SaToken: 'custom',
    });
    expect((await attachToken({ skipAuth: true })).headers).toEqual({});
    removeToken();
    setToken('new-token');
    expect((await attachToken({})).headers).toEqual({ Authorization: 'Bearer new-token' });
  });
});

describe('响应协议', () => {
  test('未登录业务错误即使跳过全局提示，仍会跳转登录页', () => {
    setToken('expired-token');
    errorConfig.errorHandler?.(
      new BusinessError({ success: false, errCode: '401', errMessage: '登录已过期', data: null }),
      { skipErrorHandler: true },
    );
    expect(history.replace).toHaveBeenCalledWith('/user/login');
    expect(getToken()).toBeNull();
    expect(notification.error).not.toHaveBeenCalled();
  });

  test('主动取消请求不提示错误也不跳转', () => {
    const error = Object.assign(new Error('取消请求'), { code: 'ERR_CANCELED' });
    errorConfig.errorHandler?.(error, {});
    expect(history.replace).not.toHaveBeenCalled();
    expect(notification.error).not.toHaveBeenCalled();
  });

  test('提取 data，包括 falsy 值；完整响应选项保留响应体', () => {
    expect(resolveResponse(success(0))).toBe(0);
    expect(resolveResponse(success(null))).toBeNull();
    const body = success({ id: 1 });
    expect(resolveResponse(body, { returnFullResponse: true })).toBe(body);
    expect(resolveResponse({ id: 1 })).toEqual({ id: 1 });
  });

  test('HTTP 200 中的 COLA 未登录业务码仍然抛错', () => {
    expect(() =>
      handleResponse(
        response({ success: false, errCode: '401', errMessage: '登录已过期', data: null }),
      ),
    ).toThrow('登录已过期');
  });

  test('业务失败在提取 data 前抛错，data 内的 success 不影响外层状态', async () => {
    expect(() =>
      handleResponse(
        response({ success: false, errCode: '403', errMessage: '无权限', data: null }),
      ),
    ).toThrow('无权限');
    expect((await handleResponse(response(success({ success: false })))).data).toEqual({
      success: false,
    });
  });

  test('表单及全局通知读取 HTTP 错误中的 COLA errMessage', () => {
    const error = Object.assign(new Error('Request failed with status code 400'), {
      response: {
        status: 400,
        data: { success: false, errCode: '10001', errMessage: '用户名已存在', data: null },
      },
    });
    expect(getRequestErrorMessage(error)).toBe('用户名已存在');
    errorConfig.errorHandler?.(error, {});
    expect(notification.error).toHaveBeenCalledWith({
      message: '请求失败',
      description: '用户名已存在',
    });
  });

  test('旧协议不再解包或用于业务提示与登录跳转', () => {
    const oldBody = { code: 401, messages: '旧提示', data: { id: 1 } };
    expect(resolveResponse(oldBody)).toBe(oldBody);
    expect(() => handleResponse(response(oldBody))).not.toThrow();
    expect(new BusinessError(oldBody).message).toBe('请求未成功，请稍后重试');
  });

  test('超时和断网提供可读提示', () => {
    expect(getRequestErrorMessage({ code: 'ECONNABORTED' })).toBe('请求超时，请稍后重试');
    expect(getRequestErrorMessage({ request: {} })).toBe('无法连接服务器，请检查网络后重试');
  });

  test('下载响应原样返回，原始错误继续传递给调用方', async () => {
    const download = response(new Blob(['file']), 'blob');
    expect(handleResponse(download)).toBe(download);
    const error = new Error('网络错误');
    await expect(rejectResponse(error)).rejects.toBe(error);
  });
});
