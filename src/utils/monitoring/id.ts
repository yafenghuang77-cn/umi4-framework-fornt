/** 兼容非安全上下文；ID 仅用于监控去重，不用于鉴权。 */
export function monitoringId() {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
