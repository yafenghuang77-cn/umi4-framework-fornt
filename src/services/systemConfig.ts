import { request } from '@umijs/max';

import { type SystemConfig, type SystemMenu, type SystemRole } from '@/types/systemConfig';

const ROOT = '/api/system';
const options = { skipErrorHandler: true };

export function getSystemConfig() {
  return request<SystemConfig>(`${ROOT}/config`, options);
}

export function submitMenu(menu: SystemMenu, exists: boolean) {
  return request<SystemConfig>(`${ROOT}/menus${exists ? `/${encodeURIComponent(menu.id)}` : ''}`, {
    ...options,
    method: exists ? 'PUT' : 'POST',
    data: menu,
  });
}

export function removeMenu(id: string) {
  return request<SystemConfig>(`${ROOT}/menus/${encodeURIComponent(id)}`, {
    ...options,
    method: 'DELETE',
  });
}

export function submitRole(role: SystemRole, exists: boolean) {
  return request<SystemConfig>(`${ROOT}/roles${exists ? `/${encodeURIComponent(role.id)}` : ''}`, {
    ...options,
    method: exists ? 'PUT' : 'POST',
    data: role,
  });
}

export function removeRole(id: string) {
  return request<SystemConfig>(`${ROOT}/roles/${encodeURIComponent(id)}`, {
    ...options,
    method: 'DELETE',
  });
}

export function updateUserRoles(id: string, roleIds: string[]) {
  return request<SystemConfig>(`${ROOT}/users/${encodeURIComponent(id)}/roles`, {
    ...options,
    method: 'PUT',
    data: { roleIds },
  });
}
