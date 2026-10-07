import { Layout } from 'antd';

import QuestionPalette from '../components/QuestionPalette';
import SettingsPanel from '../components/SettingsPanel';
import SurveyCanvas from '../components/SurveyCanvas';
import styles from '../styles/ContentPage.less';

import type { CanvasEditor } from '../useCanvasContainers';

export default function ContentPage({ editor }: { editor: CanvasEditor }) {
  return (
    <Layout className={styles.workspace} role="region" aria-label="内容编辑页">
      <QuestionPalette />
      <SurveyCanvas editor={editor} />
      <SettingsPanel editor={editor} />
    </Layout>
  );
}
