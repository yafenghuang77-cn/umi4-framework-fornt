import { useState } from 'react';

import { history } from '@umijs/max';
import { Button, ConfigProvider, Flex, Layout } from 'antd';

import EditorHeader from './components/EditorHeader';
import styles from './index.less';
import useCanvasContainers from './useCanvasContainers';
import ContentPage from './views/ContentPage';
import LogicPage from './views/LogicPage';
import StylePage from './views/StylePage';

import type { EditorMode } from './types';

export default function SurveyEditorPage() {
  const [title, setTitle] = useState('访谈问卷');
  const [mode, setMode] = useState<EditorMode>('content');
  const back = () => history.push('/welcome');
  const canvasEditor = useCanvasContainers();
  return (
    <ConfigProvider
      variant="outlined"
      theme={{
        token: {
          colorPrimary: '#f43f50',
          fontSize: 13,
          fontSizeLG: 15,
          controlHeight: 30,
          controlHeightLG: 36,
          borderRadius: 5,
        },
        components: {
          Tabs: { horizontalItemPadding: '10px 0' },
          Badge: { indicatorHeight: 19 },
          Tree: { titleHeight: 36 },
        },
      }}
    >
      <Layout className={styles.editor}>
        <EditorHeader title={title} mode={mode} onTitle={setTitle} onMode={setMode} onBack={back} />
        {mode === 'content' ? (
          <ContentPage editor={canvasEditor} />
        ) : mode === 'logic' ? (
          <LogicPage />
        ) : (
          <StylePage />
        )}
        <Layout.Footer className={styles.footer}>
          <Flex justify="space-between" align="center">
            <Button onClick={back}>取 消</Button>
            <Button type="primary" disabled>
              保存并返回
            </Button>
          </Flex>
        </Layout.Footer>
      </Layout>
    </ConfigProvider>
  );
}
