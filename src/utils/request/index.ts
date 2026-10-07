import { type RequestConfig } from '@umijs/max';

import { errorConfig } from './error';
import { attachToken } from './requestInterceptor';
import { handleResponse, rejectResponse } from './response';

export { redirectToLogin } from './auth';
export { reportRequestError } from './report';
export { resolveResponse } from './response';
export { type RequestOptions } from './types';

export const requestConfig: RequestConfig<unknown> = {
  baseURL: process.env.API_BASE_URL,
  timeout: 5 * 1000,
  requestInterceptors: [attachToken],
  responseInterceptors: [[handleResponse, rejectResponse]],
  errorConfig,
};
