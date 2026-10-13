import { Button, Flex } from 'antd';

import styles from './index.less';

export interface ColorOption {
  label: string;
  value: string;
}
interface Props {
  label: string;
  options: readonly ColorOption[];
  value: string;
  onChange: (value: string) => void;
}
export default function ColorSwatchPicker({ label, options, value, onChange }: Props) {
  return (
    <Flex gap={12} wrap role="group" aria-label={label}>
      {options.map((color) => (
        <Button
          key={color.value}
          className={styles.swatch}
          aria-label={`${label}：${color.label}`}
          aria-pressed={value === color.value}
          title={color.label}
          style={{ backgroundColor: color.value }}
          onClick={() => onChange(color.value)}
        />
      ))}
    </Flex>
  );
}
