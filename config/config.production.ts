import { defineConfig } from '@umijs/max';

export default defineConfig({
  define: {
    'process.env.APP_ENV': 'prod',
    'process.env.API_BASE_URL': process.env.PROD_API_BASE_URL || '/',
  },
});
