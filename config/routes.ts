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
    name: '首页',
    icon: 'HomeOutlined',
    path: '/welcome',
    component: './Home',
  },
  {
    name: '系统设置',
    icon: 'SettingOutlined',
    path: '/admin',
    routes: [
      { path: '/admin', redirect: '/admin/menus' },
      {
        name: '菜单配置',
        path: '/admin/menus',
        component: './SystemSettings/MenuConfig',
      },
      {
        name: '权限配置',
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
    name: '文件管理',
    icon: 'FolderOpenOutlined',
    path: '/files',
    routes: [
      { path: '/files', redirect: '/files/list' },
      { name: '文件列表', path: '/files/list', component: './Files' },
    ],
  },
  {
    name: '性能统计',
    icon: 'DashboardOutlined',
    path: '/monitoring',
    routes: [
      { path: '/monitoring', redirect: '/monitoring/overview' },
      { name: '统计概览', path: '/monitoring/overview', component: './Monitoring/Overview' },
      { name: '数据查询', path: '/monitoring/query', component: './Monitoring' },
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
