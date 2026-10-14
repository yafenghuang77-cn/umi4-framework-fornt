export type FileKind =
  | 'image'
  | 'pdf'
  | 'word'
  | 'spreadsheet'
  | 'presentation'
  | 'markdown'
  | 'text'
  | 'audio'
  | 'video'
  | 'archive'
  | 'unsupported';

export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const MAX_TEXT_SIZE = 2 * 1024 * 1024;
export const MAX_OFFICE_SIZE = 20 * 1024 * 1024;
export const MAX_PREVIEW_ROWS = 500;
export const MAX_PREVIEW_COLUMNS = 100;

export const FILE_KIND_LABELS: Record<FileKind, string> = {
  image: '图片',
  pdf: 'PDF',
  word: 'Word',
  spreadsheet: '表格',
  presentation: '演示文稿',
  markdown: 'Markdown',
  text: '文本 / 代码',
  audio: '音频',
  video: '视频',
  archive: '压缩包',
  unsupported: '其他',
};

const extensions: Partial<Record<FileKind, string[]>> = {
  image: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'],
  pdf: ['pdf'],
  word: ['docx'],
  spreadsheet: ['xlsx', 'csv', 'tsv'],
  presentation: ['pptx'],
  markdown: ['md', 'markdown', 'mdx'],
  text: [
    'txt',
    'log',
    'json',
    'xml',
    'yaml',
    'yml',
    'toml',
    'ini',
    'conf',
    'env',
    'js',
    'jsx',
    'ts',
    'tsx',
    'css',
    'less',
    'scss',
    'html',
    'htm',
    'vue',
    'sql',
    'sh',
    'py',
    'java',
    'c',
    'cpp',
    'h',
    'go',
    'rs',
    'rb',
    'php',
  ],
  audio: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus'],
  video: ['mp4', 'webm', 'ogv', 'mov', 'm4v'],
  archive: ['zip'],
};

const legacyOffice = ['doc', 'xls', 'ppt', 'rtf', 'odt', 'ods', 'odp'];

export function getFileExtension(name: string) {
  const basename = name.split(/[\\/]/).pop() || '';
  const dot = basename.lastIndexOf('.');
  return dot < 0 ? '' : basename.slice(dot + 1).toLowerCase();
}

export function getFileKind(file: Pick<File, 'name' | 'type'>): FileKind {
  const extension = getFileExtension(file.name);
  if (legacyOffice.includes(extension)) {
    return 'unsupported';
  }
  for (const [kind, values] of Object.entries(extensions)) {
    if (values.includes(extension)) {
      return kind as FileKind;
    }
  }
  const mime = file.type.toLowerCase().split(';')[0];
  if (mime === 'application/pdf') {
    return 'pdf';
  }
  if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return 'word';
  }
  if (mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    return 'spreadsheet';
  }
  if (mime === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    return 'presentation';
  }
  if (mime === 'application/zip' || mime === 'application/x-zip-compressed') {
    return 'archive';
  }
  if (mime === 'text/markdown') {
    return 'markdown';
  }
  if (mime === 'text/csv' || mime === 'text/tab-separated-values') {
    return 'spreadsheet';
  }
  if (mime.startsWith('image/')) {
    return 'image';
  }
  if (mime.startsWith('audio/')) {
    return 'audio';
  }
  if (mime.startsWith('video/')) {
    return 'video';
  }
  if (mime.startsWith('text/') || ['application/json', 'application/xml'].includes(mime)) {
    return 'text';
  }
  return 'unsupported';
}

export function formatFileSize(bytes: number) {
  if (bytes === 0) {
    return '0 B';
  }
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 3);
  return `${Number((bytes / 1024 ** unit).toFixed(unit === 0 ? 0 : 1))} ${['B', 'KB', 'MB', 'GB'][unit]}`;
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  // 留出浏览器开始下载的时间，再释放临时地址。
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function getUnsupportedReason(file: File) {
  if (legacyOffice.includes(getFileExtension(file.name))) {
    return '请先将文件转换为 DOCX、XLSX、PPTX 或 PDF，再导入预览。';
  }
  return '此格式暂不支持浏览器内预览，可以下载后使用对应的软件打开。';
}

export interface DelimitedPreview {
  rows: string[][];
  truncated: boolean;
}

// 支持引号内换行、分隔符、双引号转义及 UTF-8 BOM；限制渲染规模。
export function parseDelimitedText(source: string, delimiter = ','): DelimitedPreview {
  const text = source.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  let truncated = false;
  function pushCell() {
    if (row.length < MAX_PREVIEW_COLUMNS) {
      row.push(cell);
    } else {
      truncated = true;
    }
    cell = '';
  }
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (quoted || cell === '') {
        quoted = !quoted;
      } else {
        cell += char;
      }
    } else if (char === delimiter && !quoted) {
      pushCell();
    } else if ((char === '\n' || char === '\r') && !quoted) {
      pushCell();
      rows.push(row);
      row = [];
      if (char === '\r' && text[i + 1] === '\n') {
        i += 1;
      }
      if (rows.length === MAX_PREVIEW_ROWS) {
        return { rows, truncated: truncated || i < text.length - 1 };
      }
    } else {
      cell += char;
    }
  }
  if (quoted) {
    throw new Error('表格中的引号未闭合，请检查 CSV / TSV 文件。');
  }
  if (cell || row.length || (text && !/[\r\n]$/.test(text))) {
    pushCell();
    rows.push(row);
  }
  return { rows, truncated };
}

export async function loadRemoteFile(
  address: string,
  name: string,
  signal: AbortSignal,
): Promise<File> {
  const url = new URL(address, window.location.href);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('请输入 HTTP 或 HTTPS 文件链接。');
  }
  const response = await fetch(url, { signal, credentials: 'same-origin' });
  if (!response.ok) {
    throw new Error(`文件加载失败（HTTP ${response.status}）。`);
  }
  if (Number(response.headers.get('content-length')) > MAX_FILE_SIZE) {
    await response.body?.cancel();
    throw new Error('文件超过 50 MB，请下载后在本地打开。');
  }
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('浏览器无法读取此文件响应。');
  }
  const parts: Array<Uint8Array<ArrayBuffer>> = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      total += value.byteLength;
      if (total > MAX_FILE_SIZE) {
        await reader.cancel();
        throw new Error('文件超过 50 MB，请下载后在本地打开。');
      }
      parts.push(new Uint8Array(value));
    }
  } finally {
    reader.releaseLock();
  }
  let inferredName = '未命名文件';
  try {
    inferredName = decodeURIComponent(url.pathname.split('/').pop() || inferredName);
  } catch {
    /* 非规范 URL 编码使用默认名称。 */
  }
  return new File(parts, name.trim() || inferredName, {
    type: response.headers.get('content-type')?.split(';')[0] || '',
  });
}
