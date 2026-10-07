import { useState } from 'react';

import { DownOutlined, SearchOutlined, UpOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Input, Pagination, Tag, Typography } from 'antd';

import styles from '../../index.less';
import { bankQuestions, bankTags } from './data';
import QuestionBankCard from './QuestionBankCard';

const PAGE_SIZE = 8;
export default function QuestionBankPanel() {
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('全部');
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const query = search.trim().toLocaleLowerCase();
  const questions = bankQuestions.filter(
    (question) =>
      (activeTag === '全部' || question.tags.includes(activeTag)) &&
      (!query ||
        [question.title, ...question.tags].some((text) =>
          text.toLocaleLowerCase().includes(query),
        )),
  );
  const tags = expanded ? bankTags : bankTags.slice(0, 9);
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
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Flex wrap gap={5} className={styles.bankTags}>
          {['全部', ...tags].map((tag) => (
            <Tag.CheckableTag
              key={tag}
              checked={activeTag === tag}
              onChange={() => {
                setActiveTag(tag);
                setPage(1);
              }}
            >
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
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '收起' : '展开全部'}
          </Button>
        </Flex>
      </Flex>
      <Flex vertical gap={8} className={styles.bankResults} role="list" aria-label="题库题目">
        {questions.length ? (
          questions
            .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
            .map((question) => <QuestionBankCard key={question.id} question={question} />)
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无匹配题目" />
        )}
      </Flex>
      <Flex vertical align="center" gap={10} className={styles.bankFooter}>
        <Pagination
          size="small"
          current={page}
          pageSize={PAGE_SIZE}
          total={questions.length}
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
