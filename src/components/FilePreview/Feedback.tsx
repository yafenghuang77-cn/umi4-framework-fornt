import { Alert, Spin } from 'antd';

import styles from './index.less';

export function PreviewLoading() {
  return (
    <div className={styles.feedback} role="status">
      <Spin />
      <span>正在加载预览…</span>
    </div>
  );
}

export function PreviewError({ message }: { message: string }) {
  return <Alert type="error" showIcon title="无法预览此文件" description={message} />;
}
