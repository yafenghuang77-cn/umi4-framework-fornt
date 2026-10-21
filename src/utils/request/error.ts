import { type AxiosError, type RequestConfig } from '@umijs/max';
import { notification } from 'antd';

import { isUnauthorizedResponse, redirectToLogin } from './auth';
import { reportRequestError } from './report';

function getBackendMessage(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null || !('errMessage' in data)) {
    return undefined;
  }

  return typeof data.errMessage === 'string' && data.errMessage.trim()
    ? data.errMessage
    : undefined;
}

/** 保留业务失败的完整响应，供调用方按后端协议处理。 */
export class BusinessError extends Error {
  readonly data: unknown;

  constructor(data: unknown) {
    super(getBackendMessage(data) ?? '请求未成功，请稍后重试');
    this.name = 'BusinessError';
    this.data = data;
  }
}

/** 表单和全局通知共用后端消息及网络错误提示。 */
export function getRequestErrorMessage(error: unknown, fallback = '请求失败，请稍后重试'): string {
  if (error instanceof BusinessError) {
    return error.message;
  }

  const axiosError = error as AxiosError<unknown> | undefined;
  if (axiosError?.code === 'ECONNABORTED' || axiosError?.code === 'ETIMEDOUT') {
    return '请求超时，请稍后重试';
  }
  if (axiosError?.response) {
    return (
      getBackendMessage(axiosError.response.data) ??
      `请求失败（HTTP ${axiosError.response.status}）`
    );
  }
  if (axiosError?.request) {
    return '无法连接服务器，请检查网络后重试';
  }
  return fallback;
}

export const errorConfig: NonNullable<RequestConfig<unknown>['errorConfig']> = {
  // 业务失败在响应拦截器提取 data 前判断，避免将 data 内的 success 误判为响应状态。
  errorHandler: (error, options) => {
    const axiosError = error as AxiosError<unknown>;
    // 主动取消请求不提示错误。
    if (axiosError.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
      return;
    }

    reportRequestError(error, options);

    const responseData = error instanceof BusinessError ? error.data : axiosError.response?.data;
    if (axiosError.response?.status === 401 || isUnauthorizedResponse(responseData)) {
      redirectToLogin();
    }

    // 跳过全局提示时，仍保留错误上报和登录跳转入口。
    if (options.skipErrorHandler) {
      return;
    }

    const description = getRequestErrorMessage(error, error.message || '请求失败，请稍后重试');
    notification.error({ message: '请求失败', description });
    // Umi 会继续 reject 原始错误，无需在这里重复抛出。
  },
};
