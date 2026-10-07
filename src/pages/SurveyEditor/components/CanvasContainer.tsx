import {
  DeleteFilled,
  FolderFilled,
  HolderOutlined,
  InfoCircleFilled,
  MessageFilled,
  PlusCircleFilled,
} from '@ant-design/icons';
import { Button, Card, Flex, Typography } from 'antd';

import styles from '../index.less';
import { DRAG_KEY } from '../schema';

import type { SurveyContainer } from '../types';

interface Props {
  container: SurveyContainer;
  selected: boolean;
  containerSelected: boolean;
  onSelect: () => void;
  onSelectIntro: () => void;
  onRemove: () => void;
}
export default function CanvasContainer({
  container,
  selected,
  containerSelected,
  onSelect,
  onSelectIntro,
  onRemove,
}: Props) {
  const icon =
    container.kind === 'group' ? (
      <FolderFilled />
    ) : container.kind === 'followup' ? (
      <MessageFilled />
    ) : (
      <InfoCircleFilled />
    );
  return (
    <Card
      size="small"
      role="group"
      aria-label={container.title}
      onClick={onSelect}
      className={`${styles.canvasContainer} ${styles[`canvas${container.kind}`]} ${containerSelected ? styles.canvasContainerSelected : ''}`}
      title={
        <Flex align="center" gap={4}>
          <Button
            type="text"
            size="small"
            className={styles.containerHandle}
            icon={<HolderOutlined />}
            aria-label={`拖动${container.title}`}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData(
                DRAG_KEY,
                JSON.stringify({ type: 'moveContainer', id: container.id }),
              );
              event.dataTransfer.effectAllowed = 'move';
            }}
          />
          <Button
            type="text"
            className={styles.canvasContainerTitle}
            aria-label={`设置${container.title}`}
            icon={icon}
            onClick={onSelect}
          >
            {container.title}
            <Typography.Text className={styles.containerMeta}>
              (
              {container.kind === 'group'
                ? `${container.questions.length}题`
                : container.kind === 'followup'
                  ? '追问区'
                  : '引导语'}
              )
            </Typography.Text>
          </Button>
        </Flex>
      }
      extra={
        <Button
          type="text"
          size="small"
          className={styles.containerDelete}
          icon={<DeleteFilled />}
          aria-label={`删除${container.title}`}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        />
      }
    >
      {container.kind === 'intro' ? (
        <Button
          block
          className={`${styles.introPreview} ${selected ? styles.introSelected : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            onSelectIntro();
          }}
          aria-label="编辑引导语"
        >
          <Flex vertical gap={6} align="flex-start">
            <Typography.Text strong>引导语</Typography.Text>
            <Typography.Text type="secondary">引导语 · 展示{container.seconds}秒</Typography.Text>
            <Typography.Paragraph type="secondary">{container.text}</Typography.Paragraph>
          </Flex>
        </Button>
      ) : (
        <Flex
          vertical
          gap={8}
          align="center"
          justify="center"
          className={styles.containerQuestionPlaceholder}
        >
          <PlusCircleFilled aria-hidden="true" />
          <Typography.Text>释放以添加题目</Typography.Text>
        </Flex>
      )}
    </Card>
  );
}
