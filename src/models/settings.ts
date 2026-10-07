// @dva-model
import { type DvaModel } from '@umijs/max';
import { notification } from 'antd';

import {
  type LayoutSettings,
  loadPersistedSettings,
  savePersistedSettings,
} from '@/utils/settings';

export interface SettingsRootState {
  settings: LayoutSettings;
}

interface SettingsAction {
  type: string;
  payload?: Partial<LayoutSettings>;
}

const initialState = loadPersistedSettings();

const settingsModel: DvaModel<LayoutSettings> = {
  namespace: 'settings',
  state: initialState,
  reducers: {
    setSettings(state = initialState, { payload }: SettingsAction) {
      return payload ? { ...state, ...payload } : state;
    },
  },
  effects: {
    *update({ payload }: SettingsAction, { call, put, select }) {
      if (!payload) {
        return;
      }

      const current: LayoutSettings = yield select((state: SettingsRootState) => state.settings);
      const next = { ...current, ...payload };
      if (JSON.stringify(current) === JSON.stringify(next)) {
        return;
      }

      const saved: boolean = yield call(savePersistedSettings, next);
      if (!saved) {
        notification.error({
          message: '风格设置保存失败',
          description: '无法保存配置，请检查浏览器存储设置后重试。',
        });
        return;
      }

      yield put({ type: 'setSettings', payload: next });
    },
  },
};

export default settingsModel;
