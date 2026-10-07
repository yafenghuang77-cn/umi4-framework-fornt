import { Layout } from 'antd';

import styles from '../index.less';

/** Reserved for survey appearance configuration. */
export default function StylePage() {
  return <Layout.Content className={styles.blankPage} role="main" aria-label="样式编辑页" />;
}
