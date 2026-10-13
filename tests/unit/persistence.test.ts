import { brands } from '@constants/brands';
import defaultSettings from '@root/config/defaultSettings';
import { loadPersistedBrand, savePersistedBrand } from '@utils/brand';
import { loadPersistedSettings, savePersistedSettings } from '@utils/settings';

describe('品牌持久化', () => {
  test('兼容旧品牌 id，按当前品牌配置恢复名称与图片', () => {
    window.localStorage.setItem('framework:brand', brands[1].id);
    expect(loadPersistedBrand()).toEqual(brands[1]);
    window.localStorage.setItem(
      'framework:brand',
      JSON.stringify({ id: brands[1].id, name: '旧名称', logo: 'old.svg' }),
    );
    expect(loadPersistedBrand()).toEqual(brands[1]);
  });

  test('品牌已删除或存储数据损坏时回退默认品牌', () => {
    window.localStorage.setItem('framework:brand', JSON.stringify({ id: 'removed' }));
    expect(loadPersistedBrand()).toEqual(brands[0]);
    window.localStorage.setItem('framework:brand', '{broken');
    expect(loadPersistedBrand()).toEqual(brands[0]);
  });

  test('保存并恢复有效品牌，拒绝未知品牌', () => {
    expect(savePersistedBrand(brands[1])).toBe(true);
    expect(loadPersistedBrand()).toEqual(brands[1]);
    expect(savePersistedBrand({ id: 'unknown', name: '未知品牌' })).toBe(false);
    expect(loadPersistedBrand()).toEqual(brands[1]);
  });
});

describe('布局配置持久化', () => {
  test('恢复用户选择，并保留新增配置的默认值', () => {
    window.localStorage.setItem('framework:settings', JSON.stringify({ colorPrimary: '#52c41a' }));
    expect(loadPersistedSettings()).toEqual({ ...defaultSettings, colorPrimary: '#52c41a' });
  });

  test.each(['{broken', 'null', '[]'])('非法配置 %s 回退默认值', (stored) => {
    window.localStorage.setItem('framework:settings', stored);
    expect(loadPersistedSettings()).toEqual(defaultSettings);
  });

  test('浏览器拒绝存储时返回失败，读取时仍提供默认配置', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('存储不可用', 'SecurityError');
    });
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('存储不可用', 'SecurityError');
    });
    expect(savePersistedSettings(defaultSettings)).toBe(false);
    expect(savePersistedBrand(brands[1])).toBe(false);
    expect(loadPersistedSettings()).toEqual(defaultSettings);
    expect(loadPersistedBrand()).toEqual(brands[0]);
  });
});
