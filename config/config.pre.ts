import { defineConfig } from '@umijs/max';

export default defineConfig({
  define: {
    'process.env.APP_ENV': 'pre',
    'process.env.API_BASE_URL': process.env.PRE_API_BASE_URL || '/',
  },
});
