import { defineConfig } from '@umijs/max';

import uatConfig from './config.uat';

/** 本地开发复用 UAT 配置，仅区分环境标识。 */
export default defineConfig({
  ...uatConfig,
  define: {
    ...uatConfig.define,
    'process.env.APP_ENV': 'dev',
  },
});
