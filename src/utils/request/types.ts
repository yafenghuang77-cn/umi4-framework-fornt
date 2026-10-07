import { type RequestOptions as UmiRequestOptions } from '@umijs/max';

export interface RequestOptions extends UmiRequestOptions {
  /** 默认返回后端 data；设为 true 时返回完整后端响应体。 */
  returnFullResponse?: boolean;
  /** 跳过自动注入 Token。 */
  skipAuth?: boolean;
}
