import { type RequestInterceptorAxios } from '@umijs/max';

import { startRequest } from '@/utils/monitoring/request';

import { getToken, getTokenHeader } from './token';

/** 按后端返回的名称及前缀注入 Token；显式设置的同名请求头优先。 */
export const attachToken: RequestInterceptorAxios = (options) => {
  const token = options.skipAuth ? null : getToken();
  const { tokenName, tokenPrefix } = getTokenHeader();
  const hasAuthorization = Object.keys(options.headers ?? {}).some(
    (key) => key.toLowerCase() === tokenName.toLowerCase(),
  );

  return startRequest({
    ...options,
    headers: {
      ...options.headers,
      ...(token && !hasAuthorization
        ? { [tokenName]: tokenPrefix ? `${tokenPrefix} ${token}` : token }
        : {}),
    },
  });
};
