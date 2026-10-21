export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
  name: string;
}

/** 临时模拟登录；接入后端时替换此函数，保留返回类型即可。 */
export async function login(params: LoginParams): Promise<LoginResult> {
  // TODO: 调用真实登录接口，将后端结果转换为 LoginResult。
  // 模拟凭证仅用于前端登录流程，不保存密码。
  return {
    token: `mock-${crypto.randomUUID()}`,
    name: params.username.trim(),
  };
}

export interface RegisterResult {
  username: string;
}

/** 临时模拟注册；接入后端时替换此函数，保留返回类型即可。 */
export async function register(params: LoginParams): Promise<RegisterResult> {
  // 与模拟登录保持一致，仅演示前端流程，不持久化账号或密码。
  // TODO: 调用真实注册接口，将后端结果转换为 RegisterResult。
  return { username: params.username.trim() };
}
