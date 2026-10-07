import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import {
  DownOutlined,
  GlobalOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  history,
  type RunTimeLayoutConfig,
  type RuntimeReactQueryType,
  SelectLang,
} from '@umijs/max';
import { Avatar, Dropdown } from 'antd';

import BrandSwitcher from '@/components/BrandSwitcher';
import LayoutSettings from '@/components/LayoutSettings';
import NetworkStatus from '@/components/NetworkStatus';
import { redirectToLogin, requestConfig } from '@/utils/request';
import { removeToken } from '@/utils/request/token';
import { retryTimedOutQuery } from '@/utils/requestRetry';
import { loadPersistedSettings } from '@/utils/settings';

export const request = requestConfig;

export const reactQuery: RuntimeReactQueryType = {
  queryClient: {
    defaultOptions: {
      queries: {
        // 新鲜期内复用缓存；无人订阅的缓存保留 5 分钟。
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        // 重新挂载或恢复网络时，仅刷新已过期的查询。
        refetchOnMount: true,
        refetchOnReconnect: true,
        // 仅超时自动重试，最多额外请求 5 次。
        retry: retryTimedOutQuery,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30 * 1000),
      },
      mutations: {
        // 避免新增、更新等提交因自动重试而重复执行。
        retry: false,
      },
    },
  },
};

export function rootContainer(container: ReactNode) {
  return (
    <>
      <NetworkStatus />
      {container}
    </>
  );
}

export async function getInitialState() {
  return { name: 'ProUser', settings: loadPersistedSettings() };
}

export const layout: RunTimeLayoutConfig = ({ initialState }) => ({
  ...initialState?.settings,
  logo: '/framework/logo.svg',
  menu: { locale: false, defaultOpenAll: false },
  avatarProps: {
    icon: <UserOutlined />,
    style: { backgroundColor: '#e6f4ff', color: '#1677ff' },
    title: initialState?.name || 'ProUser',
    size: 'small',
    render: () => (
      <Dropdown
        trigger={['click']}
        menu={{
          items: [
            {
              key: '/account/center',
              icon: <UserOutlined />,
              label: '个人中心',
            },
            {
              key: '/account/settings',
              icon: <SettingOutlined />,
              label: '个人设置',
            },
            { type: 'divider' },
            {
              key: 'logout',
              icon: <LogoutOutlined />,
              label: '退出登录',
              danger: true,
            },
          ],
          onClick: ({ key }) => {
            if (key === 'logout') {
              removeToken();
              redirectToLogin();
              return;
            }

            history.push(key);
          },
        }}
      >
        <button type="button" className="header-avatar" aria-label="用户菜单">
          <Avatar size={26} icon={<UserOutlined />} className="header-user-icon" />
          <span className="header-user-name">{initialState?.name || 'ProUser'}</span>
          <DownOutlined className="header-user-chevron" aria-hidden="true" />
        </button>
      </Dropdown>
    ),
  },
  actionsRender: () => [
    <BrandSwitcher key="brand" />,
    <SelectLang
      key="language"
      icon={<GlobalOutlined />}
      globalIconClassName="header-language"
      style={{ fontSize: 16, padding: 0 }}
    />,
  ],
  childrenRender: (children) => (
    <>
      <div className="workspace-page">{children}</div>
      {typeof document !== 'undefined' && createPortal(<LayoutSettings />, document.body)}
    </>
  ),
});
