import { type JSZipObject, type JSZipStreamHelper } from 'jszip';

import { MAX_FILE_SIZE } from '@/utils/file';

// JSZip 3.x 提供此方法，但自带声明仅包含 ZIP 生成流。
interface StreamingZipObject extends JSZipObject {
  internalStream(type: 'uint8array'): JSZipStreamHelper<Uint8Array>;
}

// 流式读取解压结果，单个条目同样遵守文件大小上限。
export function readArchiveEntry(
  entry: JSZipObject,
  limit = MAX_FILE_SIZE,
): Promise<Uint8Array<ArrayBuffer>> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    let size = 0;
    const stream = (entry as StreamingZipObject).internalStream('uint8array');
    stream.on('data', (chunk: Uint8Array) => {
      size += chunk.byteLength;
      if (size > limit) {
        stream.pause();
        reject(new Error('解压内容超过预览大小限制，请在本地打开。'));
        return;
      }
      chunks.push(chunk);
    });
    stream.on('error', reject);
    stream.on('end', () => {
      const result = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.byteLength;
      }
      resolve(result);
    });
    stream.resume();
  });
}
