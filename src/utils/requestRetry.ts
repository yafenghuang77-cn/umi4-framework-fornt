// Umi request 基于 Axios，超时错误使用这两个错误码。
export function retryTimedOutQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 5 || typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  return error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
}
