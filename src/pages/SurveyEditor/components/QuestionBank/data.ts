import { SurveyQuestionType } from '../../questionCatalog';

export interface BankQuestion {
  id: string;
  title: string;
  type: SurveyQuestionType;
  tags: string[];
}

/** UI preview data; replace with the question bank service when its API is available. */
export const bankTags = [
  '标签名字测试',
  '测试8',
  '标签7',
  '标签6',
  '13',
  'test12',
  'www22',
  '标签123',
  '标签11',
  '产品不足点',
  '243',
];
export const bankQuestions: BankQuestion[] = [
  { id: 'bank-1', title: '测试', type: SurveyQuestionType.FillInBlanks, tags: ['标签名字测试'] },
  { id: 'bank-2', title: 'aitest', type: SurveyQuestionType.FillInBlanks, tags: ['吃饭'] },
  { id: 'bank-3', title: '11', type: SurveyQuestionType.SingleChoice, tags: ['111'] },
  { id: 'bank-4', title: '11', type: SurveyQuestionType.BidirectScoreComp, tags: ['22'] },
  { id: 'bank-5', title: '111', type: SurveyQuestionType.SingleChoice, tags: ['产品不足点'] },
  {
    id: 'bank-6',
    title: '1023单选题',
    type: SurveyQuestionType.SingleChoice,
    tags: ['产品不足点'],
  },
  { id: 'bank-7', title: '222', type: SurveyQuestionType.BidirectScoreComp, tags: ['22'] },
  { id: 'bank-8', title: '123', type: SurveyQuestionType.MultipleChoice, tags: ['产品不足点'] },
  { id: 'bank-9', title: '你觉得xxx颜色如何', type: SurveyQuestionType.Evaluate, tags: ['243'] },
  {
    id: 'bank-10',
    title: '双向打分题10',
    type: SurveyQuestionType.BidirectScoreComp,
    tags: ['237'],
  },
  { id: 'bank-11', title: 'test--10', type: SurveyQuestionType.Evaluate, tags: ['243'] },
  { id: 'bank-12', title: '123', type: SurveyQuestionType.FillInBlanks, tags: ['239'] },
  {
    id: 'bank-13',
    title: '双向打分题',
    type: SurveyQuestionType.BidirectScoreComp,
    tags: ['P1M次数-麦当劳'],
  },
  { id: 'bank-14', title: '10', type: SurveyQuestionType.Evaluate, tags: ['产品不足点'] },
  { id: 'bank-15', title: '三个选项的打分题', type: SurveyQuestionType.Evaluate, tags: ['231'] },
  { id: 'bank-16', title: '123', type: SurveyQuestionType.BidirectScoreComp, tags: ['243'] },
  { id: 'bank-17', title: '打分题', type: SurveyQuestionType.Evaluate, tags: ['245'] },
  { id: 'bank-18', title: '111', type: SurveyQuestionType.BidirectScoreComp, tags: ['243'] },
  { id: 'bank-19', title: '打分题', type: SurveyQuestionType.Evaluate, tags: ['243'] },
  { id: 'bank-20', title: '填空', type: SurveyQuestionType.MultipleChoice, tags: ['243'] },
];
