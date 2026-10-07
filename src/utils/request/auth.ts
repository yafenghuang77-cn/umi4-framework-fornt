import { history } from '@umijs/max';

const LOGIN_PATH = '/user/login';

/** HTTP 状态码或响应体 code 为 401 时跳转到登录页面。 */
export function redirectToLogin(): void {
  if (typeof window === 'undefined' || history.location.pathname === LOGIN_PATH) {
    return;
  }

  history.replace(LOGIN_PATH);
}

/** 兼容后端以数字或字符串返回未登录状态码。 */
export function isUnauthorizedResponse(data: unknown): boolean {
  if (typeof data !== 'object' || data === null || !('code' in data)) {
    return false;
  }

  return data.code === 401 || data.code === '401';
}
