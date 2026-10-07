import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { BookOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { SettingDrawer } from '@ant-design/pro-components';
import {
  history,
  type RequestConfig,
  type RunTimeLayoutConfig,
  type RuntimeReactQueryType,
  SelectLang,
} from '@umijs/max';
import { Dropdown, Tooltip } from 'antd';

import NetworkStatus from '@/components/NetworkStatus';
import { retryTimedOutQuery } from '@/utils/requestRetry';

import defaultSettings from '../config/defaultSettings';

export const request: RequestConfig = {
  baseURL: process.env.API_BASE_URL,
  timeout: 5 * 1000,
};

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
  return { name: 'ProUser', settings: defaultSettings };
}

export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => ({
  ...initialState?.settings,
  logo: '/framework/logo.svg',
  menu: { locale: false, defaultOpenAll: false },
  avatarProps: {
    icon: <UserOutlined />,
    style: { backgroundColor: '#e6f4ff', color: '#1677ff' },
    title: initialState?.name || 'ProUser',
    size: 'small',
    render: (_, avatar) => (
      <Dropdown
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
          ],
          onClick: ({ key }) => history.push(key),
        }}
      >
        <button type="button" className="header-avatar" aria-label="用户菜单">
          {avatar}
        </button>
      </Dropdown>
    ),
  },
  actionsRender: () => [
    <Tooltip key="docs" title="使用文档">
      <a
        className="header-action"
        href="https://pro.ant.design/docs/getting-started"
        target="_blank"
        rel="noreferrer"
        aria-label="使用文档"
      >
        <BookOutlined />
      </a>
    </Tooltip>,
    <SelectLang key="language" />,
  ],
  childrenRender: (children) => (
    <>
      <div className="workspace-page">{children}</div>
      {typeof document !== 'undefined' &&
        createPortal(
          <SettingDrawer
            disableUrlParams
            settings={initialState?.settings}
            onSettingChange={(settings) =>
              setInitialState((state) => ({
                ...state,
                name: state?.name || 'ProUser',
                settings: {
                  ...defaultSettings,
                  ...state?.settings,
                  ...settings,
                },
              }))
            }
          />,
          document.body,
        )}
    </>
  ),
});
