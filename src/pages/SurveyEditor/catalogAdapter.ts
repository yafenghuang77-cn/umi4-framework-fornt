import { SurveyContainerType, SurveyQuestionType } from './questionCatalog';

import type { ContainerKind, QuestionKind } from './types';

/** Backend component codes stay in one catalog; preview kinds only describe renderer behavior. */
export const questionKindByType: Partial<Record<SurveyQuestionType, QuestionKind>> = {
  [SurveyQuestionType.SingleChoice]: 'single',
  [SurveyQuestionType.MultipleChoice]: 'multiple',
  [SurveyQuestionType.SingleImage]: 'imageSingle',
  [SurveyQuestionType.MultipleImage]: 'imageMultiple',
  [SurveyQuestionType.FillInBlanks]: 'text',
  [SurveyQuestionType.PhoneNum]: 'phone',
  [SurveyQuestionType.Email]: 'email',
  [SurveyQuestionType.Number]: 'number',
  [SurveyQuestionType.Calendar]: 'date',
  [SurveyQuestionType.MultiFillInBlanks]: 'multiText',
  [SurveyQuestionType.Evaluate]: 'rating',
  [SurveyQuestionType.ScoreComp]: 'rating',
  [SurveyQuestionType.NPS]: 'nps',
  [SurveyQuestionType.BidirectScoreComp]: 'dualRating',
  [SurveyQuestionType.MultiScoreComp]: 'multiRating',
  [SurveyQuestionType.MultiBidirectScoreComp]: 'multiDualRating',
  [SurveyQuestionType.MatrixSingleChoice]: 'matrixSingle',
  [SurveyQuestionType.MatrixMultipleChoice]: 'matrixMultiple',
  [SurveyQuestionType.MatrixScoreComp]: 'matrixRating',
  [SurveyQuestionType.MatrixBidirectScoreComp]: 'matrixDualRating',
  [SurveyQuestionType.Video]: 'video',
  [SurveyQuestionType.Image]: 'image',
};
export const containerKindByType: Record<SurveyContainerType, ContainerKind> = {
  [SurveyContainerType.QuestionGroup]: 'group',
  [SurveyContainerType.FollowUpZone]: 'followup',
  [SurveyContainerType.Guide]: 'intro',
};
