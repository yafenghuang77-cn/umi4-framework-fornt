import { useState } from 'react';

import { Badge, Button, Tree, Typography } from 'antd';

import { questionKindByType } from '../catalogAdapter';
import styles from '../index.less';
import { questionGroups } from '../questionCatalog';
import { DRAG_KEY } from '../schema';

export default function QuestionTypeTree() {
  const [expanded, setExpanded] = useState<React.Key[]>([]);
  const treeData = questionGroups.map((group) => {
    const open = expanded.includes(group.key);
    return {
      key: group.key,
      title: (
        <Button
          type="text"
          className={styles.categoryToggle}
          aria-label={`${group.title}分类`}
          aria-expanded={open}
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((previous) =>
              previous.includes(group.key)
                ? previous.filter((key) => key !== group.key)
                : [...previous, group.key],
            );
          }}
        >
          <span aria-hidden="true">{group.icon}</span>
          <span>{group.title}</span>
          <Badge count={group.count} color="#e9ecf2" className={styles.count} />
          <Typography.Text type="secondary" className={styles.expand}>
            {open ? '收起' : '展开'}
          </Typography.Text>
        </Button>
      ),
      children: group.items.map((item) => ({
        // Prefix prevents the category and rating item from sharing the "score" key.
        key: `${group.key}/${item.key}`,
        title: (
          <Button
            block
            aria-label={item.label}
            className={styles.typeItem}
            draggable
            onDragStart={(e) => {
              const kind = questionKindByType[item.type];
              if (kind) {
                e.dataTransfer.setData(DRAG_KEY, JSON.stringify({ type: 'question', kind }));
                e.dataTransfer.effectAllowed = 'copy';
              }
            }}
            title="拖拽题型"
          >
            <span className={styles.typeIcon} aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </Button>
        ),
      })),
    };
  });
  return (
    <Tree
      aria-label="题型分类树"
      className={styles.typeTree}
      blockNode
      virtual={false}
      motion={null}
      selectable={false}
      expandedKeys={expanded}
      onExpand={setExpanded}
      treeData={treeData}
    />
  );
}
