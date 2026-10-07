import { type ErrorInterceptor, type ResponseInterceptor } from '@umijs/max';

import { isUnauthorizedResponse } from './auth';
import { isBinaryResponse } from './binary';
import { BusinessError } from './error';
import { type RequestOptions } from './types';

/**
 * 统一决定请求返回值，T 表示调用方期望的最终返回类型。
 * 默认提取后端 data；returnFullResponse 为 true 时保留完整后端响应体。
 * 二进制及不含 data 字段的非标准响应原样返回。
 */
export function resolveResponse<T = unknown>(
  body: unknown,
  options: Pick<RequestOptions, 'returnFullResponse'> = {},
): T {
  if (options.returnFullResponse || isBinaryResponse(body)) {
    return body as T;
  }

  if (typeof body === 'object' && body !== null && 'data' in body) {
    return body.data as T;
  }

  return body as T;
}

// Umi 默认返回 response.data；getResponse: true 时仍返回完整 AxiosResponse。
export const handleResponse: ResponseInterceptor = (response) => {
  // 下载/流响应直接透传，跳过业务码判断和统一响应转换。
  const responseType = response.config?.responseType;
  if (
    responseType === 'blob' ||
    responseType === 'arraybuffer' ||
    responseType === 'stream' ||
    isBinaryResponse(response.data)
  ) {
    return response;
  }

  // HTTP 200 也可能携带未登录业务码，统一交给 errorHandler 上报并触发登录入口。
  if (isUnauthorizedResponse(response.data)) {
    throw new BusinessError(response.data);
  }

  // 提取 data 前处理业务失败，避免 Umi 后续拦截器丢失原始 success 字段。
  if (
    typeof response.data === 'object' &&
    response.data !== null &&
    'success' in response.data &&
    response.data.success === false
  ) {
    throw new BusinessError(response.data);
  }

  return {
    ...response,
    data: resolveResponse<typeof response.data>(response.data, response.config as RequestOptions),
  };
};

// 必须继续拒绝，让 errorHandler 和调用方 catch / React Query 收到原始错误。
export const rejectResponse: ErrorInterceptor = (error) => Promise.reject(error);
