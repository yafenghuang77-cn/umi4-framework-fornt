/**
 * 本地开发环境的反向代理配置
 * @see https://umijs.org/docs/guides/proxy
 */
const uatProxy = {
  '/api/': {
    target: process.env.UAT_API_PROXY_TARGET || 'http://pre-api.example.com',
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
  },
};

export default {
  dev: uatProxy,
  uat: uatProxy,
  pre: {
    '/api/': {
      target: process.env.PRE_API_PROXY_TARGET || 'http://pre-api.example.com',
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    },
  },
  production: {
    '/api/': {
      target: process.env.PROD_API_PROXY_TARGET || 'http://api.example.com',
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    },
  },
};
