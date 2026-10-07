import type { ProLayoutProps, ProSettings } from '@ant-design/pro-components';

/**
 * @name
 */
const Settings: ProSettings &
  Pick<ProLayoutProps, 'siderWidth' | 'splitMenus' | 'token'> & {
    logo?: string;
  } = {
  navTheme: 'light',
  colorPrimary: '#1677ff',
  layout: 'mix',
  contentWidth: 'Fluid',
  fixedHeader: true,
  fixSiderbar: true,
  splitMenus: false,
  siderWidth: 256,
  colorWeak: false,
  title: 'Ant Design Pro 管理系统模版',
  logo: '/framework/logo.svg',
  iconfontUrl: '',
  token: {
    // 参见ts声明，demo 见文档，通过token 修改样式
    //https://procomponents.ant.design/components/layout#%E9%80%9A%E8%BF%87-token-%E4%BF%AE%E6%94%B9%E6%A0%B7%E5%BC%8F
  },
};

export default Settings;
