const TOKEN_STORAGE_KEY = 'framework:token';
const TOKEN_HEADER_STORAGE_KEY = 'framework:token-header';

interface TokenHeader {
  tokenName: string;
  tokenPrefix: string | null;
}

/** 兼容此前仅保存原始 Token 的会话。 */
export function getTokenHeader(): TokenHeader {
  const defaults = { tokenName: 'Authorization', tokenPrefix: 'Bearer' };
  if (typeof window === 'undefined') {
    return defaults;
  }
  try {
    const header: unknown = JSON.parse(
      window.localStorage.getItem(TOKEN_HEADER_STORAGE_KEY) || 'null',
    );
    if (
      typeof header === 'object' &&
      header !== null &&
      'tokenName' in header &&
      typeof header.tokenName === 'string' &&
      header.tokenName.trim() &&
      'tokenPrefix' in header &&
      (header.tokenPrefix === null || typeof header.tokenPrefix === 'string')
    ) {
      return { tokenName: header.tokenName, tokenPrefix: header.tokenPrefix };
    }
  } catch {
    // 旧会话或损坏的本地元数据使用默认请求头。
  }
  return defaults;
}

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
  window.localStorage.removeItem(TOKEN_HEADER_STORAGE_KEY);
}

/** 保存原始 token（不包含 Bearer 前缀），刷新页面后仍可读取。 */
export function setToken(token: string, header?: TokenHeader): void {
  if (typeof window === 'undefined') {
    return;
  }

  const value = token.trim();
  if (!value) {
    removeToken();
    return;
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, value);
  if (header) {
    window.localStorage.setItem(TOKEN_HEADER_STORAGE_KEY, JSON.stringify(header));
  } else {
    window.localStorage.removeItem(TOKEN_HEADER_STORAGE_KEY);
  }
}
