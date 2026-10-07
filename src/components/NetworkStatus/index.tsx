import { useEffect } from 'react';

import { onlineManager } from '@tanstack/react-query';
import { notification } from 'antd';

const NETWORK_NOTIFICATION_KEY = 'global-network-status';

export default function NetworkStatus() {
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    let previousOnline: boolean | undefined;

    const updateStatus = (isOnline: boolean) => {
      if (previousOnline === isOnline) {
        return;
      }

      const wasOffline = previousOnline === false;
      previousOnline = isOnline;

      if (!isOnline) {
        api.warning({
          key: NETWORK_NOTIFICATION_KEY,
          title: '网络连接已断开',
          description: '请检查网络连接，恢复后将自动继续获取数据。',
          duration: 0,
          placement: 'topRight',
          role: 'alert',
        });
      } else if (wasOffline) {
        api.success({
          key: NETWORK_NOTIFICATION_KEY,
          title: '网络连接已恢复',
          description: '您可以继续操作。',
          duration: 3,
          placement: 'topRight',
          role: 'status',
        });
      }
    };

    const unsubscribe = onlineManager.subscribe(updateStatus);

    // onlineManager 默认假设在线，补充首次打开页面就已离线的情况。
    if (!navigator.onLine) {
      onlineManager.setOnline(false);
    }
    updateStatus(onlineManager.isOnline());

    return () => {
      unsubscribe();
      api.destroy(NETWORK_NOTIFICATION_KEY);
    };
  }, [api]);

  return contextHolder;
}
