import { Component, lazy, type ReactNode, Suspense, useEffect, useState } from 'react';

import { ArrowLeftOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Empty, Result, Space, Tag, Typography } from 'antd';

import {
  downloadFile,
  FILE_KIND_LABELS,
  formatFileSize,
  getFileKind,
  getUnsupportedReason,
  loadRemoteFile,
  MAX_FILE_SIZE,
} from '@/utils/file';

import { PreviewError, PreviewLoading } from './Feedback';
import styles from './index.less';
import MediaPreview from './MediaPreview';

const PdfPreview = lazy(() => import('./PdfPreview'));
const WordPreview = lazy(() => import('./WordPreview'));
const SpreadsheetPreview = lazy(() => import('./SpreadsheetPreview'));
const TextPreview = lazy(() => import('./TextPreview'));
const ArchivePreview = lazy(() => import('./ArchivePreview'));
const PresentationPreview = lazy(() => import('./PresentationPreview'));

/** 传入 file 或 url；fileName 可用于没有扩展名的下载链接。 */
export interface FilePreviewProps {
  file?: File;
  url?: string;
  fileName?: string;
  className?: string;
}

class PreviewBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <PreviewError message="预览组件加载失败，请关闭预览后重试，或下载文件查看。" />
    ) : (
      this.props.children
    );
  }
}

function PreviewContent({ file, onOpenFile }: { file: File; onOpenFile: (file: File) => void }) {
  if (file.size > MAX_FILE_SIZE) {
    return <PreviewError message="文件超过 50 MB，请下载后在本地打开。" />;
  }
  switch (getFileKind(file)) {
    case 'pdf':
      return <PdfPreview file={file} />;
    case 'word':
      return <WordPreview file={file} />;
    case 'spreadsheet':
      return <SpreadsheetPreview file={file} />;
    case 'presentation':
      return <PresentationPreview file={file} />;
    case 'markdown':
    case 'text':
      return <TextPreview file={file} />;
    case 'image':
    case 'audio':
    case 'video':
      return <MediaPreview file={file} />;
    case 'archive':
      return <ArchivePreview file={file} onOpenFile={onOpenFile} />;
    default:
      return (
        <Result
          status="info"
          title="此文件暂不支持在线预览"
          subTitle={getUnsupportedReason(file)}
        />
      );
  }
}

function LocalPreview({ file }: { file: File }) {
  const [source, setSource] = useState(file);
  const [nested, setNested] = useState<{ source: File; files: File[] }>({
    source: file,
    files: [],
  });
  const files = nested.source === file ? nested.files : [];
  const current = files.at(-1) || file;
  const [version, setVersion] = useState(0);
  if (source !== file) {
    setSource(file);
    setNested({ source: file, files: [] });
    setVersion(version + 1);
  }
  return (
    <>
      <div className={styles.previewHeader}>
        <Space wrap className={styles.fileInfo}>
          {files.length > 0 && (
            <Button
              icon={<ArrowLeftOutlined aria-hidden="true" />}
              onClick={() => {
                setNested({ source: file, files: files.slice(0, -1) });
                setVersion(version + 1);
              }}
            >
              返回压缩包
            </Button>
          )}
          <Typography.Text className={styles.filename}>{current.name}</Typography.Text>
          <Tag>{FILE_KIND_LABELS[getFileKind(current)]}</Tag>
          <Typography.Text type="secondary">{formatFileSize(current.size)}</Typography.Text>
        </Space>
        <Button
          icon={<DownloadOutlined aria-hidden="true" />}
          onClick={() => downloadFile(current)}
        >
          下载文件
        </Button>
      </div>
      <PreviewBoundary key={version}>
        <Suspense fallback={<PreviewLoading />}>
          <PreviewContent
            file={current}
            onOpenFile={(entry) => {
              setNested({ source: file, files: [...files, entry] });
              setVersion(version + 1);
            }}
          />
        </Suspense>
      </PreviewBoundary>
    </>
  );
}

function RemotePreview({ url, fileName }: { url: string; fileName?: string }) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ url: string; name?: string; file?: File; error?: string }>();
  useEffect(() => {
    const controller = new AbortController();
    setState(undefined);
    loadRemoteFile(url, fileName || '', controller.signal).then(
      (file) => {
        if (!controller.signal.aborted) {
          setState({ url, name: fileName, file });
        }
      },
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            url,
            name: fileName,
            error:
              error instanceof TypeError
                ? '无法加载文件，请检查链接、网络及服务端跨域配置。'
                : error instanceof Error
                  ? error.message
                  : '文件加载失败。',
          });
        }
      },
    );
    return () => controller.abort();
  }, [url, fileName, attempt]);
  if (!state || state.url !== url || state.name !== fileName) {
    return <PreviewLoading />;
  }
  if (state.error) {
    return (
      <Space orientation="vertical" className={styles.fullWidth}>
        <PreviewError message={state.error} />
        <Button
          icon={<ReloadOutlined aria-hidden="true" />}
          onClick={() => setAttempt(attempt + 1)}
        >
          重新加载
        </Button>
      </Space>
    );
  }
  return state.file ? <LocalPreview key={attempt} file={state.file} /> : <PreviewLoading />;
}

export default function FilePreview({ file, url, fileName, className }: FilePreviewProps) {
  return (
    <div className={[styles.preview, className].filter(Boolean).join(' ')}>
      {file ? (
        <LocalPreview key={`${file.name}:${file.size}:${file.lastModified}`} file={file} />
      ) : url ? (
        <RemotePreview url={url} fileName={fileName} />
      ) : (
        <Empty description="请选择文件，或传入文件链接" />
      )}
    </div>
  );
}
