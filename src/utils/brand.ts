import { type Brand, brands } from '@/constants/brands';

const BRAND_STORAGE_KEY = 'framework:brand';

/** 配置变更或保存的品牌不存在时，回退到默认品牌。 */
export function loadPersistedBrand(): Brand {
  if (typeof window === 'undefined') {
    return brands[0];
  }

  try {
    const stored = window.localStorage.getItem(BRAND_STORAGE_KEY);
    let id: unknown = stored;
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored);
        if (typeof parsed === 'object' && parsed !== null && 'id' in parsed) {
          id = parsed.id;
        }
      } catch {
        // 兼容原先只保存品牌 id 的格式。
      }
    }

    // 以当前配置为准，避免恢复已失效的名称或 Logo 地址。
    return brands.find((brand) => brand.id === id) ?? brands[0];
  } catch {
    return brands[0];
  }
}

export function savePersistedBrand(brand: Brand): boolean {
  if (typeof window === 'undefined' || !brands.some((item) => item.id === brand.id)) {
    return false;
  }

  try {
    window.localStorage.setItem(BRAND_STORAGE_KEY, JSON.stringify(brand));
    return true;
  } catch {
    // 未保存成功时不能刷新，否则新页面会恢复为之前的品牌。
    return false;
  }
}
