import { useState } from 'react';

import { AppstoreFilled, BookFilled } from '@ant-design/icons';
import { Divider, Flex, Layout, Tabs, Typography } from 'antd';

import styles from '../styles/QuestionPalette.less';
import ContainerPalette from './ContainerPalette';
import QuestionBankPanel from './QuestionBank';
import QuestionTypeTree from './QuestionTypeTree';

export default function QuestionPalette() {
  const [tab, setTab] = useState('types');
  return (
    <Layout.Sider
      width="var(--editor-palette-width)"
      theme="light"
      className={styles.palette}
      role="complementary"
      aria-label="题型面板"
    >
      <Tabs
        className={styles.paletteTabs}
        activeKey={tab}
        onChange={setTab}
        centered
        items={[
          { key: 'types', label: '题型', icon: <AppstoreFilled /> },
          { key: 'bank', label: '题库', icon: <BookFilled /> },
        ]}
      />
      <Flex vertical className={tab === 'bank' ? styles.bankBody : styles.paletteBody}>
        {tab === 'bank' ? (
          <QuestionBankPanel />
        ) : (
          <>
            <Typography.Title level={5}>题型列表</Typography.Title>
            <QuestionTypeTree />
            <Divider />
            <Typography.Title level={5}>容器组件</Typography.Title>
            <ContainerPalette />
          </>
        )}
      </Flex>
    </Layout.Sider>
  );
}
