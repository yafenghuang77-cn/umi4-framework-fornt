import {
  ArrowLeftOutlined,
  BgColorsOutlined,
  BranchesOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Button, Divider, Flex, Input, Layout, Tag } from 'antd';

import styles from '../index.less';

import type { EditorMode } from '../types';

interface Props {
  title: string;
  mode: EditorMode;
  onTitle: (value: string) => void;
  onMode: (mode: EditorMode) => void;
  onBack: () => void;
}
const modes = [
  { id: 'content', label: '内容', icon: <FileTextOutlined aria-hidden="true" /> },
  { id: 'logic', label: '逻辑', icon: <BranchesOutlined aria-hidden="true" /> },
  { id: 'style', label: '样式', icon: <BgColorsOutlined aria-hidden="true" /> },
] as const;
export default function EditorHeader({ title, mode, onTitle, onMode, onBack }: Props) {
  return (
    <>
      <Layout.Header className={styles.header}>
        <Flex align="center" gap={12} className={styles.headerRow}>
          <Button type="text" icon={<ArrowLeftOutlined aria-hidden="true" />} onClick={onBack}>
            返回项目详情
          </Button>
          <Divider type="vertical" />
          <Input
            aria-label="问卷名称"
            value={title}
            onChange={(e) => onTitle(e.target.value)}
            maxLength={100}
          />
          <Tag color="success" className={styles.badge}>
            编辑模式
          </Tag>
        </Flex>
      </Layout.Header>
      <Flex component="nav" className={styles.toolbar} gap={8} align="center" aria-label="编辑模式">
        {modes.map((tab) => (
          <Button
            key={tab.id}
            type={mode === tab.id ? 'primary' : 'text'}
            icon={tab.icon}
            aria-pressed={mode === tab.id}
            onClick={() => onMode(tab.id)}
          >
            {tab.label}
          </Button>
        ))}
      </Flex>
    </>
  );
}
