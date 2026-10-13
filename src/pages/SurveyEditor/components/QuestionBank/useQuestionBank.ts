import { useState } from 'react';

import { bankQuestions, bankTags } from './data';

const PAGE_SIZE = 8;
export default function useQuestionBank() {
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
  return {
    search,
    changeSearch: (value: string) => {
      setSearch(value);
      setPage(1);
    },
    activeTag,
    changeTag: (value: string) => {
      setActiveTag(value);
      setPage(1);
    },
    expanded,
    toggleExpanded: () => setExpanded((current) => !current),
    tags,
    page,
    setPage,
    pageSize: PAGE_SIZE,
    total: questions.length,
    questions: questions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  };
}
