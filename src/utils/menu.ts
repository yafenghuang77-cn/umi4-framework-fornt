import { type MenuNode, type SystemConfig, type SystemMenu } from '@/types/systemConfig';

export function buildMenuTree(menus: SystemMenu[], parentId: string | null = null): MenuNode[] {
  return menus
    .filter((menu) => menu.parentId === parentId)
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, 'zh-CN'))
    .map((menu) => {
      const children = buildMenuTree(menus, menu.id);
      return { ...menu, ...(children.length ? { children } : {}) };
    });
}

export function descendantIds(menus: SystemMenu[], id: string): string[] {
  const ids = new Set([id]);
  let previousSize = 0;
  while (previousSize !== ids.size) {
    previousSize = ids.size;
    menus.forEach((menu) => {
      if (menu.parentId && ids.has(menu.parentId)) {
        ids.add(menu.id);
      }
    });
  }
  return [...ids];
}

/** 多角色取并集；停用角色、停用菜单及停用目录下的页面不计入有效菜单。 */
export function effectiveMenuIds(data: SystemConfig, roleIds: string[]): string[] {
  const blocked = new Set(
    data.menus
      .filter((menu) => !menu.enabled)
      .flatMap((menu) => descendantIds(data.menus, menu.id)),
  );
  return [
    ...new Set(
      data.roles
        .filter((role) => role.enabled && roleIds.includes(role.id))
        .flatMap((role) => role.menuIds),
    ),
  ].filter((id) => !blocked.has(id));
}
