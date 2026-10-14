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
  const envFile = resolve(rootDirectory, `.env.${name}`);
  const localFile = `${envFile}.local`;
  // 显式进程变量（含 Umi 加载的 .env.local）优先于环境文件。
  const variables = {
    ...parseEnv(readFileSync(envFile, 'utf8')),
    ...(existsSync(localFile) ? parseEnv(readFileSync(localFile, 'utf8')) : {}),
    ...inheritedVariables,
  };

  return { name, ...environments[name], variables };
}

export default loadEnvironment();
