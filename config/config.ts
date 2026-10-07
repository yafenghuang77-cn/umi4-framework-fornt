import { defineConfig } from '@umijs/max';
import { join } from 'node:path';

import uatConfig from './config.uat';
import defaultSettings from './defaultSettings';
import routers from './routes';

const PUBLIC_PATH = '/framework/';
const environments = {
  uat: { appEnv: 'uat', label: 'UAT 测试环境' },
  pre: { appEnv: 'pre', label: 'PRE 预发环境' },
  production: { appEnv: 'prod', label: 'PROD 生产环境' },
} as const;
const umiEnv = process.env.UMI_ENV || 'uat';

if (!Object.hasOwn(environments, umiEnv)) {
  throw new Error(`不支持的 UMI_ENV：${umiEnv}，请使用 uat、pre 或 production`);
}

const environment = environments[umiEnv as keyof typeof environments];

if (process.argv[2] === 'dev') {
  process.stdout.write(`\n[启动环境] ${environment.label}（${environment.appEnv}）\n\n`);
}

export default defineConfig({
  history: {
    type: 'browser',
  },
  hash: true,
  antd: {
    appConfig: {},
    configProvider: {
      variant: 'filled',
      theme: {
        token: {
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
          borderRadius: 6,
        },
      },
    },
  },
  access: {},
  model: {},
  initialState: { loading: '@/components/PageSkeleton/InitialLoading' },
  request: {},
  layout: {
    locale: true,
    ...defaultSettings,
  },
  routes: [...routers],
  npmClient: 'pnpm',
  base: PUBLIC_PATH,
  publicPath: PUBLIC_PATH,
  title: 'Ant Design Pro',
  metas: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  ignoreMomentLocale: true,
  manifest: {},
  // 未指定 UMI_ENV 时也默认使用 UAT；指定环境后由 Umi 合并对应配置。
  define: uatConfig.define,
  exportStatic: {},
  // turbopack: {},
  alias: {
    '@root': join(__dirname, '..'),
  },
  fastRefresh: true,
  routePrefetch: {},
  moment2dayjs: {
    preset: 'antd',
    plugins: ['duration', 'relativeTime'],
  },
  locale: {
    // default zh-CN
    default: 'zh-CN',
    antd: true,
    // default true, when it is true, will use `navigator.language` overwrite default
    baseNavigator: false,
  },
  // Provider 由 Umi 注册；缓存与重试策略在 src/app.tsx 中配置。
  reactQuery: { queryClient: true, devtool: false },
  analytics: {
    ga_v2: 'G-59NF1VHHPF',
  },
  headScripts: [
    // 解决首次加载时白屏的问题
    { src: join(PUBLIC_PATH, 'scripts/loading.js'), async: true },
  ],
  plugins: ['@umijs/max-plugin-openapi', '@umijs/request-record'],
  openAPI: [
    {
      requestLibPath: "import { request } from '@umijs/max'",
      // 或者使用在线的版本
      // schemaPath: "https://gw.alipayobjects.com/os/antfincdn/M%24jrzTTYJN/oneapi.json"
      schemaPath: join(__dirname, 'oneapi.json'),
      mock: false,
    },
  ],
  tailwindcss: {},
  mock: {
    include: ['src/pages/**/_mock.ts'],
    exclude: ['mock/requestRecord.mock.js'],
  },
  utoopack: {
    module: {
      rules: {
        '*.md': {
          loaders: [{ loader: join(__dirname, 'md-raw-loader.cjs') }],
          as: '*.js',
        },
      },
    },
  },
  requestRecord: {},
});
