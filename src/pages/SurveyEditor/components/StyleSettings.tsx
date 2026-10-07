import { Button, Col, Flex, Form, Row, Select, Switch } from 'antd';

import {
  backgroundColors,
  buttonRadius,
  fontFamilyOptions,
  fontSizeOptions,
  themeColors,
} from '../appearance';
import styles from '../styles/StyleSettings.less';

import type { SurveyAppearance } from '../appearance';

interface Props {
  value: SurveyAppearance;
  onChange: (value: SurveyAppearance) => void;
}

export default function StyleSettings({ value, onChange }: Props) {
  const update = (patch: Partial<SurveyAppearance>) => onChange({ ...value, ...patch });
  return (
    <section className={styles.styleSettings} aria-label="样式配置">
      <Form layout="vertical" className={styles.appearanceForm}>
        {(
          [
            ['主题颜色', 'themeColor', themeColors],
            ['背景颜色', 'backgroundColor', backgroundColors],
          ] as const
        ).map(([label, field, colors]) => (
          <section key={field} className={styles.appearanceSection} aria-label={label}>
            <h3>{label}</h3>
            <Flex gap={12} wrap role="group" aria-label={label}>
              {colors.map((color) => (
                <Button
                  key={color.value}
                  className={styles.colorSwatch}
                  aria-label={`${label}：${color.label}`}
                  aria-pressed={value[field] === color.value}
                  title={color.label}
                  style={{ backgroundColor: color.value }}
                  onClick={() => update({ [field]: color.value })}
                />
              ))}
            </Flex>
          </section>
        ))}
        <section className={styles.appearanceSection}>
          <h3>字体设置</h3>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="字体">
                <Select
                  aria-label="字体"
                  value={value.fontFamily}
                  onChange={(fontFamily) => update({ fontFamily })}
                  options={fontFamilyOptions}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="字号">
                <Select
                  aria-label="字号"
                  value={value.fontSize}
                  onChange={(fontSize) => update({ fontSize })}
                  options={fontSizeOptions}
                />
              </Form.Item>
            </Col>
          </Row>
        </section>
        <section className={styles.appearanceSection}>
          <h3>按钮样式</h3>
          <Flex gap={12} wrap role="group" aria-label="按钮样式">
            {(
              [
                ['rounded', '圆角'],
                ['square', '方形'],
                ['pill', '胶囊'],
              ] as const
            ).map(([shape, label]) => (
              <Button
                key={shape}
                type="primary"
                className={styles.shapeButton}
                aria-label={label}
                aria-pressed={value.buttonShape === shape}
                style={{ backgroundColor: value.themeColor, borderRadius: buttonRadius[shape] }}
                onClick={() => update({ buttonShape: shape })}
              >
                {label}
              </Button>
            ))}
          </Flex>
        </section>
        <section className={styles.appearanceSection}>
          <h3>显示设置</h3>
          <Flex vertical gap={16}>
            <Flex justify="space-between" align="center">
              <label htmlFor="appearance-progress">显示进度条</label>
              <Switch
                id="appearance-progress"
                checked={value.showProgress}
                onChange={(showProgress) => update({ showProgress })}
              />
            </Flex>
            <Flex justify="space-between" align="center">
              <label htmlFor="appearance-number">显示题号</label>
              <Switch
                id="appearance-number"
                checked={value.showQuestionNumber}
                onChange={(showQuestionNumber) => update({ showQuestionNumber })}
              />
            </Flex>
          </Flex>
        </section>
      </Form>
    </section>
  );
}
