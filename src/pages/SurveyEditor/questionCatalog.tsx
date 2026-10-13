import {
  AlignLeftOutlined,
  BarsOutlined,
  CalendarFilled,
  CheckCircleFilled,
  CheckSquareFilled,
  EllipsisOutlined,
  FileTextOutlined,
  FolderFilled,
  HeartFilled,
  MailFilled,
  MessageFilled,
  NumberOutlined,
  PhoneFilled,
  PictureFilled,
  StarFilled,
  SwapOutlined,
  TableOutlined,
  VideoCameraFilled,
} from '@ant-design/icons';

import { SurveyContainerType, SurveyQuestionType } from '@/constants/survey';

import type { ReactNode } from 'react';

export interface ContainerComponentItem {
  key: string;
  label: string;
  type: SurveyContainerType;
  icon: ReactNode;
  className: string;
}

export interface QuestionTypeItem {
  key: string;
  label: string;
  type: SurveyQuestionType;
  icon: ReactNode;
}

export interface QuestionGroup {
  key: string;
  title: string;
  count: number;
  icon: ReactNode;
  items: QuestionTypeItem[];
}

export const containerComponents: ContainerComponentItem[] = [
  {
    key: 'group',
    label: '题目组',
    type: SurveyContainerType.QuestionGroup,
    icon: <FolderFilled />,
    className: 'survey-design-container-card-group',
  },
  {
    key: 'follow',
    label: '追问区',
    type: SurveyContainerType.FollowUpZone,
    icon: <MessageFilled />,
    className: 'survey-design-container-card-follow',
  },
  {
    key: 'intro',
    label: '引导语',
    type: SurveyContainerType.Guide,
    icon: <AlignLeftOutlined />,
    className: 'survey-design-container-card-intro',
  },
];

export const questionGroups: QuestionGroup[] = [
  {
    key: 'choice',
    title: '选择题',
    count: 4,
    icon: <BarsOutlined />,
    items: [
      {
        key: 'single',
        label: '单选题',
        type: SurveyQuestionType.SingleChoice,
        icon: <CheckCircleFilled />,
      },
      {
        key: 'multiple',
        label: '多选题',
        type: SurveyQuestionType.MultipleChoice,
        icon: <CheckSquareFilled />,
      },
      {
        key: 'image-single',
        label: '图片单选',
        type: SurveyQuestionType.SingleImage,
        icon: <PictureFilled />,
      },
      {
        key: 'image-multiple',
        label: '图片多选',
        type: SurveyQuestionType.MultipleImage,
        icon: <PictureFilled />,
      },
    ],
  },
  {
    key: 'fill',
    title: '填空题',
    count: 6,
    icon: <TableOutlined />,
    items: [
      {
        key: 'text',
        label: '文本填空',
        type: SurveyQuestionType.FillInBlanks,
        icon: <span className="survey-design-text-icon">A</span>,
      },
      {
        key: 'phone',
        label: '手机号',
        type: SurveyQuestionType.PhoneNum,
        icon: <PhoneFilled />,
      },
      {
        key: 'email',
        label: '邮箱',
        type: SurveyQuestionType.Email,
        icon: <MailFilled />,
      },
      {
        key: 'number',
        label: '数值',
        type: SurveyQuestionType.Number,
        icon: <NumberOutlined />,
      },
      {
        key: 'date',
        label: '日期',
        type: SurveyQuestionType.Calendar,
        icon: <CalendarFilled />,
      },
      {
        key: 'multi-fill',
        label: '多项填空',
        type: SurveyQuestionType.MultiFillInBlanks,
        icon: <FileTextOutlined />,
      },
    ],
  },
  {
    key: 'score',
    title: '打分题',
    count: 5,
    icon: <StarFilled />,
    items: [
      {
        key: 'score',
        label: '打分题',
        type: SurveyQuestionType.Evaluate,
        icon: <StarFilled />,
      },
      {
        key: 'nps',
        label: 'NPS',
        type: SurveyQuestionType.NPS,
        icon: <HeartFilled />,
      },
      {
        key: 'two-way-score',
        label: '双向打分',
        type: SurveyQuestionType.BidirectScoreComp,
        icon: <SwapOutlined />,
      },
      {
        key: 'multi-score',
        label: '多项打分',
        type: SurveyQuestionType.MultiScoreComp,
        icon: <StarFilled />,
      },
      {
        key: 'multi-two-way-score',
        label: '多项双向打分',
        type: SurveyQuestionType.MultiBidirectScoreComp,
        icon: <SwapOutlined />,
      },
    ],
  },
  {
    key: 'matrix',
    title: '矩阵题',
    count: 4,
    icon: <TableOutlined />,
    items: [
      {
        key: 'matrix-single',
        label: '矩阵单选',
        type: SurveyQuestionType.MatrixSingleChoice,
        icon: <TableOutlined />,
      },
      {
        key: 'matrix-multiple',
        label: '矩阵多选',
        type: SurveyQuestionType.MatrixMultipleChoice,
        icon: <TableOutlined />,
      },
      {
        key: 'matrix-score',
        label: '矩阵打分',
        type: SurveyQuestionType.MatrixScoreComp,
        icon: <StarFilled />,
      },
      {
        key: 'matrix-two-way-score',
        label: '矩阵双向打分',
        type: SurveyQuestionType.MatrixBidirectScoreComp,
        icon: <SwapOutlined />,
      },
    ],
  },
  {
    key: 'other',
    title: '其他',
    count: 2,
    icon: <EllipsisOutlined />,
    items: [
      {
        key: 'video',
        label: '视频展示',
        type: SurveyQuestionType.Video,
        icon: <VideoCameraFilled />,
      },
      {
        key: 'image',
        label: '图片展示',
        type: SurveyQuestionType.Image,
        icon: <PictureFilled />,
      },
    ],
  },
];
