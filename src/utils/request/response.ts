import { type ErrorInterceptor, type ResponseInterceptor } from '@umijs/max';

import { finishRequest } from '@/utils/monitoring/request';

import { isUnauthorizedResponse } from './auth';
import { isBinaryResponse } from './binary';
import { BusinessError } from './error';
import { type ApiResponse, type RequestOptions } from './types';

function isApiResponse(body: unknown): body is ApiResponse<unknown> {
  return (
    typeof body === 'object' &&
    body !== null &&
    'success' in body &&
    typeof body.success === 'boolean' &&
    'errCode' in body &&
    typeof body.errCode === 'string' &&
    'errMessage' in body &&
    typeof body.errMessage === 'string'
  );
}

/**
 * 统一决定请求返回值，T 表示调用方期望的最终返回类型。
 * 默认提取 COLA data；returnFullResponse 为 true 时保留完整后端响应体。
 * 二进制及非 COLA 响应原样返回。
 */
export function resolveResponse<T = unknown>(
  body: unknown,
  options: Pick<RequestOptions, 'returnFullResponse'> = {},
): T {
  if (options.returnFullResponse || isBinaryResponse(body)) {
    return body as T;
  }

  if (isApiResponse(body) && 'data' in body) {
    return body.data as T;
  }

  return body as T;
}

// Umi 默认返回 response.data；getResponse: true 时仍返回完整 AxiosResponse。
export const handleResponse: ResponseInterceptor = (response) => {
  const businessFailed =
    isUnauthorizedResponse(response.data) ||
    (isApiResponse(response.data) && (!response.data.success || response.data.errCode !== '0'));
  finishRequest(response.config, response.status, businessFailed);
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

  // 提取 data 前检查 success / errCode，HTTP 200 的业务失败也必须拒绝。
  if (businessFailed) {
    throw new BusinessError(response.data);
  }

  return {
    ...response,
    data: resolveResponse<typeof response.data>(response.data, response.config as RequestOptions),
  };
};

// 必须继续拒绝，让 errorHandler 和调用方 catch / React Query 收到原始错误。
export const rejectResponse: ErrorInterceptor = (error) => {
  const failure = error as {
    config?: Parameters<typeof finishRequest>[0];
    response?: { status: number };
  };
  finishRequest(failure.config, failure.response?.status || 0, true);
  return Promise.reject(error);
};
