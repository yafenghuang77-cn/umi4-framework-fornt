import { useCallback, useRef, useState } from 'react';

import {
  getSystemConfig,
  removeMenu,
  removeRole,
  submitMenu,
  submitRole,
  updateUserRoles,
} from '@/services/systemConfig';
import { type SystemConfig, type SystemMenu, type SystemRole } from '@/types/systemConfig';

const emptyConfig: SystemConfig = { version: 1, menus: [], roles: [], users: [] };

export default function useSystemConfig() {
  const [data, setData] = useState<SystemConfig>(emptyConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const mutation = useRef(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      setData(await getSystemConfig());
    } catch {
      setError('配置加载失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  async function mutate(operation: () => Promise<SystemConfig>) {
    if (mutation.current) {
      throw new Error('正在保存配置，请稍后再试');
    }
    mutation.current = true;
    setSaving(true);
    try {
      setData(await operation());
    } finally {
      mutation.current = false;
      setSaving(false);
    }
  }

  return {
    ...data,
    error,
    loading,
    saving,
    refresh,
    saveMenu: (menu: SystemMenu) =>
      mutate(() =>
        submitMenu(
          menu,
          data.menus.some((item) => item.id === menu.id),
        ),
      ),
    deleteMenu: (id: string) => mutate(() => removeMenu(id)),
    saveRole: (role: SystemRole) =>
      mutate(() =>
        submitRole(
          role,
          data.roles.some((item) => item.id === role.id),
        ),
      ),
    deleteRole: (id: string) => mutate(() => removeRole(id)),
    bindRoles: (userId: string, roleIds: string[]) =>
      mutate(() => updateUserRoles(userId, roleIds)),
  };
}
