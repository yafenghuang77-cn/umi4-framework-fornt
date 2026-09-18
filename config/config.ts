import { defineConfig } from '@umijs/max';
import { join } from 'node:path';
import defaultSettings from './defaultSettings';
import routers from './routes';

const PUBLIC_PATH = '/framework/';

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
          fontFamily: 'AlibabaSans, sans-serif',
        },
      },
    },
  },
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    locale: true,
    ...defaultSettings,
  },
  routes: [...routers],
  npmClient: 'pnpm',
  base: PUBLIC_PATH,
  publicPath: PUBLIC_PATH,
  title: 'AI调研宝',
  ignoreMomentLocale: true,
  manifest: {},
  define: {},
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
    baseNavigator: true,
  },
  reactQuery: {},
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
