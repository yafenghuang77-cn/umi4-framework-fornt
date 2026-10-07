/**
 * 本地开发环境的反向代理配置
 * @see https://umijs.org/docs/guides/proxy
 */
export default {
  dev: {
    '/api/': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    },
  },
  uat: {
    '/api/': {
      target: 'http://pre-api.example.com',
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    },
  },
  pre: {
    '/api/': {
      target: 'http://pre-api.example.com',
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    },
  },
  production: {
    '/api/': {
      target: 'http://api.example.com',
      changeOrigin: true,
      pathRewrite: { '^/api': '' },
    },
  },
};
