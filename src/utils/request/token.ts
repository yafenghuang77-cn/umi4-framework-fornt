const TOKEN_STORAGE_KEY = 'framework:token';

/** 获取保存的 token；未登录或非浏览器环境返回 null。 */
export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

/** 退出登录或凭证失效时清除 token。 */
export function removeToken(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

/** 保存原始 token（不包含 Bearer 前缀），刷新页面后仍可读取。 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  const value = token.trim();
  if (!value) {
    removeToken();
    return;
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, value);
}
