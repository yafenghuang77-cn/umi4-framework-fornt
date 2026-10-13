import { Layout } from 'antd';

import styles from '../styles/SettingsPanel.less';
import ContainerSettings from './ContainerSettings';
import IntroSettings from './IntroSettings';

import type { CanvasEditor } from '../useCanvasContainers';

interface Props {
  editor: CanvasEditor;
}
export default function SettingsPanel({ editor }: Props) {
  const intro = editor.selected?.kind === 'intro' ? editor.selected : undefined;
  return (
    <Layout.Sider
      width="var(--editor-settings-width)"
      theme="light"
      className={styles.settings}
      role="complementary"
      aria-label="设置面板"
    >
      {editor.selected &&
        editor.selected.kind !== 'intro' &&
        editor.selectedTarget === 'container' && (
          <ContainerSettings
            key={editor.selected.id}
            container={editor.selected}
            onNameChange={editor.updateContainerName}
          />
        )}
      {intro && (
        <IntroSettings
          intro={intro}
          target={editor.selectedTarget}
          onNameChange={editor.updateContainerName}
          onChange={editor.updateIntro}
        />
      )}
    </Layout.Sider>
  );
}
