// @dva-model
import { type DvaModel } from '@umijs/max';
import { notification } from 'antd';

import { type Brand, brands } from '@/constants/brands';
import { loadPersistedBrand, savePersistedBrand } from '@/utils/brand';

export interface BrandState {
  current: Brand;
  list: Brand[];
}

export interface BrandRootState {
  brand: BrandState;
}

interface BrandAction<T> {
  type: string;
  payload?: T;
}

const initialState: BrandState = {
  current: loadPersistedBrand(),
  list: [...brands],
};

const brandModel: DvaModel<BrandState> = {
  namespace: 'brand',
  state: initialState,
  reducers: {
    setCurrent(state = initialState, { payload }: BrandAction<Brand>) {
      return payload ? { ...state, current: payload } : state;
    },
  },
  effects: {
    *switchBrand({ payload }: BrandAction<string>, { call, put, select }) {
      const current: Brand = yield select((state: BrandRootState) => state.brand.current);
      const nextBrand = brands.find((brand) => brand.id === payload);
      if (!nextBrand || nextBrand.id === current.id) {
        return;
      }

      const saved: boolean = yield call(savePersistedBrand, nextBrand);
      if (!saved) {
        notification.error({
          message: '品牌切换失败',
          description: '无法保存品牌选择，请检查浏览器存储设置后重试。',
        });
        return;
      }

      yield put({ type: 'setCurrent', payload: nextBrand });
      // 持久化成功后刷新当前地址，新页面从本地恢复品牌到 Dva。
      if (typeof window !== 'undefined') {
        yield call(() => window.location.reload());
      }
    },
  },
};

export default brandModel;
