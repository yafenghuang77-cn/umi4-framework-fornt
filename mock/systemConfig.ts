import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import routes from '../config/routes';
import { type SystemConfig, type SystemMenu } from '../src/types/systemConfig';
import { descendantIds } from '../src/utils/menu';

const menuSchema = z.object({
  id: z.string().min(1),
  parentId: z.string().nullable(),
  name: z.string().trim().min(1).max(30),
  code: z
    .string()
    .regex(/^[a-zA-Z][a-zA-Z0-9:_-]*$/)
    .max(80),
  type: z.enum(['directory', 'page']),
  path: z.string(),
  icon: z.string(),
  sort: z.number().int().min(0).max(9999),
  enabled: z.boolean(),
  visible: z.boolean(),
});
const roleSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(30),
  code: z
    .string()
    .regex(/^[a-zA-Z][a-zA-Z0-9:_-]*$/)
    .max(80),
  description: z.string().max(200),
  enabled: z.boolean(),
  menuIds: z.array(z.string()),
});
const userSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  username: z.string(),
  roleIds: z.array(z.string()),
});
const configSchema = z.object({
  version: z.literal(1),
  menus: z.array(menuSchema),
  roles: z.array(roleSchema),
  users: z.array(userSchema),
}) satisfies z.ZodType<SystemConfig>;

interface MenuRoute {
  path: string;
  name?: string;
  icon?: string;
  hideInMenu?: boolean;
  routes?: MenuRoute[];
}

function menusFromRoutes(items: MenuRoute[], parentId: string | null = null): SystemMenu[] {
  return items.flatMap((route, index) => {
    if (!route.name || route.hideInMenu) {
      return [];
    }
    const menu: SystemMenu = {
      id: route.path,
      parentId,
      name: route.name,
      code: route.path.slice(1).replaceAll('/', ':'),
      type: route.routes ? 'directory' : 'page',
      path: route.routes ? '' : route.path,
      icon: route.icon || '',
      sort: (index + 1) * 10,
      enabled: true,
      visible: true,
    };
    return [menu, ...menusFromRoutes(route.routes || [], menu.id)];
  });
}

export function validateMenu(menu: SystemMenu, menus: SystemMenu[]): string | undefined {
  if (menus.some((item) => item.id !== menu.id && item.code === menu.code)) {
    return '菜单标识已存在，请使用其他标识';
  }
  if (menu.parentId) {
    const parent = menus.find((item) => item.id === menu.parentId);
    if (!parent || parent.type !== 'directory') {
      return '上级菜单必须是有效目录';
    }
    if (descendantIds(menus, menu.id).includes(menu.parentId)) {
      return '不能将菜单移动到自身或其下级目录';
    }
  }
  if (menu.type === 'page') {
    if (menus.some((item) => item.parentId === menu.id)) {
      return '此目录包含下级菜单，不能改为页面';
    }
    if (!/^\/(?!\/)[a-zA-Z0-9/_:.-]+$/.test(menu.path)) {
      return '请输入以 / 开头的有效页面路径';
    }
    if (
      menus.some((item) => item.id !== menu.id && item.type === 'page' && item.path === menu.path)
    ) {
      return '该页面已绑定其他菜单';
    }
  }
  return undefined;
}

export function validateConfig(data: SystemConfig) {
  for (const items of [data.menus, data.roles, data.users]) {
    if (new Set(items.map((item) => item.id)).size !== items.length) {
      throw new Error('配置中存在重复记录');
    }
  }
  for (const menu of data.menus) {
    const error = validateMenu(menu, data.menus);
    if (error) {
      throw new Error(error);
    }
  }
  if (new Set(data.roles.map((role) => role.code)).size !== data.roles.length) {
    throw new Error('角色标识不能重复');
  }
  const pageIds = new Set(data.menus.filter((menu) => menu.type === 'page').map((menu) => menu.id));
  const roleIds = new Set(data.roles.map((role) => role.id));
  if (
    data.roles.some((role) => role.menuIds.some((id) => !pageIds.has(id))) ||
    data.users.some((user) => user.roleIds.some((id) => !roleIds.has(id)))
  ) {
    throw new Error('配置中存在无效的菜单或角色关联');
  }
}

