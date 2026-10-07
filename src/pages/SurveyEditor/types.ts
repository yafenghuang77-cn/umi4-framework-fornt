import type { SurveyContainerType, SurveyQuestionType } from './questionCatalog';

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
export interface Selection {
  containerId: string;
  questionId?: string;
}
export type DragItem =
  | { type: 'container'; kind: ContainerKind }
  | { type: 'question'; kind: QuestionKind }
  | { type: 'moveContainer'; id: string }
  | { type: 'moveQuestion'; containerId: string; id: string };
export type EditorMode = 'content' | 'logic' | 'style';
