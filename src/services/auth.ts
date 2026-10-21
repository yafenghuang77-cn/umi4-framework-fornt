import { request } from '@umijs/max';

export interface LoginParams {
  username: string;
  password: string;
}

export interface AuthUser {
  id: number;
  username: string;
  createdAt: string;
}

export interface LoginResult {
  tokenName: string;
  tokenPrefix: string | null;
  tokenValue: string;
  /** Sa-Token 返回的剩余有效秒数。 */
  timeout: number;
  user: AuthUser;
}

// /api 前缀由开发代理或部署服务器转发到后端服务。
const ROOT = '/api/auth';
const options = { method: 'POST', skipAuth: true, skipErrorHandler: true };

/** 全局响应拦截器解包 COLA data，错误由表单就地展示。 */
export function login(params: LoginParams): Promise<LoginResult> {
  return request<LoginResult>(`${ROOT}/login`, {
    ...options,
    data: { username: params.username.trim(), password: params.password },
  });
}

/** 注册只返回用户信息，不建立登录会话。 */
export function register(params: LoginParams): Promise<AuthUser> {
  return request<AuthUser>(`${ROOT}/register`, {
    ...options,
    data: { username: params.username.trim(), password: params.password },
  });
}
