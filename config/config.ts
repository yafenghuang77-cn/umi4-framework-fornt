import { defineConfig } from '@umijs/max';
import { isAbsolute, join, parse, relative, resolve, sep } from 'node:path';

import devConfig from './config.dev';
import defaultSettings from './defaultSettings';
import proxy from './proxy';
import routers from './routes';

const PUBLIC_PATH = '/framework/';
const environments = {
  dev: { appEnv: 'dev', label: 'DEV 本地开发环境' },
  uat: { appEnv: 'uat', label: 'UAT 测试环境' },
  pre: { appEnv: 'pre', label: 'PRE 预发环境' },
  production: { appEnv: 'prod', label: 'PROD 生产环境' },
} as const;
const umiEnv = process.env.UMI_ENV || 'dev';

if (!Object.hasOwn(environments, umiEnv)) {
  throw new Error(`不支持的 UMI_ENV：${umiEnv}，请使用 dev、uat、pre 或 production`);
}

const environment = environments[umiEnv as keyof typeof environments];
const isBuild = process.argv[2] === 'build';

if (process.argv[2] === 'dev') {
  process.stdout.write(`\n[启动环境] ${environment.label}（${environment.appEnv}）\n\n`);
}

const config = defineConfig({
  // 本地启动不指定输出目录；仅打包阶段读取产物目录变量。
  ...(isBuild ? { outputPath: process.env.BUILD_OUTPUT_PATH || 'framework' } : {}),
  targets: { chrome: 100, edge: 100, firefox: 100, safari: '15.4' },
  // 发布产物不包含源码映射；各环境的本地启动保留映射用于排查问题。
  devtool: isBuild ? false : 'cheap-module-source-map',
  // Umi 检测配置；Utoopack 下由打包后的 pnpm deadcode 补充检测。
  deadCode: {
    patterns: ['src/**/*'],
    exclude: ['src/.umi*/**'],
    failOnHint: false,
  },
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
  dva: {},
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
  title: 'Ant Design Pro 管理系统模版',
  metas: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  ignoreMomentLocale: true,
  manifest: {},
  // 未指定 UMI_ENV 时默认使用 DEV；指定环境后由 Umi 合并对应配置。
  define: devConfig.define,
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
  // 调试面板仅在本地开发命令启用，所有构建环境均关闭。
  reactQuery: {
    queryClient: true,
    devtool: umiEnv === 'dev',
  },
  headScripts: [
    // 解决首次加载时白屏的问题
    { src: join(PUBLIC_PATH, 'js/loading.js'), async: true },
  ],
  plugins: [
    '@umijs/max-plugin-openapi',
    '@umijs/request-record',
    join(__dirname, 'plugins/build-assets.ts'),
    join(__dirname, 'plugins/prepare-deploy.ts'),
  ],
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
    // 仅调整构建产物；开发服务保留默认输出和分包方式。
    ...(isBuild
      ? {
          output: {
            filename: 'js/[name].[contenthash:8].js',
            chunkFilename: 'js/[name].[contenthash:8].async.js',
            cssFilename: 'css/[name].[contenthash:8].css',
            cssChunkFilename: 'css/[name].[contenthash:8].css',
          },
          optimization: {
            packageImports: ['@ant-design/icons', '@ant-design/pro-components'],
            splitChunks: {
              js: {
                minChunkSize: 20_000,
                maxChunkCountPerGroup: 40,
                // 限制合并目标大小，不是每个产物文件的硬性上限。
                maxMergeChunkSize: 100_000,
              },
              css: {
                minChunkSize: 10_000,
                maxChunkCountPerGroup: 10,
                maxMergeChunkSize: 100_000,
              },
            },
          },
        }
      : {}),
    reactCompiler: {
      compilationMode: 'infer',
      target: '19',
    },
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
  // 本地开发代理配置
  proxy: proxy[umiEnv as keyof typeof proxy] || proxy.dev,
  phantomDependency: { exclude: [] },
});

if (isBuild && config.outputPath) {
  const outputDirectory = resolve(config.outputPath);
  if (outputDirectory === parse(outputDirectory).root) {
    throw new Error('outputPath 不能设置为磁盘根目录，请使用 dist 等项目产物目录。');
  }
  const relativeOutput = relative(process.cwd(), outputDirectory);
  if (
    !relativeOutput ||
    relativeOutput === '..' ||
    relativeOutput.startsWith(`..${sep}`) ||
    isAbsolute(relativeOutput)
  ) {
    throw new Error('outputPath 必须指向项目内的产物子目录，例如 dist/prod 或 framework。');
  }
}

export default config;
