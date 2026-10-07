import { useState } from 'react';

import { PlusCircleFilled } from '@ant-design/icons';
import { Flex, Layout, Typography } from 'antd';

import { DRAG_KEY } from '../schema';
import styles from '../styles/SurveyCanvas.less';
import CanvasContainer from './CanvasContainer';

import type { CanvasEditor, ContainerDrag } from '../useCanvasContainers';

interface Props {
  editor: CanvasEditor;
}
function readContainer(data: DataTransfer): ContainerDrag | undefined {
  try {
    const item = JSON.parse(data.getData(DRAG_KEY));
    if (
      (item?.type === 'container' && ['group', 'followup', 'intro'].includes(item.kind)) ||
      (item?.type === 'moveContainer' && typeof item.id === 'string')
    ) {
      return item;
    }
  } catch {
    /* Ignore unrelated or malformed drag data. */
  }
  return undefined;
}
export default function SurveyCanvas({ editor }: Props) {
  const [over, setOver] = useState<{ id?: string; placement: 'before' | 'after' }>();
  const drop = (
    event: React.DragEvent,
    targetId?: string,
    placement: 'before' | 'after' = 'after',
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setOver(undefined);
    const item = readContainer(event.dataTransfer);
    if (item) {
      editor.dropContainer(item, targetId, placement);
    }
  };
  return (
    <Layout.Content
      className={`${styles.canvas} ${styles.canvasWorkspace}`}
      role="main"
      aria-label="问卷画布"
      onDragOver={(event) => {
        if (event.dataTransfer.types.includes(DRAG_KEY)) {
          event.preventDefault();
          setOver({ placement: 'after' });
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOver(undefined);
        }
      }}
      onDrop={(event) => drop(event)}
    >
      {!editor.containers.length ? (
        <Flex
          vertical
          align="center"
          justify="center"
          gap={12}
          className={`${styles.canvasEmpty} ${over ? styles.canvasDropActive : ''}`}
        >
          <PlusCircleFilled aria-hidden="true" />
          <Typography.Text strong>从左侧拖拽“题目组”、“追问区”或“引导语”到此处</Typography.Text>
          <Typography.Text type="secondary">先创建容器，再拖拽题目到容器内</Typography.Text>
        </Flex>
      ) : (
        <Flex vertical gap={10}>
          {editor.containers.map((container) => (
            <div
              key={container.id}
              className={`${styles.canvasSlot} ${over?.id === container.id ? (over.placement === 'before' ? styles.dropBefore : styles.dropAfter) : ''}`}
              onDragOver={(event) => {
                if (!event.dataTransfer.types.includes(DRAG_KEY)) {
                  return;
                }
                event.preventDefault();
                event.stopPropagation();
                const bounds = event.currentTarget.getBoundingClientRect();
                setOver({
                  id: container.id,
                  placement: event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after',
                });
              }}
              onDrop={(event) =>
                drop(event, container.id, over?.id === container.id ? over.placement : 'after')
              }
            >
              <CanvasContainer
                container={container}
                containerSelected={
                  editor.selectedId === container.id && editor.selectedTarget === 'container'
                }
                selected={editor.selectedId === container.id && editor.selectedTarget === 'intro'}
                onSelect={() => editor.selectContainer(container.id)}
                onSelectIntro={() => editor.selectIntro(container.id)}
                onRemove={() => editor.removeContainer(container.id)}
              />
            </div>
          ))}
          <Flex
            align="center"
            justify="center"
            className={`${styles.canvasAppend} ${over && !over.id ? styles.canvasDropActive : ''}`}
          >
            <Typography.Text type="secondary">拖拽容器组件到此处</Typography.Text>
          </Flex>
        </Flex>
      )}
    </Layout.Content>
  );
}
