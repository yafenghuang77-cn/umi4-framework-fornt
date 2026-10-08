import { useEffect } from 'react';

import { SettingDrawer } from '@ant-design/pro-components';
import { useDispatch, useLocation, useModel, useSelector } from '@umijs/max';

import { type SettingsRootState } from '@/models/settings';

export default function LayoutSettings() {
  const { pathname } = useLocation();
  const settings = useSelector((state: SettingsRootState) => state.settings);
  const dispatch = useDispatch();
  const { setInitialState } = useModel('@@initialState');

  useEffect(() => {
    // Umi 布局从 initialState 读取配置，将 Dva 中的配置同步给布局。
    setInitialState((state) => ({
      ...state,
      name: state?.name || 'ProUser',
      settings,
    }));
  }, [settings, setInitialState]);

  if (pathname !== '/welcome') {
    return null;
  }

  return (
    <SettingDrawer
      disableUrlParams
      settings={settings}
      onSettingChange={(next) => dispatch({ type: 'settings/update', payload: next })}
    />
  );
}
