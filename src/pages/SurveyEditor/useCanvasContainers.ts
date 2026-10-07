import { useState } from 'react';

import { containerKindByType } from './catalogAdapter';
import { containerComponents } from './questionCatalog';

import type { ContainerKind, SurveyContainer } from './types';

export type ContainerDrag =
  { type: 'container'; kind: ContainerKind } | { type: 'moveContainer'; id: string };
export default function useCanvasContainers() {
  const [containers, setContainers] = useState<SurveyContainer[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [selectedTarget, setSelectedTarget] = useState<'container' | 'intro'>('container');
  const selectContainer = (id: string) => {
    setSelectedId(id);
    setSelectedTarget('container');
  };
  const selectIntro = (id: string) => {
    setSelectedId(id);
    setSelectedTarget('intro');
  };
  const selected = containers.find((container) => container.id === selectedId);
  const dropContainer = (
    item: ContainerDrag,
    targetId?: string,
    placement: 'before' | 'after' = 'after',
  ) => {
    if (item.type === 'moveContainer' && item.id === targetId) {
      return;
    }
    let created: SurveyContainer | undefined;
    if (item.type === 'container') {
      const component = containerComponents.find(
        (entry) => containerKindByType[entry.type] === item.kind,
      );
      if (!component) {
        return;
      }
      created = {
        id: crypto.randomUUID(),
        kind: item.kind,
        componentType: component.type,
        title:
          item.kind === 'group' ? '新建题目组' : item.kind === 'followup' ? '追问区' : '引导语标题',
        questions: [],
        text: '感谢您参与本次访谈，请根据实际情况作答。',
        seconds: 5,
      };
    }
    setContainers((previous) => {
      const container =
        created ||
        previous.find((entry) => entry.id === (item.type === 'moveContainer' ? item.id : ''));
      if (!container) {
        return previous;
      }
      const next = previous.filter((entry) => entry.id !== container.id);
      const index = next.findIndex((entry) => entry.id === targetId);
      next.splice(index < 0 ? next.length : index + (placement === 'after' ? 1 : 0), 0, container);
      return next;
    });
    if (created) {
      selectContainer(created.id);
    }
  };
  const updateIntro = (patch: Pick<SurveyContainer, 'text'> | Pick<SurveyContainer, 'seconds'>) =>
    setContainers((previous) =>
      previous.map((container) =>
        container.id === selectedId && container.kind === 'intro' && selectedTarget === 'intro'
          ? { ...container, ...patch }
          : container,
      ),
    );
  const updateContainerName = (title: string) =>
    setContainers((previous) =>
      previous.map((container) =>
        container.id === selectedId && selectedTarget === 'container'
          ? { ...container, title }
          : container,
      ),
    );
  const removeContainer = (id: string) => {
    setContainers((previous) => previous.filter((container) => container.id !== id));
    if (selectedId === id) {
      setSelectedId(undefined);
    }
  };
  return {
    containers,
    selected,
    selectedId,
    selectedTarget,
    selectContainer,
    selectIntro,
    updateContainerName,
    dropContainer,
    updateIntro,
    removeContainer,
  };
}
export type CanvasEditor = ReturnType<typeof useCanvasContainers>;
