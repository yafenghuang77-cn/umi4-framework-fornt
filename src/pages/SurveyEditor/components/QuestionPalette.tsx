import { useState } from 'react';

import { AppstoreFilled, BookFilled } from '@ant-design/icons';
import { Button, Divider, Flex, Layout, Tabs, Typography } from 'antd';

import { containerKindByType } from '../catalogAdapter';
import styles from '../index.less';
import { containerComponents } from '../questionCatalog';
import { DRAG_KEY } from '../schema';
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
            <Flex vertical gap={8} className={styles.containerPalette}>
              {containerComponents.map((item) => (
                <Button
                  key={item.key}
                  className={styles[containerKindByType[item.type]]}
                  block
                  icon={
                    <span className={styles.containerIcon} aria-hidden="true">
                      {item.icon}
                    </span>
                  }
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      DRAG_KEY,
                      JSON.stringify({ type: 'container', kind: containerKindByType[item.type] }),
                    );
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  title="拖拽容器组件"
                >
                  {item.label}
                </Button>
              ))}
            </Flex>
          </>
        )}
      </Flex>
    </Layout.Sider>
  );
}
