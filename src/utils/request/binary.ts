/** 识别浏览器中的二进制响应，包括 Blob、ArrayBuffer 和流。 */
export function isBinaryResponse(data: unknown): boolean {
  return (
    (typeof Blob !== 'undefined' && data instanceof Blob) ||
    (typeof ArrayBuffer !== 'undefined' &&
      (data instanceof ArrayBuffer || ArrayBuffer.isView(data))) ||
    (typeof ReadableStream !== 'undefined' && data instanceof ReadableStream)
  );
}
