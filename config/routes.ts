export default [
  {
    name: '登录',
    path: '/user/login',
    component: './Login',
    layout: false,
    hideInMenu: true,
  },
  { path: '/', redirect: '/welcome' },
  {
    name: '问卷编辑器',
    icon: 'FormOutlined',
    path: '/survey/editor',
    component: './SurveyEditor',
    layout: false,
  },
  {
    name: '首页',
    icon: 'HomeOutlined',
    path: '/welcome',
    component: './Home',
  },
  {
    name: '系统管理',
    icon: 'SettingOutlined',
    path: '/admin',
    routes: [
      { path: '/admin', redirect: '/admin/permissions' },
      {
        name: '权限管理',
        path: '/admin/permissions',
        component: './Permissions',
      },
      {
        name: '配置管理',
        path: '/admin/settings',
        routes: [
          { path: '/admin/settings', redirect: '/admin/settings/basic' },
          {
            name: '基础配置',
            path: '/admin/settings/basic',
            component: './Placeholder',
          },
          {
            name: '通知配置',
            path: '/admin/settings/notifications',
            component: './Placeholder',
          },
        ],
      },
    ],
  },
  {
    name: '用户管理',
    icon: 'TeamOutlined',
    path: '/users',
    routes: [
      { path: '/users', redirect: '/users/accounts' },
      { name: '用户账号', path: '/users/accounts', component: './Users' },
      { name: '用户分组', path: '/users/groups', component: './Placeholder' },
    ],
  },
  {
    name: '个人中心',
    path: '/account/center',
    component: './Placeholder',
    hideInMenu: true,
    layout: false,
  },
  {
    name: '个人设置',
    path: '/account/settings',
    component: './Placeholder',
    hideInMenu: true,
    layout: false,
  },
  { path: '*', component: './NotFound', hideInMenu: true },
];
