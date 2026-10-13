import type { SurveyContainerType, SurveyQuestionType } from '@/constants/survey';

export type ContainerKind = 'group' | 'followup' | 'intro';
export type QuestionKind =
  | 'single'
  | 'multiple'
  | 'imageSingle'
  | 'imageMultiple'
  | 'text'
  | 'phone'
  | 'number'
  | 'date'
  | 'email'
  | 'multiText'
  | 'rating'
  | 'dualRating'
  | 'nps'
  | 'multiRating'
  | 'multiDualRating'
  | 'matrixSingle'
  | 'matrixMultiple'
  | 'matrixDualRating'
  | 'matrixRating'
  | 'video'
  | 'image';
export interface QuestionOption {
  id: string;
  label: string;
  image?: string;
}
export interface Question {
  id: string;
  kind: QuestionKind;
  componentType: SurveyQuestionType;
  title: string;
  description: string;
  seconds: number;
  required: boolean;
  media?: string;
  options: QuestionOption[];
  condition?: string;
}
export interface SurveyContainer {
  id: string;
  kind: ContainerKind;
  componentType: SurveyContainerType;
  title: string;
  questions: Question[];
  text: string;
  seconds: number;
}
export interface Survey {
  title: string;
  containers: SurveyContainer[];
  accent: string;
}
