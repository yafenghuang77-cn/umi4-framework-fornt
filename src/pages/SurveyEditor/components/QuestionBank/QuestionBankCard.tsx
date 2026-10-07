import { Card, Flex, Tag, Typography } from 'antd';

import styles from '../../index.less';
import { questionGroups } from '../../questionCatalog';
import { DRAG_KEY } from '../../schema';

import type { BankQuestion } from './data';

interface Props {
  question: BankQuestion;
}
export default function QuestionBankCard({ question }: Props) {
  const typeLabel =
    questionGroups.flatMap((group) => group.items).find((item) => item.type === question.type)
      ?.label || question.type;
  return (
    <Card
      size="small"
      className={styles.bankCard}
      role="listitem"
      aria-label={question.title}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData(DRAG_KEY, JSON.stringify({ type: 'bankQuestion', question }));
        event.dataTransfer.effectAllowed = 'copy';
      }}
    >
      <Flex gap={10} align="flex-start">
        <Tag bordered={false} className={styles.bankQuestionIcon}>
          题
        </Tag>
        <Flex vertical gap={4} className={styles.bankCardContent}>
          <Typography.Text className={styles.bankQuestionTitle}>{question.title}</Typography.Text>
          <Flex wrap gap={4}>
            <Tag bordered={false} className={styles.bankTypeTag}>
              {typeLabel}
            </Tag>
            {question.tags.map((tag) => (
              <Tag bordered={false} className={styles.bankLabelTag} key={tag}>
                {tag}
              </Tag>
            ))}
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
}
