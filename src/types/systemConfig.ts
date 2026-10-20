/** 菜单、角色和用户绑定的接口数据类型。 */
export interface SystemMenu {
  id: string;
  parentId: string | null;
  name: string;
  code: string;
  type: 'directory' | 'page';
  path: string;
  icon: string;
  sort: number;
  enabled: boolean;
  visible: boolean;
}

export interface SystemRole {
  id: string;
  name: string;
  code: string;
  description: string;
  enabled: boolean;
  menuIds: string[];
}

export interface SystemUser {
  id: string;
  name: string;
  username: string;
  roleIds: string[];
}

export interface SystemConfig {
  version: 1;
  menus: SystemMenu[];
  roles: SystemRole[];
  users: SystemUser[];
}

export interface MenuNode extends SystemMenu {
  children?: MenuNode[];
}
