import { defineConfig } from '@umijs/max';

export default defineConfig({
  define: {
    'process.env.APP_ENV': 'uat',
    'process.env.API_BASE_URL': process.env.UAT_API_BASE_URL || '/',
  },
});
