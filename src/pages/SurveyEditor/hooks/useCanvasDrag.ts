import { type DragEvent, useState } from 'react';

import { readDragPayload } from '@/utils/nativeDrag';

import { DRAG_KEY } from '../schema';

import type { ContainerDrag } from '../useCanvasContainers';

interface DropLocation {
  id?: string;
  placement: 'before' | 'after';
}
function readContainer(transfer: DataTransfer): ContainerDrag | undefined {
  const item = readDragPayload(transfer, DRAG_KEY);
  if (typeof item !== 'object' || item === null || !('type' in item)) {
    return undefined;
  }
  if (
    item.type === 'container' &&
    'kind' in item &&
    (item.kind === 'group' || item.kind === 'followup' || item.kind === 'intro')
  ) {
    return { type: 'container', kind: item.kind };
  }
  if (item.type === 'moveContainer' && 'id' in item && typeof item.id === 'string') {
    return { type: 'moveContainer', id: item.id };
  }
  return undefined;
}
export default function useCanvasDrag(
  onDrop: (item: ContainerDrag, targetId?: string, placement?: 'before' | 'after') => void,
) {
  const [over, setOver] = useState<DropLocation>();
  const drop = (event: DragEvent, id?: string, placement: 'before' | 'after' = 'after') => {
    event.preventDefault();
    event.stopPropagation();
    setOver(undefined);
    const item = readContainer(event.dataTransfer);
    if (item) {
      onDrop(item, id, placement);
    }
  };
  const canvasHandlers = {
    onDragOver: (event: DragEvent) => {
      if (event.dataTransfer.types.includes(DRAG_KEY)) {
        event.preventDefault();
        setOver({ placement: 'after' });
      }
    },
    onDragLeave: (event: DragEvent) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
        setOver(undefined);
      }
    },
    onDrop: (event: DragEvent) => drop(event),
  };
  const getContainerHandlers = (id: string) => ({
    onDragOver: (event: DragEvent) => {
      if (!event.dataTransfer.types.includes(DRAG_KEY)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const bounds = event.currentTarget.getBoundingClientRect();
      setOver({
        id,
        placement: event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after',
      });
    },
    onDrop: (event: DragEvent) => drop(event, id, over?.id === id ? over.placement : 'after'),
  });
  return { over, canvasHandlers, getContainerHandlers };
}
