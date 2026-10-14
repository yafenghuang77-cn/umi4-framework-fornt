import { type RequestError, type RequestOptions } from '@umijs/max';

import { captureError, monitoringLog } from '@/utils/monitoring';
import { normalizeRoute } from '@/utils/monitoring/privacy';

/**
 * 只上报错误摘要和路径，不传递 Axios config、请求体、响应体或鉴权信息。
 */
export function reportRequestError(error: RequestError, options: RequestOptions): void {
  const metadata = error as {
    code?: string;
    config?: { url?: string };
    response?: { status?: number };
  };
  const attributes = {
    source: 'request',
    url: normalizeRoute(metadata.config?.url || options.url || '/'),
    status: metadata.response?.status || 0,
    code: metadata.code || '',
  };
  captureError(error, attributes);
  monitoringLog('error', 'request.failed', attributes);
}
