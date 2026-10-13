/** 公共原生拖拽数据工具：仅处理序列化，不依赖业务组件和 React。 */
export function writeDragPayload(
  transfer: DataTransfer,
  mimeType: string,
  payload: unknown,
  effect: 'copy' | 'move',
): void {
  transfer.setData(mimeType, JSON.stringify(payload));
  transfer.effectAllowed = effect;
}

/** 浏览器 dragover 阶段不能读取内容；请在 drop 阶段读取，并由业务层验证。 */
export function readDragPayload(transfer: DataTransfer, mimeType: string): unknown {
  try {
    return JSON.parse(transfer.getData(mimeType));
  } catch {
    return undefined;
  }
}
