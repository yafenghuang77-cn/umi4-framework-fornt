import JSZip from 'jszip';

import { readArchiveEntry } from '@/components/FilePreview/archive';
import {
  getFileKind,
  loadRemoteFile,
  MAX_FILE_SIZE,
  MAX_PREVIEW_COLUMNS,
  MAX_PREVIEW_ROWS,
  parseDelimitedText,
} from '@/utils/file';

test('CSV 正确保留引号内的逗号、换行、转义引号、空单元格及 BOM', () => {
  expect(parseDelimitedText('\uFEFFname,note,empty\r\nAlice,"a,b\n""quoted""",\r\n').rows).toEqual([
    ['name', 'note', 'empty'],
    ['Alice', 'a,b\n"quoted"', ''],
  ]);
  expect(parseDelimitedText('a\tb\r\n1\t2', '\t').rows).toEqual([
    ['a', 'b'],
    ['1', '2'],
  ]);
  expect(() => parseDelimitedText('a,"broken')).toThrow('引号未闭合');
});

test('大表格截断并标记，不将 500 行的完整文件误报为截断', () => {
  const text = Array.from({ length: MAX_PREVIEW_ROWS }, () => 'a,b').join('\n');
  expect(parseDelimitedText(text).truncated).toBe(false);
  expect(parseDelimitedText(`${text}\nmore,row`).rows).toHaveLength(MAX_PREVIEW_ROWS);
  expect(parseDelimitedText(`${text}\nmore,row`).truncated).toBe(true);
  expect(
    parseDelimitedText(Array.from({ length: MAX_PREVIEW_COLUMNS + 1 }, () => 'a').join(','))
      .truncated,
  ).toBe(true);
});

test('根据扩展名及 MIME 识别格式，旧版 Office 不会被误识别为文本', () => {
  expect(getFileKind({ name: 'REPORT.DOCX', type: '' })).toBe('word');
  expect(getFileKind({ name: 'download', type: 'application/pdf' })).toBe('pdf');
  expect(getFileKind({ name: 'unknown.doc', type: 'text/plain' })).toBe('unsupported');
  expect(getFileKind({ name: 'data.tsv', type: '' })).toBe('spreadsheet');
  expect(getFileKind({ name: 'slides.pptx', type: '' })).toBe('presentation');
  expect(getFileKind({ name: 'binary.exe', type: '' })).toBe('unsupported');
});

test('ZIP 流正确读取文件，并拒绝超过限制的解压内容', async () => {
  const zip = new JSZip().file('sample.txt', 'hello');
  const entry = zip.file('sample.txt');
  expect(entry).not.toBeNull();
  expect(new TextDecoder().decode(await readArchiveEntry(entry!))).toBe('hello');
  await expect(readArchiveEntry(entry!, 2)).rejects.toThrow('超过预览大小限制');
});

test('URL 文件加载保留调用方名称与 MIME，使用同源凭据', async () => {
  const signal = new AbortController().signal;
  const read = jest
    .fn()
    .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('hello') })
    .mockResolvedValueOnce({ done: true });
  const fetchMock = jest.fn().mockResolvedValue({
    ok: true,
    headers: new Headers({ 'content-type': 'text/plain' }),
    body: { getReader: () => ({ read, releaseLock: jest.fn() }) },
  });
  Object.defineProperty(globalThis, 'fetch', { configurable: true, value: fetchMock });
  const file = await loadRemoteFile('https://example.com/download', 'hello.txt', signal);
  expect(file.name).toBe('hello.txt');
  expect(file.size).toBe(5);
  expect(fetchMock).toHaveBeenCalledWith(new URL('https://example.com/download'), {
    signal,
    credentials: 'same-origin',
  });
});

test('URL 文件加载拒绝危险协议、HTTP 错误和流式超限响应', async () => {
  const signal = new AbortController().signal;
  await expect(loadRemoteFile('javascript:alert(1)', '', signal)).rejects.toThrow('HTTP');
  const fetchMock = jest
    .fn()
    .mockResolvedValueOnce({ ok: false, status: 404 })
    .mockResolvedValueOnce({
      ok: true,
      headers: new Headers(),
      body: {
        getReader: () => ({
          read: jest
            .fn()
            .mockResolvedValue({ done: false, value: { byteLength: MAX_FILE_SIZE + 1 } }),
          cancel: jest.fn(),
          releaseLock: jest.fn(),
        }),
      },
    });
  Object.defineProperty(globalThis, 'fetch', { configurable: true, value: fetchMock });
  await expect(loadRemoteFile('https://example.com/missing', '', signal)).rejects.toThrow('404');
  await expect(loadRemoteFile('https://example.com/large', '', signal)).rejects.toThrow('50 MB');
});
