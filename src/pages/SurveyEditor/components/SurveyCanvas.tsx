import { PlusCircleFilled } from '@ant-design/icons';
import { Flex, Layout, Typography } from 'antd';

import useCanvasDrag from '../hooks/useCanvasDrag';
import styles from '../styles/SurveyCanvas.less';
import CanvasContainer from './CanvasContainer';

import type { CanvasEditor } from '../useCanvasContainers';

interface Props {
  editor: CanvasEditor;
}
export default function SurveyCanvas({ editor }: Props) {
  const { over, canvasHandlers, getContainerHandlers } = useCanvasDrag(editor.dropContainer);
  return (
    <Layout.Content
      className={`${styles.canvas} ${styles.canvasWorkspace}`}
      role="main"
      aria-label="问卷画布"
      {...canvasHandlers}
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
              {...getContainerHandlers(container.id)}
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
