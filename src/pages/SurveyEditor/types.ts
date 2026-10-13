import type { ContainerKind, QuestionKind } from '@/types/survey';

export type {
  ContainerKind,
  Question,
  QuestionKind,
  QuestionOption,
  Survey,
  SurveyContainer,
} from '@/types/survey';

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
