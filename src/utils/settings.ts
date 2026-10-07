import defaultSettings from '../../config/defaultSettings';

export type LayoutSettings = typeof defaultSettings;

const SETTINGS_STORAGE_KEY = 'framework:settings';

/** 与项目默认配置合并，使新增加的配置项也能正常生效。 */
export function loadPersistedSettings(): LayoutSettings {
  if (typeof window === 'undefined') {
    return { ...defaultSettings };
  }

  try {
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    const settings: unknown = stored ? JSON.parse(stored) : null;
    if (typeof settings === 'object' && settings !== null && !Array.isArray(settings)) {
      return { ...defaultSettings, ...(settings as Partial<LayoutSettings>) };
    }
  } catch {
    // 保存的数据损坏或浏览器禁用存储时，使用默认配置。
  }

  return { ...defaultSettings };
}

export function savePersistedSettings(settings: LayoutSettings): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
