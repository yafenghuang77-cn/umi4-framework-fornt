import routes from '../../../../config/routes';

interface PageRoute {
  path: string;
  name?: string;
  hideInMenu?: boolean;
  routes?: PageRoute[];
}

/** 页面路径输入框的候选项，不包含重定向、隐藏路由和目录。 */
function collectPages(items: PageRoute[]): Array<{ label: string; value: string }> {
  return items.flatMap((route) => {
    if (!route.name || route.hideInMenu) {
      return [];
    }
    return route.routes
      ? collectPages(route.routes)
      : [{ label: `${route.name} · ${route.path}`, value: route.path }];
  });
}

export const availablePages = collectPages(routes);
