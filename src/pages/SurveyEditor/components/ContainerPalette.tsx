import { Button, Flex } from 'antd';

import { writeDragPayload } from '@/utils/nativeDrag';

import { containerKindByType } from '../catalogAdapter';
import { containerComponents } from '../questionCatalog';
import { DRAG_KEY } from '../schema';
import styles from '../styles/QuestionPalette.less';

export default function ContainerPalette() {
  return (
    <Flex vertical gap={8} className={styles.containerPalette}>
      {containerComponents.map((item) => (
        <Button
          key={item.key}
          className={styles[containerKindByType[item.type]]}
          block
          icon={
            <span className={styles.containerIcon} aria-hidden="true">
              {item.icon}
            </span>
          }
          draggable
          onDragStart={(e) => {
            writeDragPayload(
              e.dataTransfer,
              DRAG_KEY,
              { type: 'container', kind: containerKindByType[item.type] },
              'copy',
            );
          }}
          title="拖拽容器组件"
        >
          {item.label}
        </Button>
      ))}
    </Flex>
  );
}
