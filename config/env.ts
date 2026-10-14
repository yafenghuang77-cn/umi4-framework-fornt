import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';

const environments = {
  dev: { appEnv: 'dev', label: 'DEV 本地开发环境' },
  uat: { appEnv: 'uat', label: 'UAT 测试环境' },
  pre: { appEnv: 'pre', label: 'PRE 预发环境' },
  production: { appEnv: 'prod', label: 'PROD 生产环境' },
} as const;

/** Umi 已加载公共 .env / .env.local；这里补充业务环境的默认值。 */
export function loadEnvironment(
  umiEnv = process.env.UMI_ENV || 'dev',
  rootDirectory = resolve(__dirname, '..'),
  inheritedVariables: NodeJS.ProcessEnv = process.env,
) {
  if (!Object.hasOwn(environments, umiEnv)) {
    throw new Error(`不支持的 UMI_ENV：${umiEnv}，请使用 dev、uat、pre 或 production`);
  }

  const name = umiEnv as keyof typeof environments;
  const environment = environments[name];
  const envFile = resolve(rootDirectory, `.env.${name}`);
  const localFile = `${envFile}.local`;
  const defaults = parseEnv(readFileSync(envFile, 'utf8'));

  if (defaults.APP_ENV !== environment.appEnv) {
    throw new Error(
      `.env.${name} 的 APP_ENV 必须为 ${environment.appEnv}，当前值：${defaults.APP_ENV ?? '未配置'}`,
    );
  }

  // 显式进程变量（含 Umi 加载的 .env.local）优先于环境文件。
  const variables = {
    ...defaults,
    ...(existsSync(localFile) ? parseEnv(readFileSync(localFile, 'utf8')) : {}),
    ...inheritedVariables,
  };

  if (variables.APP_ENV !== environment.appEnv) {
    throw new Error(
      `环境标识不匹配：UMI_ENV=${name} 要求 APP_ENV=${environment.appEnv}，当前值：${variables.APP_ENV}。请检查本地覆盖文件和进程变量。`,
    );
  }

  return { name, label: environment.label, appEnv: variables.APP_ENV, variables };
}

export default loadEnvironment();
