// import environment from './env';

/**
 * 本地开发环境的反向代理配置
 * @see https://umijs.org/docs/guides/proxy
 */
export default {
  '/api/': {
    target: 'http://localhost:9000/admin-platform',
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
  },
};