function defaultConfig(): SystemConfig {
  const menus = menusFromRoutes(routes);
  const pageIds = menus.filter((menu) => menu.type === 'page').map((menu) => menu.id);
  return {
    version: 1,
    menus,
    roles: [
      {
        id: 'role-admin',
        name: '系统管理员',
        code: 'system_admin',
        description: '维护系统配置、用户和业务菜单。',
        enabled: true,
        menuIds: pageIds,
      },
      {
        id: 'role-operator',
        name: '业务操作员',
        code: 'operator',
        description: '访问用户账号和文件等日常业务页面。',
        enabled: true,
        menuIds: ['/welcome', '/users/accounts', '/files/list'],
      },
      {
        id: 'role-viewer',
        name: '数据查看员',
        code: 'viewer',
        description: '查看首页和性能统计。',
        enabled: true,
        menuIds: ['/welcome', '/monitoring/overview', '/monitoring/query'],
      },
    ],
    users: [
      { id: 'demo-admin', name: '张三', username: 'demo.admin', roleIds: ['role-admin'] },
      {
        id: 'demo-operator',
        name: '李四',
        username: 'demo.operator',
        roleIds: ['role-operator'],
      },
      {
        id: 'demo-viewer',
        name: '王五',
        username: 'demo.viewer',
        roleIds: ['role-viewer'],
      },
    ],
  };
}

// Mock 数据仅在开发服务内存中保存，重启开发服务后恢复初始值。
let config = defaultConfig();

interface MockRequest {
  body: unknown;
  params: Record<string, string>;
}
interface MockResponse {
  status: (code: number) => MockResponse;
  json: (value: unknown) => void;
}

function update(change: (next: SystemConfig, req: MockRequest) => void) {
  return (req: MockRequest, res: MockResponse) => {
    try {
      const next = structuredClone(config);
      change(next, req);
      const parsed = configSchema.parse(next);
      validateConfig(parsed);
      config = parsed;
      res.json({ success: true, data: config });
    } catch (error) {
      res
        .status(400)
        .json({ success: false, message: error instanceof Error ? error.message : '配置保存失败' });
    }
  };
}

const saveMenu = update((next, req) => {
  const menu = configSchema.shape.menus.element.parse(req.body);
  if (req.params.id) {
    if (!next.menus.some((item) => item.id === req.params.id) || menu.id !== req.params.id) {
      throw new Error('菜单不存在，请刷新后重试');
    }
  } else {
    menu.id = randomUUID();
  }
  if (menu.type === 'directory' && next.roles.some((role) => role.menuIds.includes(menu.id))) {
    throw new Error('此页面已被角色绑定，请先解除绑定再改为目录');
  }
  next.menus = [...next.menus.filter((item) => item.id !== menu.id), menu];
});

const saveRole = update((next, req) => {
  const role = configSchema.shape.roles.element.parse(req.body);
  if (req.params.id) {
    if (!next.roles.some((item) => item.id === req.params.id) || role.id !== req.params.id) {
      throw new Error('角色不存在，请刷新后重试');
    }
  } else {
    role.id = randomUUID();
  }
  next.roles = [...next.roles.filter((item) => item.id !== role.id), role];
});

export default {
  'GET /api/system/config': (_req: MockRequest, res: MockResponse) => {
    res.json({ success: true, data: config });
  },
  'POST /api/system/menus': saveMenu,
  'PUT /api/system/menus/:id': saveMenu,
  'DELETE /api/system/menus/:id': update((next, req) => {
    if (!next.menus.some((menu) => menu.id === req.params.id)) {
      throw new Error('菜单不存在，请刷新后重试');
    }
    if (next.menus.some((menu) => menu.parentId === req.params.id)) {
      throw new Error('请先移除下级菜单');
    }
    if (next.roles.some((role) => role.menuIds.includes(req.params.id))) {
      throw new Error('此菜单已被角色绑定，请先在权限配置中解除绑定');
    }
    next.menus = next.menus.filter((menu) => menu.id !== req.params.id);
  }),
  'POST /api/system/roles': saveRole,
  'PUT /api/system/roles/:id': saveRole,
  'DELETE /api/system/roles/:id': update((next, req) => {
    if (!next.roles.some((role) => role.id === req.params.id)) {
      throw new Error('角色不存在，请刷新后重试');
    }
    if (next.users.some((user) => user.roleIds.includes(req.params.id))) {
      throw new Error('此角色已绑定用户，请先解除用户关联');
    }
    next.roles = next.roles.filter((role) => role.id !== req.params.id);
  }),
  'PUT /api/system/users/:id/roles': update((next, req) => {
    const user = next.users.find((item) => item.id === req.params.id);
    if (!user) {
      throw new Error('用户不存在，请刷新后重试');
    }
    const body = configSchema.shape.users.element.pick({ roleIds: true }).parse(req.body);
    user.roleIds = [...new Set(body.roleIds)];
  }),
};
