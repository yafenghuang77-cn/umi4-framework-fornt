import { DownOutlined, SearchOutlined, UpOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Input, Pagination, Tag, Typography } from 'antd';

import styles from '../../styles/QuestionBank.less';
import QuestionBankCard from './QuestionBankCard';
import useQuestionBank from './useQuestionBank';

export default function QuestionBankPanel() {
  const {
    search,
    changeSearch,
    activeTag,
    changeTag,
    expanded,
    toggleExpanded,
    tags,
    page,
    setPage,
    pageSize,
    total,
    questions,
  } = useQuestionBank();
  return (
    <Flex vertical className={styles.bankPanel} role="region" aria-label="题库">
      <Flex vertical gap={10} className={styles.bankFilters}>
        <Typography.Title level={5} className={styles.bankHeading}>
          题库
        </Typography.Title>
        <Input
          aria-label="搜索题库"
          placeholder="搜索题目或标签..."
          prefix={<SearchOutlined aria-hidden="true" />}
          allowClear
          value={search}
          onChange={(event) => changeSearch(event.target.value)}
        />
        <Flex wrap gap={5} className={styles.bankTags}>
          {['全部', ...tags].map((tag) => (
            <Tag.CheckableTag key={tag} checked={activeTag === tag} onChange={() => changeTag(tag)}>
              {tag}
            </Tag.CheckableTag>
          ))}
          <Button
            type="link"
            size="small"
            className={styles.bankExpand}
            icon={
              expanded ? <UpOutlined aria-hidden="true" /> : <DownOutlined aria-hidden="true" />
            }
            iconPlacement="end"
            onClick={toggleExpanded}
          >
            {expanded ? '收起' : '展开全部'}
          </Button>
        </Flex>
      </Flex>
      <Flex vertical gap={8} className={styles.bankResults} role="list" aria-label="题库题目">
        {questions.length ? (
          questions.map((question) => <QuestionBankCard key={question.id} question={question} />)
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无匹配题目" />
        )}
      </Flex>
      <Flex vertical align="center" gap={10} className={styles.bankFooter}>
        <Pagination
          size="small"
          current={page}
          pageSize={pageSize}
          total={total}
          onChange={setPage}
          showSizeChanger={false}
          showLessItems
          hideOnSinglePage={false}
        />
        <Typography.Text type="secondary">拖拽题目到右侧画布容器中使用</Typography.Text>
      </Flex>
    </Flex>
  );
}
