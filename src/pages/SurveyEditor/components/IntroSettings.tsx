import { Form, Input, InputNumber, Typography } from 'antd';

import styles from '../styles/SettingsPanel.less';

import type { SurveyContainer } from '@/types/survey';

interface Props {
  intro: SurveyContainer;
  target: 'container' | 'intro';
  onNameChange: (name: string) => void;
  onChange: (patch: Pick<SurveyContainer, 'text'> | Pick<SurveyContainer, 'seconds'>) => void;
}
export default function IntroSettings({ intro, target, onNameChange, onChange }: Props) {
  return (
    <>
      <Typography.Title level={5} className={styles.introSettingsTitle}>
        引导语设置
      </Typography.Title>
      <Form layout="vertical" className={styles.introSettingsForm}>
        {target === 'container' ? (
          <Form.Item label="引导语名称" htmlFor="intro-name">
            <Input
              id="intro-name"
              value={intro.title}
              maxLength={100}
              onChange={(event) => onNameChange(event.target.value)}
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
                onChange={(event) => onChange({ text: event.target.value })}
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
                  onChange({ seconds: seconds ?? 5 });
                }}
                onBlur={() => {
                  if (!intro.seconds) {
                    onChange({ seconds: 5 });
                  }
                }}
              />
            </Form.Item>
          </>
        )}
      </Form>
    </>
  );
}
