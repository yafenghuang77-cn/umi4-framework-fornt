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
