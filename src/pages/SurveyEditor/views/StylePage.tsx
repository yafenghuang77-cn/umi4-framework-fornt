import { Layout } from 'antd';

import StylePreview from '../components/StylePreview';
import StyleSettings from '../components/StyleSettings';
import styles from '../styles/StylePage.less';

import type { SurveyAppearance } from '../appearance';
import type { SurveyContainer } from '../types';

interface Props {
  value: SurveyAppearance;
  onChange: (value: SurveyAppearance) => void;
  containers: SurveyContainer[];
  title: string;
}

export default function StylePage({ value, onChange, containers, title }: Props) {
  return (
    <Layout.Content className={styles.stylePage} role="main" aria-label="样式编辑页">
      <StyleSettings value={value} onChange={onChange} />
      <StylePreview value={value} containers={containers} title={title} />
    </Layout.Content>
  );
}
