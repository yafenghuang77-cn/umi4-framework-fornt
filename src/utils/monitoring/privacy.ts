/** 只保留路由路径；数值 ID、UUID 和长随机串归一化。 */
export function normalizeRoute(input: string): string {
  try {
    return new URL(input, 'https://monitoring.invalid').pathname.replace(
      /\/(?:\d+|[a-f\d]{8}-[a-f\d-]{27,}|[a-z\d_-]{32,})(?=\/|$)/gi,
      '/:id',
    );
  } catch {
    return '/unknown';
  }
}

export function redactText(value: string): string {
  return value
    .replace(/https?:\/\/[^\s"'<>]+/gi, (url) => normalizeRoute(url))
    .replace(/([?&][\w.-]+=)[^\s&#]+/g, '$1[filtered]')
    .replace(/\bBearer\s+[^\s,;]+/gi, 'Bearer [filtered]')
    .replace(
      /((?:password|passwd|token|authorization|cookie|secret|api[_-]?key)\s*[=:]\s*)[^\s,;]+/gi,
      '$1[filtered]',
    )
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email]')
    .slice(0, 1000);
}

/** 对 SDK 的嵌套上下文统一脱敏；不主动采集请求体、响应体和 DOM 文本。 */
export function scrub<T>(value: T, depth = 0): T {
  if (depth > 8) {
    return '[truncated]' as T;
  }
  if (typeof value === 'string') {
    return redactText(value) as T;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => scrub(item, depth + 1)) as T;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !/^(user|data|body|headers|cookies)$/i.test(key))
        .map(([key, item]) => [
          key,
          /password|passwd|token|authorization|cookie|secret|email|api[_-]?key|^user$|^data$|^body$|^headers$|target|element|selector/i.test(
            key,
          )
            ? '[filtered]'
            : scrub(item, depth + 1),
        ]),
    ) as T;
  }
  return value;
}
