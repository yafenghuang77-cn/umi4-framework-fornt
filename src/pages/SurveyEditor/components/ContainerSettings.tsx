import { Form, Input, Layout, Tabs } from 'antd';

import styles from '../styles/ContainerSettings.less';

import type { SurveyContainer } from '../types';

interface Props {
  container: SurveyContainer;
  onNameChange: (name: string) => void;
}
export default function ContainerSettings({ container, onNameChange }: Props) {
  const label = container.kind === 'group' ? '题目组名称' : '追问区名称';
  return (
    <Tabs
      className={styles.containerSettingsTabs}
      defaultActiveKey="question"
      items={[
        {
          key: 'question',
          label: '题目设置',
          children: (
            <Form layout="vertical" className={styles.containerSettingsForm}>
              <Form.Item label={label} htmlFor="container-name">
                <Input
                  id="container-name"
                  value={container.title}
                  maxLength={100}
                  onChange={(event) => onNameChange(event.target.value)}
                />
              </Form.Item>
            </Form>
          ),
        },
        {
          key: 'logic',
          label: '逻辑设置',
          children: (
            <Layout.Content
              className={styles.containerLogicPlaceholder}
              role="region"
              aria-label="容器逻辑设置"
            />
          ),
        },
      ]}
    />
  );
}
