import { createPortal } from 'react-dom';

import { BookOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { SettingDrawer } from '@ant-design/pro-components';
import { history, type RunTimeLayoutConfig, SelectLang } from '@umijs/max';
import { Dropdown, Tooltip } from 'antd';

import defaultSettings from '../config/defaultSettings';

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
