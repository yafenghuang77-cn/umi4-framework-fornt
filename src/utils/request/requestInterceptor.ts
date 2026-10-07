import { type RequestInterceptorAxios } from '@umijs/max';

import { getToken } from './token';

/** skipAuth 可跳过自动鉴权；调用方显式设置的 Authorization 优先。 */
export const attachToken: RequestInterceptorAxios = (options) => {
  const token = options.skipAuth ? null : getToken();
  const hasAuthorization = Object.keys(options.headers ?? {}).some(
    (key) => key.toLowerCase() === 'authorization',
  );

  return {
    ...options,
    headers: {
      ...options.headers,
      ...(token && !hasAuthorization ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
};
