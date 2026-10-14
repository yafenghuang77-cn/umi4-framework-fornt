import environment from './env';

/**
 * 本地开发环境的反向代理配置
 * @see https://umijs.org/docs/guides/proxy
 */
export default {
  '/api/': {
    target: environment.variables.API_PROXY_TARGET,
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
  },
};
