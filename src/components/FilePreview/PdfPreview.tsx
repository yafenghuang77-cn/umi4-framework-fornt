import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import { useEffect, useRef, useState } from 'react';

import { Button } from 'antd';
import { Document, Page, pdfjs } from 'react-pdf';

import { PreviewError, PreviewLoading } from './Feedback';
import styles from './index.less';
import PreviewPagination from './PreviewPagination';

const assetPath = `/framework/pdfjs/${pdfjs.version}/`;
pdfjs.GlobalWorkerOptions.workerSrc = `${assetPath}pdf.worker.min.mjs`;
const options = {
  cMapUrl: `${assetPath}cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `${assetPath}standard_fonts/`,
  wasmUrl: `${assetPath}wasm/`,
  isEvalSupported: false,
};

export default function PdfPreview({ file }: { file: File }) {
  const [pages, setPages] = useState(0);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [width, setWidth] = useState(600);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!container.current) {
      return;
    }
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(200, entry.contentRect.width - 32)),
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={container}>
      <PreviewPagination label="PDF " current={page} total={pages} onChange={setPage} showJump>
        <Button
          aria-label="缩小"
          onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
          disabled={zoom <= 0.5}
        >
          缩小
        </Button>
        <span>{Math.round(zoom * 100)}%</span>
        <Button
          aria-label="放大"
          onClick={() => setZoom(Math.min(2, zoom + 0.25))}
          disabled={zoom >= 2}
        >
          放大
        </Button>
      </PreviewPagination>
      <div className={styles.pdfCanvas}>
        {passwordRequired ? (
          <PreviewError message="此 PDF 需要密码，请下载后使用 PDF 软件打开。" />
        ) : (
          <Document
            file={file}
            options={options}
            onLoadSuccess={({ numPages }) => {
              setPages(numPages);
              setPage(1);
            }}
            loading={<PreviewLoading />}
            error={<PreviewError message="PDF 可能已损坏或需要密码，请下载后检查文件。" />}
            onPassword={() => setPasswordRequired(true)}
          >
            <Page
              pageNumber={page}
              width={Math.min(width, 900) * zoom}
              loading={<PreviewLoading />}
              error={<PreviewError message="此页无法渲染，请尝试其他页或下载文件。" />}
            />
          </Document>
        )}
      </div>
    </div>
  );
}
