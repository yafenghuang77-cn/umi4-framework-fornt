import { history } from '@umijs/max';

import { removeToken } from './token';

const LOGIN_PATH = '/user/login';

/** HTTP 状态码或 COLA errCode 为 401 时清除凭证并跳转登录页面。 */
export function redirectToLogin(): void {
  removeToken();
  if (typeof window === 'undefined' || history.location.pathname === LOGIN_PATH) {
    return;
  }

  history.replace(LOGIN_PATH);
}

/** 未登录状态使用后端 COLA 的字符串 errCode。 */
export function isUnauthorizedResponse(data: unknown): boolean {
  return typeof data === 'object' && data !== null && 'errCode' in data && data.errCode === '401';
}
