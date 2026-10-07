import { type RequestError, type RequestOptions } from '@umijs/max';

/**
 * 接口错误上报入口，接收原始错误及请求参数。
 * TODO: 接入上报服务；目前不发送请求、不记录日志。
 */
export function reportRequestError(_error: RequestError, _options: RequestOptions): void {
  return;
}
