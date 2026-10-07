import { Form, Input, InputNumber, Layout, Typography } from 'antd';

import styles from '../index.less';
import ContainerSettings from './ContainerSettings';

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
        <>
          <Typography.Title level={5} className={styles.introSettingsTitle}>
            引导语设置
          </Typography.Title>
          <Form layout="vertical" className={styles.introSettingsForm}>
            {editor.selectedTarget === 'container' ? (
              <Form.Item label="引导语名称" htmlFor="intro-name">
                <Input
                  id="intro-name"
                  value={intro.title}
                  maxLength={100}
                  onChange={(event) => editor.updateContainerName(event.target.value)}
                />
              </Form.Item>
            ) : (
              <>
                <Form.Item label="引导语文案" htmlFor="intro-copy">
                  <Input.TextArea
                    id="intro-copy"
                    rows={5}
                    value={intro.text}
                    maxLength={1000}
                    showCount
                    onChange={(event) => editor.updateIntro({ text: event.target.value })}
                  />
                </Form.Item>
                <Form.Item label="展示时间(秒)" htmlFor="intro-duration">
                  <InputNumber
                    id="intro-duration"
                    min={1}
                    max={3600}
                    precision={0}
                    value={intro.seconds}
                    onChange={(seconds) => {
                      editor.updateIntro({ seconds: seconds ?? 5 });
                    }}
                    onBlur={() => {
                      if (!intro.seconds) {
                        editor.updateIntro({ seconds: 5 });
                      }
                    }}
                  />
                </Form.Item>
              </>
            )}
          </Form>
        </>
      )}
    </Layout.Sider>
  );
}
